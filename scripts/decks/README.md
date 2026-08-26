# Module 1 deck workflow

The Module 1 deck is generated from a checked-in slide specification and a checked-in CourseSmith shell. Do not hand-edit `static/decks/m1-agentic-iac-fundamentals.html`; rebuild it.

Run the complete author workflow from the site repository:

```bash
npm run deck:m1
npm run deck:check
npm run deck:render:m1
npm run typecheck
npm run build
```

## Geometry contract

Every semantic box records its ID and rectangle. Every semantic connector records its source, target, source port, target port, and SVG path. Sequence diagrams use explicit `top`, `right`, `bottom`, and `left` boundary ports. Hub diagrams use a computed `ray` intersection with both rectangle boundaries.

Generation validates every route before writing the deck. The independent committed-deck validator then parses the generated HTML and checks the same rules again. It rejects an arrow that starts or ends at the wrong boundary, points away from its target, crosses another box, enters its source or target interior incorrectly, lacks an arrowhead, or differs from a fresh build. Errors name the slide, edge, and affected node.

Connectors render before boxes, so valid lines remain behind the visible nodes. This removes the old failure mode where an arrow was drawn across a box label.

## Visual QA artifacts

`npm run deck:render:m1` uses local headless Chrome and writes 61 final-fragment PNGs plus `contact-sheet.html` under `.artifacts/decks/m1/`. This directory is intentionally ignored by Git.

The geometry engine, primitives, tests, renderer, and workflow are course-local proof. Once more modules exercise the contract, the reusable parts can be upstreamed into CourseSmith without making this course depend on an unverified global plugin change.
