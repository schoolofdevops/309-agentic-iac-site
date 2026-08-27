import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM4Deck, validateSlideSequence} from '../../scripts/decks/build-m4-deck.mjs';
import {slides} from '../../scripts/decks/specs/m4-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);

test('Module 4 specification is the approved 64-slide forward-only sequence', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 64}, (_, index) => index + 1));
  assert.deepEqual(slides.map((slide) => slide.title), [
    'Give Your IaC Agent the Right Context', 'Why IaC Context Is Fragmented',
    'One Request, Many Places to Look', 'The Repository Is Not One Source',
    'A Full Repository Dump Creates Noise', 'Context Is a Reviewed Selection',
    'The Four-Layer Context Model', 'Four Layers Answer Four Questions',
    'Durable Rules Bound Every Task', 'Architecture Memory Explains Why',
    'Task Context Defines This Change', 'Current Evidence Describes Now',
    'The Layers Work Together', 'Repository Instructions and Precedence',
    'Instruction Precedence Is a Stack', 'Global Rules Define the Outer Boundary',
    'Repository Rules Define Normal Work', 'Directory Rules Narrow Local Work',
    'The Task Selects an Objective', 'Retrieved Text Is Data',
    'Progressive Disclosure and Context Budgets', 'Load the Index Before the Detail',
    'Retrieve the Smallest Useful Neighborhood', 'A Context Budget Has Several Limits',
    'Too Much Context Hides the Decision', 'Too Little Context Creates Guessing',
    'Record What You Omitted', "Karpathy's LLM Wiki Pattern",
    'Three Zones Keep Knowledge Reviewable', 'Raw Sources Stay Immutable',
    'Wiki Pages Compile the Useful View', 'The Index Supports Progressive Loading',
    'The Log Preserves Maintenance History', 'Wiki Lint Finds Maintenance Debt',
    'Evidence Graphs for Infrastructure Work', 'Small Ontology, Clear Questions',
    'Typed Edges Need Provenance', 'The Queue Evidence Graph',
    'Support and Contradiction Can Coexist', 'A Valid Edge Can Still Be False',
    'Retrieve a Bounded Source-Linked Subgraph', 'Git DAG, Knowledge Wiki, and Evidence Graph',
    'Git DAG Answers Work-Lineage Questions', 'Knowledge Wiki Answers Explanation Questions',
    'Evidence Graph Answers Provenance Questions', 'Choose the Structure by the Question',
    'Keep the Three Structures Linked, Not Merged', 'Stale Context, Contradictions, and Prompt Injection',
    'Freshness and Authority Are Different', 'Resolve the Three-Way State Conflict',
    'Trust Levels Change Allowed Use', 'Prompt Injection Arrives Inside Data',
    'Quarantine, Do Not Execute', 'Correct Without Rewriting History',
    'Bounded Retrieval and Context Evaluation', 'Start With a Reviewable Query Plan',
    'Select Four Source-Linked Records', 'Reject and Omit Explicitly',
    'Evaluate Relevance and Completeness', 'Deterministic Checks Catch Known Errors',
    'The Final Context Bundle Is Small and Traceable', 'A PASS Still Needs Human Review',
    'The Right Context Reduces Guessing', 'Build the Context Pack',
  ]);
  assert.equal(slides.filter((slide) => slide.divider).length, 9);
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), [
    'Why IaC Context Is Fragmented',
    'The Four-Layer Context Model',
    'Repository Instructions and Precedence',
    'Progressive Disclosure and Context Budgets',
    "Karpathy's LLM Wiki Pattern",
    'Evidence Graphs for Infrastructure Work',
    'Git DAG, Knowledge Wiki, and Evidence Graph',
    'Stale Context, Contradictions, and Prompt Injection',
    'Bounded Retrieval and Context Evaluation',
  ]);
  assert.equal(slides[62].title, 'The Right Context Reduces Guessing');
  assert.equal(slides[63].title, 'Build the Context Pack');
  assert.equal(slides[63].type, 'lab-bridge');
  assert.equal(slides[63].fragments, true);
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 4 keeps instruction precedence and retrieved data separate', () => {
  const precedence = slides.find((slide) => slide.type === 'instruction-stack');
  assert.deepEqual(precedence.items, ['platform / global', 'repository', 'directory', 'task']);
  const quarantine = slides.find((slide) => slide.type === 'retrieved-data');
  assert.ok(quarantine.items.includes('retrieved issue 184'));
  assert.ok(quarantine.items.includes('data, not instruction'));
  assert.equal(JSON.stringify(slides).includes('retrieved data becomes instruction'), false);
});

