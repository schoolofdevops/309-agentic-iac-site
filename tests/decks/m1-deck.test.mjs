import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM1Deck, validateSlideSequence} from '../../scripts/decks/build-m1-deck.mjs';
import {slides} from '../../scripts/decks/specs/m1-slides.mjs';

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
