# Deck Connector Geometry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct every connector in the Module 1 deck and ship a deterministic generator, collision validator, and complete visual-review workflow that prevents connector regressions.

**Architecture:** A small pure-JavaScript geometry library owns rectangles, boundary ports, routes, and collision checks. Reusable visual primitives emit SVG with machine-readable node and edge metadata. A deterministic Module 1 builder consumes a checked-in slide specification and deck shell, validates before replacing the generated HTML, and a separate validator rechecks the committed artifact.

**Tech Stack:** Node.js 20+ ESM, built-in `node:test`, SVG, self-contained Reveal.js HTML, Docusaurus 3.10, Chrome headless authoring checks

**Spec:** `docs/superpowers/specs/2026-08-26-deck-connector-geometry-design.md`

## Global Constraints

- Preserve exactly 61 slides: 10 dividers and 51 content slides.
- Preserve every approved title, subtitle, footer, narration marker, and slide number.
- Add no runtime or learner dependency.
- Keep the generated deck self-contained and below 800 KB.
- Semantic connectors must start and end on declared node boundaries and carry `marker-end`.
- A connector may not enter an unrelated node rectangle expanded by six SVG units.
- Labels remain protected by the node rectangle collision rule.
- Generated output replaces the committed deck only after validation succeeds.
- Authoring commands must resolve paths from `import.meta.url`, not a current working directory or hard-coded user path.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/decks/lib/geometry.mjs` | Rectangle ports, SVG path construction, curve sampling, endpoint and collision validation |
| `scripts/decks/lib/primitives.mjs` | CourseSmith-style pipeline, loop, hub, cards, comparison, ladder, boundary, and icon renderers |
| `scripts/decks/specs/m1-slides.mjs` | The exact 61-slide Module 1 content and visual specification |
| `scripts/decks/deck-shell.html.tmpl` | Checked-in self-contained CourseSmith/Reveal shell with `{{slides}}` insertion token |
| `scripts/decks/build-m1-deck.mjs` | Deterministic generation, pre-write validation, temporary output, and atomic replacement |
| `scripts/decks/validate-deck.mjs` | Independent committed-HTML structure and connector gate |
| `scripts/decks/render-m1-deck.mjs` | Chrome detection, 61 PNG captures, final-fragment hashes, and contact-sheet HTML |
| `scripts/decks/README.md` | Author commands, invariants, failure interpretation, and CourseSmith upstream path |
| `tests/decks/geometry.test.mjs` | Pure geometry red-green tests |
| `tests/decks/primitives.test.mjs` | SVG metadata and route behavior tests |
| `tests/decks/m1-deck.test.mjs` | Slide sequence, committed artifact, freshness, and broken-deck regression tests |
| `package.json` | `deck:m1`, `deck:check`, and `deck:render:m1` scripts |
| `.gitignore` | Ignore `.artifacts/decks/` |
| `static/decks/m1-agentic-iac-fundamentals.html` | Regenerated learner deck |

---

### Task 1: Rectangle ports and collision-safe routes

**Files:**
- Create: `tests/decks/geometry.test.mjs`
- Create: `scripts/decks/lib/geometry.mjs`

**Interfaces:**
- Produces: `rect(id, x, y, width, height) -> Rect`
- Produces: `port(node, name) -> {x, y}`
- Produces: `linePath(start, end) -> Route`
- Produces: `cubicPath(start, control1, control2, end) -> Route`
- Produces: `sampleRoute(route, steps = 100) -> Point[]`
- Produces: `validateEdge(edge, nodes, {clearance = 6}) -> string[]`

- [x] **Step 1: Write failing geometry tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {cubicPath, port, rect, validateEdge} from '../../scripts/decks/lib/geometry.mjs';

test('ports use exact rectangle boundaries', () => {
  const node = rect('observe', 810, 145, 170, 70);
  assert.deepEqual(port(node, 'top'), {x: 895, y: 145});
  assert.deepEqual(port(node, 'right'), {x: 980, y: 180});
  assert.deepEqual(port(node, 'bottom'), {x: 895, y: 215});
  assert.deepEqual(port(node, 'left'), {x: 810, y: 180});
});

test('a clockwise corner avoids both nodes', () => {
  const observe = rect('observe', 810, 145, 170, 70);
  const verify = rect('verify', 585, 265, 170, 70);
  const route = cubicPath(
    port(observe, 'bottom'),
    {x: 895, y: 250},
    {x: 790, y: 300},
    port(verify, 'right'),
  );
  assert.deepEqual(validateEdge({id: 'observe-to-verify', from: observe.id, to: verify.id, route}, [observe, verify]), []);
});

test('a route through an unrelated node reports the collision', () => {
  const source = rect('source', 0, 0, 100, 50);
  const blocker = rect('blocker', 140, 0, 100, 50);
  const target = rect('target', 280, 0, 100, 50);
  const route = cubicPath(port(source, 'right'), {x: 160, y: 25}, {x: 220, y: 25}, port(target, 'left'));
  assert.match(validateEdge({id: 'bad', from: 'source', to: 'target', route}, [source, blocker, target]).join('\n'), /bad.*blocker/);
});
```

