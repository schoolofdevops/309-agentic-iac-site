import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM7Deck, validateSlideSequence} from '../../scripts/decks/build-m7-deck.mjs';
import {slides} from '../../scripts/decks/specs/m7-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
const dividerTitles = [
  'Terraform and OpenTofu in This Course',
  'How Terraform Evaluates Configuration',
  'The Resource Dependency Graph',
  'Provider Versions, Locks, and Reproducibility',
  'Module Contracts and Agent-Friendly Structure',
  'State Is a Trust and Recovery Boundary',
  'Refactoring Without Recreating Infrastructure',
  'Identity, Secrets, and Least Privilege',
  'Build the Local Cloud Foundation',
  'Small Plans and Reviewable Agent Changes',
  'OpenTofu Compatibility and Migration Record',
];

test('Module 7 is an 82-slide forward-only sequence with eleven lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 82}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), dividerTitles);
  assert.equal(slides[80].title, 'Own the Whole Infrastructure Lifecycle');
  assert.equal(slides[81].type, 'lab-bridge');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 7 follows one resource through evaluation, graph, provider, state, and move', () => {
  const text = JSON.stringify(slides);
  for (const term of ['HCL', 'dependency|graph', 'provider|plan', 'state|binding', 'module.messaging', 'moved block', 'same queue']) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  assert.ok(slides.some((slide) => slide.items?.includes('0 create · 0 destroy')));
});

test('Module 7 preserves exact proven versions, counts, hashes, and evidence limits', () => {
  const text = JSON.stringify(slides);
  for (const term of ['6.61.0', '6.62.0', '36.2 MiB', '61.83 MiB', '3db541e4', '5be4dc35', 'S3 × 3', 'IAM × 2']) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  assert.ok(slides.some((slide) => slide.title === 'Local Proof Has a Clear Boundary'));
  assert.equal(text.includes('approved for production'), false);
});

test('Module 7 evidence arrows point from observations into claims and decisions', async () => {
  const {html} = await buildM7Deck({checkOnly: true});
  const sections = sectionsOf(html);
  for (const [slideNumber, target] of [[12, 'planned-change-hub'], [42, 'operator-decision-hub'], [67, 'lifecycle-claim-hub']]) {
    const edges = [...sections[slideNumber - 1].matchAll(/data-from="([^"]+)" data-to="([^"]+)"/g)];
    assert.ok(edges.length >= 4, `slide ${slideNumber} needs evidence edges`);
    assert.ok(edges.every((match) => match[2] === target), `slide ${slideNumber} arrows must point into ${target}`);
  }
});

test('Module 7 renders accessible visuals and validated semantic geometry', async () => {
  const {html} = await buildM7Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 82);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 11);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1}`);
    else assert.match(section, /<svg[^>]*role="img"[^>]*aria-label="[^"]+"/, `slide ${index + 1}`);
  }
  assert.doesNotMatch(html, /data-fragment-index=/);
  const validation = validateDeckHtml(html);
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.stats.nodeCount >= 190);
  assert.ok(validation.stats.edgeCount >= 100);
});

test('Module 7 builder writes one self-contained deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm7-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM7Deck({outputPath});
    assert.deepEqual([result.slideCount, result.dividerCount, result.contentCount], [82, 11, 71]);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 82);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