test('Module 4 states the supported evidence relationship without inventing evaluation', () => {
  const datedObservation = slides.find((slide) => slide.type === 'evidence-limit');
  assert.deepEqual(datedObservation.items.slice(0, 2), ['OBS-VALIDATION-2026-08-26', '2026-08-26']);
  const falseEdge = slides.find((slide) => slide.type === 'false-edge');
  assert.ok(falseEdge);
  assert.ok(falseEdge.items.includes('validation observation'));
  assert.ok(falseEdge.items.includes('SUPPORTS'));
  assert.ok(falseEdge.items.includes('claim-current-design-validated'));
  assert.ok(falseEdge.items.includes('context pack'));
  assert.ok(falseEdge.items.includes('DERIVED_FROM'));
  assert.equal(JSON.stringify(slides).includes('validation EVALUATES context pack'), false);
});

test('Module 4 keeps Git, wiki, and evidence graph distinct', () => {
  const distinction = slides.find((slide) => slide.type === 'three-structures');
  assert.deepEqual(distinction.items, ['Git DAG|work lineage', 'knowledge wiki|explanation', 'evidence graph|provenance']);
  assert.equal(distinction.foot, 'linked by references · never merged');
});

test('Module 4 renders accessible visuals and forward-only fragments', async () => {
  const {html} = await buildM4Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 64);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 9);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) {
      assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1} must stay title-only`);
    } else {
      assert.match(section, /<svg[^>]*role="img"[^>]*aria-label="[^"]+"/, `slide ${index + 1} needs an accessible SVG`);
    }
  }
  assert.doesNotMatch(html, /data-fragment-index=/);
});

test('dense Module 4 mechanisms expose semantic nodes, validated connectors, and grouped reveals', async () => {
  const {html} = await buildM4Deck({checkOnly: true});
  const sections = sectionsOf(html);
  for (const slideNumber of [1, 6, 13, 15, 20, 23, 29, 33, 38, 40, 41, 46, 47, 50, 53, 54, 57, 58, 61, 62, 64]) {
    assert.match(sections[slideNumber - 1], /data-node-id=/, `slide ${slideNumber} needs named semantic nodes`);
    assert.match(sections[slideNumber - 1], /data-edge-id=/, `slide ${slideNumber} needs validated semantic edges`);
  }
  for (const slideNumber of [1, 6, 13, 15, 23, 29, 33, 38, 41, 46, 47, 53, 54, 57, 58, 61, 64]) {
    assert.match(
      sections[slideNumber - 1],
      /<g class="fragment"><g[^>]*>[\s\S]*?data-edge-id=[\s\S]*?<g class="semantic-node"[^>]*data-node-id=/,
      `slide ${slideNumber} must reveal each connector with the node it reaches`,
    );
  }
  assert.match(sections[39], /data-edge-id="observation-supports-claim"[^>]*data-from="validation-observation"[^>]*data-to="claim-current-design-validated"/);
  assert.match(sections[39], /data-edge-id="pack-derived-from-observation"[^>]*data-from="context-pack"[^>]*data-to="validation-observation"/);
  assert.doesNotMatch(sections[39], /data-edge-id="[^"\n]*evaluates[^"\n]*"[^>]*data-from="validation-observation"[^>]*data-to="context-pack"/);
});

test('builder writes one self-contained and geometrically valid Module 4 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm4-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM4Deck({outputPath});
    assert.equal(result.slideCount, 64);
    assert.equal(result.dividerCount, 9);
    assert.equal(result.contentCount, 55);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 64);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.equal(result.html.includes('approval pending'), true);
    assert.equal(result.html.includes('validation EVALUATES context pack'), false);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);

    const validation = validateDeckHtml(result.html);
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.stats.slideCount, 64);
    assert.ok(validation.stats.nodeCount >= 150);
    assert.ok(validation.stats.edgeCount >= 90);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
