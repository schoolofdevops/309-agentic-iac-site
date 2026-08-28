import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {buildM9Deck, validateSlideSequence} from '../../scripts/decks/build-m9-deck.mjs';
import {slides} from '../../scripts/decks/specs/m9-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
const dividerTitles = [
  'Kubernetes in the Agentic IaC Project',
  'Desired State and Kubernetes Control Loops',
  'Workload Contracts for the API and Worker',
  'Helm Chart Structure and Values Contracts',
  'Helm Templates versus Kustomize Overlays',
  'Render-First Validation and Chart Tests',
  'Service Accounts, RBAC, and Secrets',
  'Probes, Resources, and Graceful Shutdown',
  'Network Policy and Namespace Boundaries',
  'Run the Workload on a Small Kind Cluster',
  'Diagnose Generated Kubernetes Failures',
];

test('Module 9 is a 78-slide forward-only sequence with eleven lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 78}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), dividerTitles);
  assert.equal(slides[76].title, 'Review the Render, Then Prove the Runtime');
  assert.equal(slides[77].type, 'icons');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 9 covers every lesson mechanism with no orphan section', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    'Terraform', 'GitOps', 'observedGeneration', 'EndpointSlice', 'ServiceAccount',
    'values.schema.json', 'Kustomize', '13 gates', 'kubeconform', 'projected',
    'startup', 'readiness', 'liveness', 'QoS', 'graceful', 'NetworkPolicy',
    'Kind', 'rolling update', 'READY_FOR_HUMAN_REVIEW',
  ]) assert.match(text, new RegExp(term, 'i'), `missing ${term}`);
});

test('Module 9 preserves the exact API to dependencies to worker to result project', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    'job-0001', 'queued', 'complete', 'MOCK INFERENCE: HELLO PLATFORM',
    'dependencies', 'API', 'worker', '18080', '30080', '8081',
  ]) assert.match(text, new RegExp(term, 'i'), `missing ${term}`);
});

test('Module 9 preserves measured evidence and strict proof boundaries', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    '9 objects', '10,617 bytes', '3,241,788 bytes', '49.630', '45.698',
    '48.547', '656.2 MiB', '671.1 MiB', '643.1 MiB', '76be5320',
  ]) assert.ok(text.includes(term), `missing ${term}`);
  assert.match(text, /NetworkPolicy disabled/i);
  assert.match(text, /no enforcement claim/i);
  assert.equal(/approved for production|safe to deploy|production proven/i.test(text), false);
});

test('Module 9 keeps the NetworkPolicy proof chain complete and bounded', () => {
  const networkSlides = slides.filter((slide) => slide.n >= 55 && slide.n <= 60);
  const text = JSON.stringify(networkSlides);
  for (const term of ['intent', 'subjects', 'ready destination', 'allowed', 'denied', 'CNI', 'DNS']) {
    assert.match(text, new RegExp(term, 'i'), `missing NetworkPolicy proof term ${term}`);
  }
  assert.match(text, /default Kind connectivity/i);
  assert.match(text, /rendered policy.*intended configuration/i);
});

test('Module 9 renders grouped reveals with destination-aware semantic connectors', async () => {
  const {html} = await buildM9Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const revealedSections = sections.filter((section) => section.includes('fragment semantic-step'));
  assert.equal(revealedSections.length, 26);
  for (const [sectionIndex, section] of sections.entries()) {
    const groups = [...section.matchAll(/<g class="fragment semantic-step">([\s\S]*?)<\/g>/g)];
    for (const [groupIndex, group] of groups.entries()) {
      assert.match(group[1], /class="semantic-edges"/, `slide ${sectionIndex + 1} group ${groupIndex + 1} has no connector`);
      const target = group[1].match(/data-to="([^"]+)"/)?.[1];
      assert.ok(target, `slide ${sectionIndex + 1} group ${groupIndex + 1} has no destination`);
      assert.match(section, new RegExp(`data-node-id="${target}"`), `slide ${sectionIndex + 1} target ${target} is missing`);
    }
  }
});

test('Module 9 renders accessible visuals with validated connector geometry', async () => {
  const {html} = await buildM9Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 78);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 11);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1}`);
    else assert.match(section, /<svg[^>]*role="img"[^>]*aria-label="[^"]+"/, `slide ${index + 1}`);
  }
  const validation = validateDeckHtml(html);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.stats.nodeCount, 135);
  assert.equal(validation.stats.edgeCount, 110);
});

test('Module 9 keeps slide text visual-first and recordable', async () => {
  const {html} = await buildM9Deck({checkOnly: true});
  assert.equal(html.includes('class="takeaway"'), false);
  assert.equal(/<(ul|ol)\b/.test(html), false);
  assert.equal(/<li\b/.test(html), false);
  const subtitles = [...html.matchAll(/<p class="s"[^>]*>(.*?)<\/p>/g)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
  assert.ok(subtitles.length > 50);
  for (const subtitle of subtitles) assert.ok(subtitle.length <= 60, `${subtitle.length} chars: ${subtitle}`);
  assert.equal(/[—–]/.test(JSON.stringify(slides)), false);
});

test('Module 9 builder writes one self-contained reproducible deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm9-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM9Deck({outputPath});
    assert.deepEqual([result.slideCount, result.dividerCount, result.contentCount], [78, 11, 67]);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 78);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(result.html.includes("display: 'flex'"), true);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);
    const committed = await readFile(resolve('static/decks/m9-deploy-applications-kubernetes-helm-ai-agents.html'), 'utf8');
    assert.equal(result.html, committed);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
