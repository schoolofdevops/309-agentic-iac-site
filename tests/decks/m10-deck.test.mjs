import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {buildM10Deck, describeSlide, validateSlideSequence} from '../../scripts/decks/build-m10-deck.mjs';
import {lectureTitles, slides} from '../../scripts/decks/specs/m10-slides.mjs';
import {validateDeckHtml} from '../../scripts/decks/validate-deck.mjs';

const sectionsOf = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);

test('Module 10 is a 74-slide forward-only sequence with nine exact lecture dividers', () => {
  assert.deepEqual(slides.map((slide) => slide.n), Array.from({length: 74}, (_, index) => index + 1));
  assert.deepEqual(slides.filter((slide) => slide.divider).map((slide) => slide.title), lectureTitles);
  assert.equal(slides[72].title, 'Reviewed Bytes Move; Human Authority Stays Separate');
  assert.equal(slides[73].type, 'icons');
  assert.throws(() => validateSlideSequence([{n: 1}, {n: 1}]), /duplicate slide number/);
});

test('Module 10 covers every approved delivery mechanism with no orphan topic', () => {
  const text = JSON.stringify(slides);
  for (const term of [
    'CODEOWNERS', 'Branch Rules', 'pull_request_target', 'Trusted Evaluator',
    'Token Permissions', 'Pin Every', 'Plan Artifacts', 'Protected Environment',
    'The Reviewed Workflow Makes Trust Visible', 'actions/checkout@',
    'terraform_data.reviewed_delivery', 'apply_permitted: false', 'OpenTofu 1.12.6',
    'Saved Plans', 'Changed Inputs Reject', 'Controlled Apply', 'Refresh', 'OutOfSync',
    'Explicit Sync', 'Self-Heal', 'Prune', 's10-v1', 's10-v2', 'Fixture HEAD',
    'Sync Waves', 'Hooks', 'Git Revert', 'Roll Forward', 'Typed Links',
    'Separation of Duties', 'Signature Proves Identity', 'Ignored Fields Shrink',
    '1.680 GiB', '61 passed',
  ]) assert.match(text, new RegExp(term, 'i'), `missing ${term}`);
});

test('Module 10 carries one commit through distinct plan and reconciliation lanes', () => {
  const text = JSON.stringify(slides);
  assert.match(text, /one reviewed commit/i);
  assert.match(text, /plan-only.*Terraform\/OpenTofu/i);
  assert.match(text, /manual.*Argo CD sync/i);
  assert.match(text, /human.*approval/i);
  assert.match(text, /apply_permitted: false/i);
  assert.match(text, /apply never ran/i);
});

test('Module 10 semantic edges point toward their stated destinations', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const lanes = sections.find((section) => section.includes('One Reviewed v1 Commit Enters Both Lanes'));
  const trust = sections.find((section) => section.includes('Trusted Evaluator Bytes Judge Untrusted PR Bytes'));
  const state = sections.find((section) => section.includes('Git Holds Desired State; Kubernetes Holds Live State'));
  const promotion = sections.find((section) => section.includes('Promotion Evidence Binds Commit, Artifact, and Target'));
  const graph = sections.find((section) => section.includes('Typed Links State the Exact Relationship'));
  const duties = sections.find((section) => section.includes('Separation of Duties Blocks Authority Loops'));

  assert.match(lanes, /data-from="v1-reviewed-de8c3809e589" data-to="plan-only-workflow"/);
  assert.match(lanes, /data-from="v1-reviewed-de8c3809e589" data-to="argo-cd-desired-state"/);
  assert.match(lanes, /data-from="plan-only-workflow" data-to="human-decision"/);
  assert.match(lanes, /data-from="argo-cd-desired-state" data-to="human-decision"/);
  assert.match(trust, /data-from="trusted-workflow-sha" data-to="fixed-evaluator"/);
  assert.match(trust, /data-from="untrusted-candidate-diff" data-to="fixed-evaluator"/);
  assert.match(trust, /data-from="fixed-evaluator" data-to="bounded-report"/);
  assert.match(state, /data-from="reviewed-git-revision" data-to="desired-live-diff"/);
  assert.match(state, /data-from="live-kubernetes-objects" data-to="desired-live-diff"/);
  assert.match(promotion, /data-from="reviewed-commit" data-to="environment-identity"/);
  assert.match(promotion, /data-from="artifact-digest" data-to="environment-identity"/);
  assert.match(graph, /data-from="plan-report" data-to="commit-sha"/);
  assert.match(graph, /data-from="approval-record" data-to="sync-operation"/);
  assert.match(graph, /data-from="runtime-observation" data-to="delivery-claim"/);
  assert.match(duties, /data-from="agent-proposes" data-to="delivery-acts"/);
  assert.match(duties, /forbidden author bypass/);
});

