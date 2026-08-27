import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM3Deck, validateSlideSequence} from '../../scripts/decks/build-m3-deck.mjs';
import {slides} from '../../scripts/decks/specs/m3-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

test('Module 3 specification is the approved 52-slide forward-only sequence', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 52}, (_, index) => index + 1));
  assert.equal(slides.filter((slide) => slide.divider).length, 8);
  assert.equal(slides[50].title, 'Approval Advances One Stage at a Time');
  assert.equal(slides[51].title, 'Next: Correct and Validate the Queue Design Pack');
  assert.equal(slides[51].type, 'lab-bridge');
  assert.equal(slides[51].fragments, true);
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 3 keeps protocol, controls, evidence, and approval claims separate', () => {
  const protocol = slides.find((slide) => slide.type === 'queue-interface');
  assert.ok(protocol);
  assert.deepEqual(protocol.items, ['job-queue', 'queue-publish', 'AMQP', '5671', 'TLS required', 'authenticated producers']);
  assert.equal(JSON.stringify(slides).includes('AMQPS'), false);

  const evidence = slides.find((slide) => slide.type === 'evidence-gates');
  assert.ok(evidence);
  assert.deepEqual(evidence.items, ['CALM schema', 'local semantic rules', 'organizational policy', 'named human approval', 'runtime observation']);

  const approval = slides.find((slide) => slide.type === 'approval-stages');
  assert.ok(approval);
  assert.equal(approval.foot, 'candidate ready for human review');
  assert.equal(JSON.stringify(slides).includes('design approved'), false);
});

test('Module 3 dependency and boundary mechanisms expose explicit semantic relationships', async () => {
  const result = await buildM3Deck({checkOnly: true});
  const sections = [...result.html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
  for (const slideNumber of [6, 26, 37, 44, 46, 48, 50, 51, 52]) {
    const section = sections[slideNumber - 1];
    assert.match(section, /data-node-id=/, `slide ${slideNumber} needs named semantic nodes`);
    assert.match(section, /data-edge-id=/, `slide ${slideNumber} needs validated semantic edges`);
  }
  assert.doesNotMatch(result.html, /<g[^>]*filter="url\(#rough\)"[^>]*>[\s\S]{0,120}<path data-edge-id=/);
});

test('dense Module 3 mechanisms use dedicated readable visuals', async () => {
  const {html} = await buildM3Deck({checkOnly: true});
  const sections = [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
  assert.match(sections[30], /data-node-id="drain-gate"/);
  assert.match(sections[36], /data-node-id="rollback-step-1"/);
  assert.match(sections[40], /data-node-id="bounded-api"/);
  assert.match(sections[41], /data-node-id="job-queue-anatomy"/);
  assert.match(sections[43], /data-edge-id="client-interacts-api"/);
  assert.match(sections[43], /queue-publish/);
  assert.match(sections[43], /queue-consume/);
  assert.match(sections[45], />external-client<\/tspan>/);
  assert.match(sections[45], />workload-platform<\/tspan>/);
  assert.match(sections[46], /data-node-id="evidence-gate-1"/);
  const designPackEdges = [...sections[49].matchAll(/<path[^>]*data-edge-id="[^"]+"[^>]*>/g)].map((match) => match[0]);
  assert.equal(designPackEdges.length, 7);
  assert.ok(designPackEdges.every((path) => path.includes('data-to="implementation-task"')));
  assert.match(sections[51], /read<\/tspan><tspan[^>]*>request/);
  for (const slideNumber of [6, 26, 37, 44, 47, 48, 51, 52]) {
    assert.match(
      sections[slideNumber - 1],
      /<g class="fragment"><g[^>]*>[\s\S]*?data-edge-id=[\s\S]*?<g class="semantic-node"[^>]*data-node-id=/,
      `slide ${slideNumber} must reveal each connector with the node it reaches`,
    );
  }
});

test('builder writes one self-contained and geometrically valid Module 3 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm3-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM3Deck({outputPath});
    assert.equal(result.slideCount, 52);
    assert.equal(result.dividerCount, 8);
    assert.equal(result.contentCount, 44);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 52);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.equal(result.html.includes('AMQPS'), false);
    assert.equal(result.html.includes('terraform apply'), false);
    assert.equal(result.html.includes('approval pending'), true);
    assert.ok((result.html.match(/data-edge-id=/g)?.length || 0) >= 55);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);

    const validation = validateDeckHtml(result.html);
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.stats.slideCount, 52);
    assert.ok(validation.stats.nodeCount >= 100);
    assert.ok(validation.stats.edgeCount >= 55);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
