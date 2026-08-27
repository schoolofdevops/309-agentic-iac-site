import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM5Deck, validateSlideSequence} from '../../scripts/decks/build-m5-deck.mjs';
import {slides} from '../../scripts/decks/specs/m5-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);

test('Module 5 specification is a 60-slide forward-only sequence with eight lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 60}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), [
    'Capability Boundaries for Agents',
    'CLI, API, MCP, Skill, or Manual Step?',
    'CLI as the Portable Execution and Evidence Plane',
    'Build an Agent Skill for Terraform Review',
    'Test, Version, Own, and Revoke Skills',
    'MCP for Narrow Context and Tool Access',
    'Tool and Skill Supply-Chain Threats',
    'Agent Adapters Without Vendor Lock-In',
  ]);
  assert.equal(slides[58].title, 'Give the Agent Less Power and Better Evidence');
  assert.equal(slides[59].title, 'Build the Bounded Capability Pack');
  assert.equal(slides[59].type, 'lab-bridge');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 5 teaches the five routes and makes the selected queue path explicit', () => {
  const routeDecision = slides.find((slide) => slide.type === 'five-routes');
  assert.deepEqual(routeDecision.items, ['CLI', 'API', 'MCP', 'Skill', 'manual']);
  assert.ok(slides.some((slide) => slide.title === 'CLI Fits a Stable Local Operation'));
  assert.ok(slides.some((slide) => slide.title === 'MCP Fits Discoverable Context or Tools'));
  assert.ok(slides.some((slide) => slide.title === 'Keep High-Risk Judgment Manual'));
});

test('Module 5 separates official mechanics from course controls', () => {
  const skill = slides.find((slide) => slide.type === 'skill-anatomy');
  assert.ok(skill.foot.includes('course addition'));
  const protocol = slides.find((slide) => slide.title === 'MCP Mechanics and Course Controls Differ');
  assert.deepEqual(protocol.items, ['MCP SPEC', 'messages + discovery', 'COURSE CONTROL', 'hashes + sandbox + approval']);
  assert.ok(slides.some((slide) => slide.items?.includes('2026-07-28')));
  assert.equal(JSON.stringify(slides).includes('metadata enforces'), false);
});

test('Module 5 keeps context, action, metadata, and enforcement boundaries visible', () => {
  const resourceVsTool = slides.find((slide) => slide.title === 'Resource and Tool Are Different Primitives');
  assert.deepEqual(resourceVsTool.items, ['RESOURCE', 'list + read data', 'TOOL', 'list + call function']);
  const poison = slides.find((slide) => slide.type === 'poisoned-metadata');
  assert.ok(poison.items.includes('“read only”'));
  assert.ok(poison.items.includes('delete or apply'));
  const pack = slides.find((slide) => slide.type === 'capability-pack');
  assert.ok(pack.items.map((item) => item.replaceAll('|', ' ')).includes('human review'));
  assert.equal(pack.foot, 'no plan or apply path');
});

test('Module 5 renders accessible visuals and forward-only fragments', async () => {
  const {html} = await buildM5Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 60);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 8);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) {
      assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1} must stay title-only`);
    } else {
      assert.match(section, /<svg[^>]*role="img"[^>]*aria-label="[^"]+"/, `slide ${index + 1} needs an accessible SVG`);
    }
  }
  assert.doesNotMatch(html, /data-fragment-index=/);
});

test('dense Module 5 flows expose semantic nodes, validated connectors, and grouped reveals', async () => {
  const {html} = await buildM5Deck({checkOnly: true});
  const sections = sectionsOf(html);
  for (const slideNumber of [1, 4, 5, 7, 9, 16, 17, 19, 21, 26, 30, 32, 36, 37, 39, 40, 41, 42, 48, 50, 51, 52, 55, 57, 58, 59, 60]) {
    assert.match(sections[slideNumber - 1], /data-node-id=/, `slide ${slideNumber} needs semantic nodes`);
    assert.match(sections[slideNumber - 1], /data-edge-id=/, `slide ${slideNumber} needs semantic edges`);
  }
  for (const slideNumber of [1, 4, 5, 7, 9, 16, 17, 19, 21, 26, 30, 32, 36, 37, 39, 40, 48, 50, 51, 52, 55, 57, 58, 59, 60]) {
    assert.match(
      sections[slideNumber - 1],
      /<g class="fragment"><g[^>]*>[\s\S]*?data-edge-id=[\s\S]*?<g class="semantic-node"[^>]*data-node-id=/,
      `slide ${slideNumber} must reveal each connector with the node it reaches`,
    );
  }
});

test('builder writes one self-contained, geometrically valid Module 5 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm5-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM5Deck({outputPath});
    assert.equal(result.slideCount, 60);
    assert.equal(result.dividerCount, 8);
    assert.equal(result.contentCount, 52);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 60);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.equal(result.html.includes('2026-07-28'), true);
    assert.equal(result.html.includes('human review'), true);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);

    const validation = validateDeckHtml(result.html);
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.stats.slideCount, 60);
    assert.ok(validation.stats.nodeCount >= 135);
    assert.ok(validation.stats.edgeCount >= 75);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
