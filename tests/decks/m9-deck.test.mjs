import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {buildM9Deck, describeSlide, validateSlideSequence} from '../../scripts/decks/build-m9-deck.mjs';
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

test('Module 9 is an 80-slide forward-only sequence with eleven lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 80}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), dividerTitles);
  assert.equal(slides[78].title, 'Review the Render, Then Prove the Runtime');
  assert.equal(slides[79].type, 'icons');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number 1/);
});

test('Module 9 covers every lesson mechanism with no orphan section', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    'Terraform', 'GitOps', 'observedGeneration', 'EndpointSlice', 'ServiceAccount',
    'values.schema.json', 'Kustomize', '13 gates', 'kubeconform', 'projected',
    'startup', 'readiness', 'liveness', 'QoS', 'graceful', 'NetworkPolicy',
    'Kind', 'rolling update', 'READY_FOR_HUMAN_REVIEW', 'matching CRD schema',
    'explicit skip record', 'false green', 'administrative boundary', 'tenant isolation',
  ]) assert.match(text, new RegExp(term, 'i'), `missing ${term}`);
});

test('Module 9 visibly names all thirteen evaluator gates', () => {
  const gateSlide = slides.find((slide) => slide.title === 'Thirteen Gates Review One Exact Candidate');
  assert.ok(gateSlide);
  assert.equal(gateSlide.type, 'gateGrid');
  assert.equal(gateSlide.items.length, 13);
  for (const gate of [
    'application tests', 'strict Helm lint', 'render', 'values schema',
    'kubeconform', 'secret scan', 'resource gate', 'Conftest',
    'workload contract', 'security context', 'probe gate', 'role boundary',
    'allowed source scope',
  ]) assert.match(JSON.stringify(gateSlide.items), new RegExp(gate, 'i'), `missing gate ${gate}`);
});

test('Module 9 gives CRD skip records and namespace isolation dedicated visual coverage', () => {
  const crdSlide = slides.find((slide) => slide.title === 'CRDs Need a Schema or an Explicit Skip Record');
  const namespaceSlide = slides.find((slide) => slide.title === 'A Namespace Is Not Tenant Isolation');
  assert.ok(crdSlide, 'missing dedicated CRD validation slide');
  assert.ok(namespaceSlide, 'missing dedicated namespace boundary slide');
  assert.match(JSON.stringify(crdSlide), /matching CRD schema/i);
  assert.match(JSON.stringify(crdSlide), /silent skip.*false green/i);
  assert.match(JSON.stringify(namespaceSlide), /administrative boundary/i);
  assert.match(JSON.stringify(namespaceSlide), /RBAC.*secrets.*quotas.*Pod security.*admission.*network.*node.*cloud identity/i);
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
  const networkSlides = slides.filter((slide) => slide.n >= 56 && slide.n <= 62);
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
  assert.equal(revealedSections.length, 23);
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

test('Module 9 semantic edges express inputs, failure chains, and comparison evidence correctly', async () => {
  const {html} = await buildM9Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const finalRender = sections.find((section) => section.includes('Final Render Is the Shared Review Artifact'));
  const readiness = sections.find((section) => section.includes('A Wrong Readiness Path Returns HTTP 404'));
  const backend = sections.find((section) => section.includes('An Unreachable Backend Returns HTTP 503'));
  assert.match(finalRender, /data-from="helm-source" data-to="final-render"/);
  assert.match(finalRender, /data-from="kustomize-source" data-to="final-render"/);
  assert.match(finalRender, /data-from="final-render" data-to="schema-checks"/);
  assert.match(finalRender, /data-from="final-render" data-to="policy-checks"/);
  assert.doesNotMatch(finalRender, /data-from="final-render" data-to="(?:helm|kustomize)-source"/);
  assert.match(readiness, /data-from="live-path-ready" data-to="new-pod-0-1"/);
  assert.match(readiness, /data-from="new-pod-0-1" data-to="probe-event-http-404"/);
  assert.doesNotMatch(readiness, /data-from="mixed-endpoints"|data-to="mixed-endpoints"/);
  assert.doesNotMatch(readiness, /data-from="render-path-readyz"|data-to="render-path-readyz"/);
  assert.match(backend, /data-from="wrong-dns-name" data-to="worker-0-1"/);
  assert.match(backend, /data-from="worker-0-1" data-to="readiness-http-503"/);
  assert.match(backend, /data-from="readiness-http-503" data-to="log-no-such-host"/);
  assert.doesNotMatch(backend, /data-from="dependency-ready"|data-to="dependency-ready"/);
});

test('Module 9 renders accessible visuals with validated connector geometry', async () => {
  const {html} = await buildM9Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 80);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 11);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1}`);
    else {
      const aria = section.match(/<svg[^>]*role="img"[^>]*aria-label="([^"]+)"/)?.[1];
      assert.ok(aria, `slide ${index + 1} has no SVG description`);
      assert.ok(aria.length >= 45, `slide ${index + 1} SVG description is too generic: ${aria}`);
      assert.match(aria, /[.!?]$/, `slide ${index + 1} SVG description is not a full sentence`);
      assert.doesNotMatch(aria, /^A hand-drawn technical diagram explains /);
    }
  }
  const finalRenderAria = sections.find((section) => section.includes('Final Render Is the Shared Review Artifact'))?.match(/aria-label="([^"]+)"/)?.[1];
  const readinessAria = sections.find((section) => section.includes('A Wrong Readiness Path Returns HTTP 404'))?.match(/aria-label="([^"]+)"/)?.[1];
  const backendAria = sections.find((section) => section.includes('An Unreachable Backend Returns HTTP 503'))?.match(/aria-label="([^"]+)"/)?.[1];
  assert.match(finalRenderAria, /Helm source.*Kustomize source.*into the final render.*schema checks.*policy checks/i);
  assert.match(readinessAria, /live path.*new Pod.*HTTP 404.*comparison.*mixed endpoints.*reviewed render/i);
  assert.match(backendAria, /wrong DNS.*worker.*HTTP 503.*no such host.*comparison.*ready dependency/i);
  const validation = validateDeckHtml(html);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.stats.nodeCount, 148);
  assert.equal(validation.stats.edgeCount, 107);
});

test('Module 9 accessibility descriptions name visible labels and visual relationships', () => {
  const relationshipTerms = new Map([
    ['pipeline', /left-to-right flow moves from/i],
    ['loop', /clockwise loop connects/i],
    ['hub', /hub labeled .* connects outward/i],
    ['compare', /side-by-side comparison contrasts/i],
    ['boundary', /dashed boundary contains/i],
    ['ladder', /ascending ladder moves from/i],
    ['icons', /lab sequence moves from/i],
    ['gateGrid', /thirteen evaluator gate cards name/i],
  ]);
  for (const slide of slides.filter((candidate) => !candidate.divider)) {
    const description = describeSlide(slide);
    const firstLabel = slide.items[0].replaceAll('|', ' ');
    assert.match(description, new RegExp(firstLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `slide ${slide.n} omits ${firstLabel}`);
    if (relationshipTerms.has(slide.type)) assert.match(description, relationshipTerms.get(slide.type), `slide ${slide.n} omits ${slide.type} meaning`);
  }
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
    assert.deepEqual([result.slideCount, result.dividerCount, result.contentCount], [80, 11, 69]);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 80);
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