test('Module 10 preserves the reviewed, promoted, and recovery Git identities', () => {
  const text = JSON.stringify(slides);
  assert.match(text, /de8c3809e589b919345a97bddc6e3bc55e6e5d6b/);
  assert.match(text, /f3616b72738f4c7477d5f0882d475e76eaa5acd9/);
  assert.match(text, /5fc2c75c0e9c69f6a2b7bbd8c49f337e9e6889b6/);
  assert.match(text, /d68f9405ee521b33162bf505b6bbca4a947f7ba1/);
  assert.doesNotMatch(text, /1e01929/i);
});

test('Module 10 draws rejection, reconciliation, and approval edges in evidence order', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const stale = sections.find((section) => section.includes('Changed Inputs Reject the Stale Plan'));
  const loop = sections.find((section) => section.includes('Terraform Transacts; Argo Reconciles'));
  const trail = sections.find((section) => section.includes('One Evidence Trail Connects Nine Records'));

  for (const source of ['source-moved', 'workflow-moved', 'variables-changed', 'target-changed', 'policy-changed', 'state-changed']) {
    assert.match(stale, new RegExp(`data-from="${source}" data-to="reject-stale-plan"`));
    assert.doesNotMatch(stale, new RegExp(`data-from="reject-stale-plan" data-to="${source}"`));
  }
  for (const [from, to] of [
    ['desired-git', 'diff'],
    ['diff', 'explicit-sync'],
    ['explicit-sync', 'live-objects'],
    ['live-objects', 'observed-live'],
    ['observed-live', 'diff'],
  ]) assert.match(loop, new RegExp(`data-from="${from}" data-to="${to}"`));
  assert.doesNotMatch(loop, /data-from="observed-live" data-to="desired-git"/);

  for (const [from, to] of [
    ['request', 'commit'],
    ['commit', 'checks'],
    ['checks', 'artifact-identity'],
    ['artifact-identity', 'reviewer'],
    ['reviewer', 'approval-commit-digest'],
    ['approval-commit-digest', 'operation'],
    ['operation', 'observation'],
    ['observation', 'cleanup'],
  ]) assert.match(trail, new RegExp(`data-from="${from}" data-to="${to}"`));
});

test('Module 10 shows exact reviewed workflow and Argo Application fields', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  const sections = sectionsOf(html);
  const workflow = sections.find((section) => section.includes('The Reviewed Workflow Makes Trust Visible'));
  const application = sections.find((section) => section.includes('The Application Keeps Sync Manual'));

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /permissions:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /actions\/checkout@/);
  assert.match(workflow, /3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(application, /targetRevision: HEAD/);
  assert.match(application, /syncPolicy:/);
  assert.match(application, /automated/);
  assert.match(application, /absent/);
  assert.match(application, /status\.sync\.revision/);
  assert.match(application, /de8c3809e589b919345a97bddc6e3bc55e6e5d6b/);
});

test('Module 10 states signature and ignored-field proof limits', () => {
  const signature = slides.find((slide) => slide.title === 'A Signature Proves Identity, Not Safety');
  const ignored = slides.find((slide) => slide.title === 'Ignored Fields Shrink Drift Evidence');
  assert.match(JSON.stringify(signature), /SIGNATURE VALID.*trusted key signed bytes.*ENGINEERING REVIEW.*content \+ risk accepted/i);
  assert.match(JSON.stringify(signature), /key custody \+ identity mapping remain policy/i);
  assert.match(JSON.stringify(ignored), /RULE OWNER.*IGNORED FIELD.*STALE MASK.*PROOF LIMIT/i);
  assert.match(JSON.stringify(ignored), /hide image or security drift/i);
});

