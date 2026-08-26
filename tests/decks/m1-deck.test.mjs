import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM1Deck, validateSlideSequence} from '../../scripts/decks/build-m1-deck.mjs';
import {slides} from '../../scripts/decks/specs/m1-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

test('Module 1 specification is one exact 61-slide sequence', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 61}, (_, index) => index + 1));
  assert.throws(
    () => validateSlideSequence([{n: 10}, {n: 10}]),
    /duplicate slide number 10/,
  );
});

test('builder writes the complete approved Module 1 deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm1-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM1Deck({outputPath});
    assert.equal(result.slideCount, 61);
    assert.equal(result.dividerCount, 10);
    assert.equal(result.contentCount, 51);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 61);
    assert.ok((result.html.match(/data-edge-id=/g)?.length || 0) > 0);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

const node = (id, x, y, width, height) => `<g data-node-id="${id}" data-x="${x}" data-y="${y}" data-width="${width}" data-height="${height}"></g>`;

test('committed-deck validation finds an edge crossing an unrelated box', () => {
  const brokenHtml = `<section><svg>
    <path data-edge-id="source-to-target" data-from="source" data-to="target" data-from-port="right" data-to-port="left" d="M100,25 L280,25" marker-end="url(#ahg)"/>
    ${node('source', 0, 0, 100, 50)}
    ${node('blocker', 140, 0, 100, 50)}
    ${node('target', 280, 0, 100, 50)}
  </svg><div class="pageno">M1&middot;06</div></section>`;
  const result = validateDeckHtml(brokenHtml);
  assert.match(result.errors.join('\n'), /slide M1\.06.*edge source-to-target.*node blocker/);
});

test('committed-deck validation rejects an arrow without a marker', () => {
  const brokenHtml = `<section><svg>
    <path data-edge-id="source-to-target" data-from="source" data-to="target" data-from-port="right" data-to-port="left" d="M100,25 L200,25"/>
    ${node('source', 0, 0, 100, 50)}
    ${node('target', 200, 0, 100, 50)}
  </svg><div class="pageno">M1&middot;07</div></section>`;
  const result = validateDeckHtml(brokenHtml);
  assert.match(result.errors.join('\n'), /source-to-target.*marker-end/);
});