- [x] **Step 2: Run the geometry test and verify RED**

Run:

```bash
node --test tests/decks/geometry.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/decks/lib/geometry.mjs`.

- [x] **Step 3: Implement the pure geometry module**

Use frozen rectangle records, an explicit `PORTS` switch, SVG `L` and `C` route records, De Casteljau cubic evaluation, 101 samples, six-unit inflated unrelated-node rectangles, source/target boundary tolerance, and final-tangent target-direction checks. Return every defect as a string containing the edge and node IDs; do not throw from `validateEdge`.

Core record forms:

```js
export const rect = (id, x, y, width, height) => Object.freeze({id, x, y, width, height});
export const linePath = (start, end) => ({kind: 'line', start, end, d: `M${start.x},${start.y} L${end.x},${end.y}`});
export const cubicPath = (start, c1, c2, end) => ({kind: 'cubic', start, c1, c2, end, d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`});
```

- [x] **Step 4: Run the geometry test and verify GREEN**

Run: `node --test tests/decks/geometry.test.mjs`

Expected: three tests pass with zero failures.

- [x] **Step 5: Commit the geometry unit**

```bash
git add scripts/decks/lib/geometry.mjs tests/decks/geometry.test.mjs
git commit -m "feat: add collision-safe deck geometry"
```

---

### Task 2: Metadata-bearing visual primitives

**Files:**
- Create: `tests/decks/primitives.test.mjs`
- Create: `scripts/decks/lib/primitives.mjs`

**Interfaces:**
- Consumes: `rect`, `port`, `linePath`, `cubicPath`, `validateEdge`
- Produces: `pipeline(items, options) -> string`
- Produces: `clockwiseLoop(items, options) -> string`
- Produces: `hub(items, options) -> string`
- Produces: `compare`, `cards`, `ladder`, `boundary`, and `icons` renderers
- Produces: `renderVisual(slide) -> string`

- [x] **Step 1: Write failing primitive tests**

Test the five-node and six-node loops separately. Parse `data-edge-id`, `data-from`, `data-to`, and each `d` value from the returned SVG string. Assert these exact edges:

```js
assert.match(fiveNodeSvg, /data-edge-id="human-run-to-read-result"[^>]+data-from-port="bottom"[^>]+data-to-port="right"/);
assert.match(fiveNodeSvg, /data-edge-id="read-result-to-ask"[^>]+data-from-port="left"[^>]+data-to-port="bottom"/);
assert.match(sixNodeSvg, /data-edge-id="verify-to-evidence"[^>]+data-from-port="left"[^>]+data-to-port="right"/);
assert.match(hubSvg, /data-edge-id="agentic-iac-to-intent"/);
assert.doesNotMatch(hubSvg, /M550,190/);
```

- [x] **Step 2: Run primitive tests and verify RED**

Run: `node --test tests/decks/primitives.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/decks/lib/primitives.mjs`.

- [x] **Step 3: Implement node and edge rendering**

Render node groups with:

```html
<g data-node-id="observe" data-x="810" data-y="145" data-width="170" data-height="70">...</g>
```

Render semantic paths with:

```html
<path data-edge-id="observe-to-verify" data-from="observe" data-to="verify"
      data-from-port="bottom" data-to-port="right"
      d="..." marker-end="url(#ahg)"/>
```

Use explicit clockwise edge definitions for five-node and six-node loops. Use ray-to-rectangle intersection for every hub edge. Validate each primitive's edge list before returning SVG and throw one combined error if a primitive creates invalid geometry.

- [x] **Step 4: Run primitive and geometry tests**

Run:

```bash
node --test tests/decks/geometry.test.mjs tests/decks/primitives.test.mjs
```

Expected: all tests pass.

- [x] **Step 5: Commit the primitive unit**

```bash
git add scripts/decks/lib/primitives.mjs tests/decks/primitives.test.mjs
git commit -m "feat: add anchored deck primitives"
```

---

### Task 3: Deterministic Module 1 deck builder

**Files:**
- Create: `scripts/decks/specs/m1-slides.mjs`
- Create: `scripts/decks/deck-shell.html.tmpl`
- Create: `scripts/decks/build-m1-deck.mjs`
- Create: `tests/decks/m1-deck.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `renderVisual(slide)` and the checked-in deck shell
- Produces: `buildM1Deck({outputPath, checkOnly}) -> {html, slideCount, dividerCount, contentCount}`
- Produces command: `npm run deck:m1`