test('Module 10 fragment steps keep connectors tied to visible destinations', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  const sections = sectionsOf(html);
  let fragmentSteps = 0;
  for (const [sectionIndex, section] of sections.entries()) {
    const groups = [...section.matchAll(/<g class="fragment semantic-step">([\s\S]*?)<\/g>/g)];
    fragmentSteps += groups.length;
    for (const [groupIndex, group] of groups.entries()) {
      assert.match(group[1], /class="semantic-edges"/, `slide ${sectionIndex + 1} group ${groupIndex + 1}`);
      const target = group[1].match(/data-to="([^"]+)"/)?.[1];
      assert.ok(target, `slide ${sectionIndex + 1} group ${groupIndex + 1} has no destination`);
      assert.match(section, new RegExp(`data-node-id="${target}"`), `slide ${sectionIndex + 1} target ${target} is absent`);
    }
  }
  assert.ok(fragmentSteps >= 55, `expected at least 55 grouped semantic reveals, found ${fragmentSteps}`);
});

test('Module 10 renders descriptive accessible visuals and valid connector geometry', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  const sections = sectionsOf(html);
  assert.equal(sections.length, 74);
  assert.equal(sections.filter((section) => /class="divider"/.test(section)).length, 9);
  for (const [index, section] of sections.entries()) {
    if (/class="divider"/.test(section)) {
      assert.doesNotMatch(section, /<svg\b/, `divider ${index + 1}`);
      continue;
    }
    const aria = section.match(/<svg[^>]*role="img"[^>]*aria-label="([^"]+)"/)?.[1];
    assert.ok(aria, `slide ${index + 1} has no SVG description`);
    assert.ok(aria.length >= 45, `slide ${index + 1} description is too generic: ${aria}`);
    assert.match(aria, /[.!?]$/, `slide ${index + 1} description is not a sentence`);
  }
  const validation = validateDeckHtml(html);
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.stats.nodeCount >= 135, `${validation.stats.nodeCount} semantic nodes`);
  assert.ok(validation.stats.edgeCount >= 100, `${validation.stats.edgeCount} semantic edges`);
});

test('Module 10 descriptions name visible labels and relationship meaning', () => {
  const relationshipTerms = new Map([
    ['pipeline', /left-to-right flow moves from/i],
    ['loop', /clockwise responsibility loop connects/i],
    ['hub', /hub labeled .* connects outward/i],
    ['compare', /side-by-side comparison contrasts/i],
    ['boundary', /dashed control boundary contains/i],
    ['ladder', /ascending evidence ladder moves from/i],
    ['icons', /lab sequence moves from/i],
  ]);
  for (const slide of slides.filter((candidate) => !candidate.divider)) {
    const description = describeSlide(slide);
    const first = slide.items[0].replaceAll('|', ' ');
    assert.match(description, new RegExp(first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `slide ${slide.n} omits ${first}`);
    if (relationshipTerms.has(slide.type)) assert.match(description, relationshipTerms.get(slide.type), `slide ${slide.n} omits ${slide.type} meaning`);
  }
});

test('Module 10 keeps slide text visual-first and plain', async () => {
  const {html} = await buildM10Deck({checkOnly: true});
  assert.equal(html.includes('class="takeaway"'), false);
  assert.equal(/<(ul|ol|li)\b/.test(html), false);
  assert.equal(/[—–]/.test(JSON.stringify(slides)), false);
  const subtitles = [...html.matchAll(/<p class="s"[^>]*>(.*?)<\/p>/g)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
  for (const subtitle of subtitles) {
    assert.ok(subtitle.length <= 60, `${subtitle.length} chars: ${subtitle}`);
    assert.ok(subtitle.split(/\s+/).length <= 10, `${subtitle.split(/\s+/).length} words: ${subtitle}`);
  }
});

test('Module 10 builder writes one exact self-contained deck', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'm10-deck-test-'));
  const outputPath = join(directory, 'deck.html');
  try {
    const result = await buildM10Deck({outputPath});
    assert.deepEqual([result.slideCount, result.dividerCount, result.contentCount], [74, 9, 65]);
    assert.equal(result.html.match(/class="pageno"/g)?.length, 74);
    assert.equal(result.html.includes('src="http'), false);
    assert.equal(result.html.includes('href="http'), false);
    assert.equal(result.html.includes("display: 'flex'"), true);
    assert.ok(Buffer.byteLength(result.html) < 819200);
    assert.equal(await readFile(outputPath, 'utf8'), result.html);
    const committed = await readFile(resolve('static/decks/m10-deliver-infrastructure-gitops-human-approval.html'), 'utf8');
    assert.equal(result.html, committed);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
