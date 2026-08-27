import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM6Deck, validateSlideSequence} from '../../scripts/decks/build-m6-deck.mjs';
import {slides} from '../../scripts/decks/specs/m6-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);

test('Module 6 specification is a 60-slide forward-only sequence with eight lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 60}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), [
    'What Is an Agent Workflow Harness?',
    'Superpowers-Style Workflow Patterns',
    'Isolation, Checkpoints, and Recovery',
    'Evaluation Design for Agentic IaC',
    'Functional, Safety, and Regression Evals',
    'Run Telemetry and Failure Classification',
    'Token and Cost Engineering',
    'RTK, Caveman, and Evaluation-Driven Optimization',
  ]);
  assert.equal(slides[58].title, 'Make Agent Work Repeatable and Measurable');
  assert.equal(slides[59].title, 'Build and Evaluate the Two Runs');
  assert.equal(slides[59].type, 'lab-bridge');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 6 teaches four independent gates and the false-green boundary', () => {
  const gates = slides.find((slide) => slide.title === 'Four Gates Define Acceptance');
  assert.deepEqual(gates.items, ['accepted run', 'functional', 'safety', 'regression', 'budget']);
  const falseGreen = slides.find((slide) => slide.title === 'The Weak Suite Tells a Narrow Truth');
  assert.deepEqual(falseGreen.items, ['WEAK RESULT', 'PASS 1/1', 'COMPLETE RESULT', 'REJECTED 2/4']);
  assert.ok(slides.some((slide) => slide.title === 'PASS Means Ready for Human Review'));
});

test('Module 6 keeps estimate, billing, raw evidence, and approval separate', () => {
  const estimate = slides.find((slide) => slide.title === 'Estimate and Bill Are Different Fields');
  assert.deepEqual(estimate.items, ['COURSE ESTIMATE', 'bytes ÷ 4 + fixed rate', 'PROVIDER BILL', 'reported tokens + current price']);
  const logs = slides.find((slide) => slide.title === 'Raw Log and Run Card Serve Different Needs');
  assert.ok(logs.items.includes('RUN CARD'));
  assert.equal(JSON.stringify(slides).includes('approved for deployment'), false);
});

test('Module 6 compares the exact measured baseline and candidate', () => {
  const context = slides.find((slide) => slide.title === 'Select Context by Task Need');
  assert.ok(context.items.includes('selected + noisy = 416'));
  assert.ok(context.items.includes('selected only = 90'));
  const runs = slides.find((slide) => slide.title === 'Compare Whole Runs, Not One Metric');
  assert.ok(runs.items.includes('COMMANDS|12 → 3'));
  assert.ok(runs.items.includes('GATES|2 → 4'));
  assert.ok(slides.some((slide) => slide.items?.includes('better validator')));
});

test('Module 6 renders accessible visuals and forward-only fragments', async () => {
  const {html} = await buildM6Deck({checkOnly: true});
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

test('dense Module 6 flows expose semantic nodes, validated connectors, and grouped reveals', async () => {
  const {html} = await buildM6Deck({checkOnly: true});
  const sections = sectionsOf(html);
  for (const slideNumber of [1, 4, 5, 6, 8, 10, 12, 15, 18, 19, 20, 21, 22, 24, 25, 26, 30, 36, 39, 41, 44, 46, 51, 53, 55, 56, 59, 60]) {
    assert.match(sections[slideNumber - 1], /data-node-id=/, `slide ${slideNumber} needs semantic nodes`);
    assert.match(sections[slideNumber - 1], /data-edge-id=/, `slide ${slideNumber} needs semantic edges`);
  }
  for (const slideNumber of [1, 4, 5, 6, 8, 10, 12, 15, 18, 19, 20, 21, 22, 24, 25, 26, 30, 36, 39, 41, 44, 46, 51, 53, 55, 56, 59, 60]) {
    assert.match(
      sections[slideNumber - 1],
      /<g class="fragment"><g[^>]*>[\s\S]*?data-edge-id=[\s\S]*?<g class="semantic-node"[^>]*data-node-id=/,
      `slide ${slideNumber} must reveal each connector with the node it reaches`,
    );
  }
});

test('builder writes one self-contained, geometrically valid Module 6 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm6-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM6Deck({outputPath});
    assert.equal(result.slideCount, 60);
    assert.equal(result.dividerCount, 8);
    assert.equal(result.contentCount, 52);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 60);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.equal(result.html.includes('four gates'), true);
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