- [x] **Step 1: Write failing deck-contract tests**

The test imports `slides` and `buildM1Deck`, then asserts:

```js
assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 61}, (_, index) => index + 1));
const result = await buildM1Deck({outputPath: temporaryOutput});
assert.equal(result.slideCount, 61);
assert.equal(result.dividerCount, 10);
assert.equal(result.contentCount, 51);
assert.equal(result.html.match(/class="pageno"/g)?.length, 61);
assert.equal(result.html.match(/data-edge-id=/g)?.length > 0, true);
```

Also construct a duplicate-number fixture and assert that generation rejects with `duplicate slide number 10`.

- [x] **Step 2: Run deck-contract tests and verify RED**

Run: `node --test tests/decks/m1-deck.test.mjs`

Expected: FAIL because the slide specification and builder modules do not exist.

- [x] **Step 3: Check in the deck shell and slide specification**

Create `deck-shell.html.tmpl` from the exact CourseSmith skeleton used by the current deck. Replace only the example slide region with `{{slides}}`. Copy the approved Module 1 slide data from `/tmp/build-m1-deck.mjs`, remove the duplicate slide-10 entry, add the title slide as slide 1, and export one ordered `slides` array containing numbers 1 through 61.

- [x] **Step 4: Implement safe generation**

Resolve all paths with `fileURLToPath(new URL(..., import.meta.url))`. Build into `<output>.tmp`, run structural and connector validation on the complete HTML, then rename the temporary file to the requested output. On failure, remove only the named temporary file and leave the committed deck untouched.

Add package commands:

```json
"deck:m1": "node scripts/decks/build-m1-deck.mjs",
"deck:check": "node --test tests/decks/*.test.mjs && node scripts/decks/validate-deck.mjs static/decks/m1-agentic-iac-fundamentals.html --fresh"
```

Add `.artifacts/decks/` to `.gitignore`.

- [x] **Step 5: Run builder tests and generate the corrected deck**

Run:

```bash
node --test tests/decks/m1-deck.test.mjs
npm run deck:m1
```

Expected: tests pass; builder reports `61 slides`, `10 dividers`, `51 content slides`; corrected HTML is written.

- [x] **Step 6: Commit the deterministic builder**

```bash
git add .gitignore package.json scripts/decks tests/decks/m1-deck.test.mjs static/decks/m1-agentic-iac-fundamentals.html
git commit -m "feat: make Module 1 deck generation deterministic"
```

---

### Task 4: Independent committed-deck validator

**Files:**
- Create: `scripts/decks/validate-deck.mjs`
- Modify: `tests/decks/m1-deck.test.mjs`

**Interfaces:**
- Produces: `validateDeckHtml(html) -> {errors: string[], stats: DeckStats}`
- Produces: `compareFreshDeck(committedPath) -> string[]`

- [x] **Step 1: Add a failing broken-HTML regression test**

Create a minimal SVG fixture with three node metadata groups and an edge whose `d` crosses the middle node. Assert:

```js
const result = validateDeckHtml(brokenHtml);
assert.match(result.errors.join('\n'), /slide M1.06.*edge source-to-target.*node blocker/);
```

Add a second fixture with an edge missing `marker-end` and assert the edge ID appears in the error.

- [x] **Step 2: Run the deck test and verify RED**

Run: `node --test tests/decks/m1-deck.test.mjs`

Expected: FAIL because `validateDeckHtml` is not exported.

- [x] **Step 3: Implement independent HTML parsing and validation**

Parse each `<section>...</section>`, its page number, node metadata, and edge metadata with narrow regular expressions limited to generator-owned attributes. Parse `M... L...` and `M... C...` path forms into geometry route records. Run `validateEdge` for every semantic connector and aggregate errors with slide IDs.

For `--fresh`, build to a temporary path, compare bytes with the committed deck, and report `generated deck differs from committed artifact` without replacing the committed file.

- [x] **Step 4: Run the complete deck gate**

