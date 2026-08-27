import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {buildM8Deck, validateSlideSequence} from '../../scripts/decks/build-m8-deck.mjs';
import {slides} from '../../scripts/decks/specs/m8-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
const dividerTitles = [
  'The IaC Evidence Pyramid',
  'Formatting, Validation, and Provider-Aware Checks',
  'Terraform Test and Contract Tests',
  'Lint and Security Scanning',
  'Policy as Code over Terraform Plans',
  'Secrets, Logs, and Evidence Redaction',
  'Cost and FinOps Gates for IaC',
  'Adversarial Tasks and Agent Safety Evals',
  'Evidence Bundles and Operator Plan Review',
];

test('Module 8 is a 75-slide forward-only sequence with nine lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 75}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), dividerTitles);
  assert.equal(slides[73].title, 'Review Evidence Before You Trust Generated IaC');
  assert.equal(slides[74].type, 'icons');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 8 follows one candidate through the complete evidence pipeline', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    'untrusted candidate', 'fmt -check', 'provider schema', 'Mocked Providers',
    'Trivy', 'false green', 'redact', 'FinOps', 'Attack Classes',
    'source', 'evaluator', 'plan', 'READY_FOR_HUMAN_REVIEW',
  ]) assert.match(text, new RegExp(term, 'i'), `missing ${term}`);
});

test('Module 8 preserves exact measured identities and proof limits', () => {
  const text = JSON.stringify(slides);
  for (const term of ['0b9fe15b', 'a4fd12ba', 'b47ef9a0', '3db541e4', '5be4dc35', '5 approved resources']) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  assert.equal(/safe to apply|approved for production/i.test(text), false);
  assert.match(text, /no apply/i);
});

test('Module 8 uses arrows only for ordered or causal flows', async () => {
  const {html} = await buildM8Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const falseGreen = sections[36];
  const evidenceBundle = sections[66];
  for (const [name, section] of [['false-green', falseGreen], ['evidence-bundle', evidenceBundle]]) {
    const edges = [...section.matchAll(/data-from="([^"]+)" data-to="([^"]+)"/g)];
    assert.ok(edges.length >= 4, `${name} needs a complete causal chain`);
    for (const edge of edges) assert.notEqual(edge[1], edge[2], `${name} contains a self-edge`);
  }
});

test('Module 8 renders accessible visuals with validated connector geometry', async () => {
  const {html} = await buildM8Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 75);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 9);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1}`);
    else assert.match(section, /<svg[^>]*role="img"[^>]*aria-label="[^"]+"/, `slide ${index + 1}`);
  }
  const validation = validateDeckHtml(html);
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.stats.nodeCount >= 140);
  assert.ok(validation.stats.edgeCount >= 100);
});

test('Module 8 builder writes one self-contained reproducible deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm8-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM8Deck({outputPath});
    assert.deepEqual([result.slideCount, result.dividerCount, result.contentCount], [75, 9, 66]);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 75);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(result.html.includes('class="takeaway"'), false);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
