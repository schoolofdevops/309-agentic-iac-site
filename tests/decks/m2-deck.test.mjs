import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM2Deck, validateSlideSequence} from '../../scripts/decks/build-m2-deck.mjs';
import {icons} from '../../scripts/decks/lib/primitives.mjs';
import {slides} from '../../scripts/decks/specs/m2-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

test('Module 2 specification is one exact 43-slide sequence', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 43}, (_, index) => index + 1));
  assert.equal(slides.filter((slide) => slide.divider).length, 8);
  assert.equal(slides.at(-1).title, 'Next: Repair and Prove the Terraform Change');
  assert.equal(slides.at(-1).type, 'icons');
  assert.equal(slides.at(-1).fragments, true);
  assert.throws(
    () => validateSlideSequence([{n: 2}, {n: 2}]),
    /duplicate slide number 2/,
  );
});

test('Module 2 covers the governed state machine and exact repair', () => {
  const stateMachine = slides.find((slide) => slide.type === 'state-machine');
  assert.ok(stateMachine);
  assert.deepEqual(stateMachine.items, ['proposed', 'authorized', 'changed', 'validated', 'approved', 'stopped', 'rejected']);
  assert.equal(stateMachine.items.includes('apply'), false);

  const repair = slides.find((slide) => slide.type === 'terraform-repair');
  assert.ok(repair);
  assert.deepEqual(repair.items, ['resource "random_id" "platform"', 'byte_length = 4', 'output.platform_name', 'random_id.platform.hex']);
});

test('six-step lab bridge remains inside the 1100-unit slide viewBox', () => {
  const html = icons(['inspect', 'reproduce', 'ask Codex', 'review diff', 'validate', 'stop']);
  const transforms = [...html.matchAll(/transform="translate\((\d+),0\)"/g)].map((match) => Number(match[1]));
  const widths = [...html.matchAll(/<rect x="0" y="80" width="(\d+)"/g)].map((match) => Number(match[1]));
  assert.equal(transforms.length, 6);
  assert.equal(widths.length, 6);
  assert.ok(transforms.every((x, index) => x + widths[index] <= 1100));
});

test('builder writes the complete Module 2 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm2-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM2Deck({outputPath});
    assert.equal(result.slideCount, 43);
    assert.equal(result.dividerCount, 8);
    assert.equal(result.contentCount, 35);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 43);
    assert.equal(result.html.includes('data-node-id="authorized"'), true);
    assert.equal(result.html.includes('data-node-id="apply"'), false);
    assert.equal(result.html.includes('terraform apply'), false);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.ok((result.html.match(/data-edge-id=/g)?.length || 0) > 20);
    assert.match(result.html, /<g fill="none"[^>]*><path data-edge-id="proposed-to-authorized"/);
    assert.doesNotMatch(result.html, /<g[^>]*filter="url\(#rough\)"[^>]*><path data-edge-id="proposed-to-authorized"/);

    const sections = [...result.html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
    const repairSlide = sections[38];
    assert.ok(repairSlide.indexOf('data-node-id="resource-block"') < repairSlide.indexOf('data-edge-id="resource-to-output"'));
    const dualEngineSlide = sections[39];
    assert.equal((dualEngineSlide.match(/class="fragment"/g) || []).length, 1);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);

    const validation = validateDeckHtml(result.html);
    assert.deepEqual(validation.errors, []);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