Run: `npm run deck:check`

Expected: all unit tests pass and validator reports 61 slides with zero connector errors and a fresh committed artifact.

- [x] **Step 5: Commit the independent gate**

```bash
git add scripts/decks/validate-deck.mjs tests/decks/m1-deck.test.mjs package.json
git commit -m "test: validate deck connector geometry"
```

---

### Task 5: Repeatable visual rendering and documentation

**Files:**
- Create: `scripts/decks/render-m1-deck.mjs`
- Create: `scripts/decks/README.md`
- Modify: `package.json`

**Interfaces:**
- Produces command: `npm run deck:render:m1`
- Produces: `.artifacts/decks/m1/slide-01.png` through `slide-61.png`
- Produces: `.artifacts/decks/m1/contact-sheet.html`

- [x] **Step 1: Implement Chrome discovery and deterministic capture**

Search in this order: `CHROME_BIN`, `google-chrome`, `google-chrome-stable`, `chromium`, then `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Fail with `Chrome not found; set CHROME_BIN` when none exists.

Start a temporary local static server for the repository `static/` directory. For each slide, count its fragments, create a Reveal hash ending at its final fragment index, and run Chrome headless at 1280 by 720 with a 3000 ms virtual-time budget. Stop the server in a `finally` block.

- [x] **Step 2: Generate the contact sheet**

Write one self-contained HTML page with a responsive grid of the 61 PNG files. Each tile shows the slide number and title. Do not inline PNG bytes.

- [x] **Step 3: Document the author workflow**

Document these exact steps:

```bash
npm run deck:m1
npm run deck:check
npm run deck:render:m1
npm run typecheck
npm run build
```

Explain boundary ports, edge metadata, collision output, artifact location, and how the course-local proof can later be moved into CourseSmith.

- [x] **Step 4: Run rendering**

Run: `npm run deck:render:m1`

Expected: 61 PNG files and one contact sheet are created under `.artifacts/decks/m1/`.

- [x] **Step 5: Commit rendering and documentation**

```bash
git add scripts/decks/render-m1-deck.mjs scripts/decks/README.md package.json
git commit -m "docs: add repeatable deck visual QA"
```

---

### Task 6: Full audit, publication, and evidence

**Files:**
- Modify: `docs/superpowers/specs/2026-08-26-deck-connector-geometry-design.md`
- Modify: `docs/superpowers/plans/2026-08-26-deck-connector-geometry.md`

**Interfaces:**
- Consumes all authoring commands and the regenerated deck
- Produces the deployed public Module 1 deck and verification evidence

- [x] **Step 1: Run all deterministic checks**

```bash
npm run deck:check
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits zero.

- [x] **Step 2: Run the CourseSmith numeric deck audit**

Run the established split-repository audit overlay for Module 1. Expected: 15 numeric checks pass, zero fail; only the four previously reviewed duration/location warnings remain.

- [x] **Step 3: Review every rendered slide**

Open the contact sheet and inspect all 61 tiles. Open slides 3, 6, 7, 10, 19, 23, 27, 30, 32, and 60 at full size. Confirm no connector crosses a box or label and all arrowheads follow the intended sequence.

- [x] **Step 4: Update design and plan status**

Set the design status to `Implemented and verified`. Check every completed plan checkbox. Record the final commands, connector count, slide count, and public verification URL at the bottom of the plan.

- [ ] **Step 5: Commit, push, merge, and deploy**

```bash
git add docs/superpowers static/decks scripts/decks tests/decks package.json .gitignore
git commit -m "fix: correct Module 1 deck connectors"
git push origin m1-deck-geometry
```

Fast-forward the site `main` branch only after the branch checks pass, then push `main` to trigger GitHub Pages.

- [ ] **Step 6: Verify the deployment**

Wait for the GitHub Pages workflow to complete successfully. Fetch the public lesson and deck, verify the new generated HTML contains connector metadata, render public slides 6 and 7 in Chrome, and compare them with the locally approved geometry.

## Verification evidence

- `npm run deck:check`: 12 tests passed; 61 slides, 169 semantic nodes, and 141 connectors validated; committed output matches a fresh build.
- `npm run typecheck`: passed.
- `npm run build`: Docusaurus production build passed.
- CourseSmith Module 1 numeric audit: PASS with 13 checks and the four previously reviewed warnings.
- Visual QA: 61 final-fragment PNGs reviewed; slides 3, 6, 7, 10, 19, 23, 27, 30, 32, and 60 reviewed at full size.
- Public verification URL: pending deployment.
