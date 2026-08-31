import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

const docs = new URL('../../docs/m10-deliver-infrastructure-gitops-human-approval/', import.meta.url);
const read = (name) => readFileSync(new URL(name, docs), 'utf8');
const words = (source) => source
  .replace(/^---[\s\S]*?---/, '')
  .replace(/```[\s\S]*?```/g, ' ')
  .split(/\s+/)
  .filter(Boolean).length;

const lectureTitles = [
  'Git as a Change and Approval Boundary',
  'Pull Requests, CODEOWNERS, and Branch Protection',
  'GitHub Actions Trust and Workflow Security',
  'Terraform Plan and Controlled Apply',
  'How Argo CD Reconciliation Works',
  'Promotion and Environment Boundaries',
  'Sync Order, Health, and Failure Recovery',
  'Rollback, Roll Forward, and Drift',
  'Delivery Evidence and Separation of Duties',
];

test('Section 10 teaches the exact nine-lecture arc at working-engineer depth', () => {
  const lesson = read('lesson.md');
  const headings = [...lesson.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, lectureTitles);
  assert(words(lesson) >= 4400, `lesson has only ${words(lesson)} substantive words`);
  assert.equal((lesson.match(/\*\*Lecture \d+ · \d+ minutes\*\*/g) || []).length, 9);
  assert((lesson.match(/```mermaid/g) || []).length >= 6, 'lesson needs visible mechanism diagrams');
  assert((lesson.match(/```ya?ml/g) || []).length >= 3, 'lesson needs reviewed configuration examples');
  assert((lesson.match(/^\|.+\|$/gm) || []).length >= 35, 'lesson needs evidence and decision tables');

  for (const term of [
    'authoring identity', 'review identity', 'workflow identity', 'runtime identity',
    'CODEOWNERS', 'branch protection', 'required checks', 'signed provenance',
    'pull_request_target', 'token permissions', 'untrusted fork', 'full commit SHA',
    'workflow-file injection', 'environment', 'artifact',
    'source revision', 'plan_sha256', 'stale plan', 'apply_permitted',
    'refresh', 'diff', 'sync', 'health', 'operation phase', 'prune', 'self-heal',
    'immutable', 'sync wave', 'hook', 'Degraded', 'Git revert', 'Helm rollback',
    'Terraform recovery', 'roll forward', 'separation of duties',
  ]) assert.match(lesson, new RegExp(term, 'i'), `lesson must teach ${term}`);

  for (const boundary of [
    /saved (?:binary )?plan[s]?[^.]{0,100}sensitive values/i,
    /plan JSON[^.]{0,100}(?:clear text|sensitive values)/i,
    /hash(?:ing|es)?[^.]{0,100}integrity[^.]{0,100}(?:not|does not)[^.]{0,60}confidentiality/i,
    /protected saved-plan artifact/i,
    /sanitized[^.]{0,40}review summary/i,
    /access control/i,
    /minimum retention/i,
  ]) assert.match(lesson, boundary, `lesson must teach sensitive-plan boundary ${boundary}`);

  for (const boundary of [
    /fixture-specific/i,
    /gated mirror[^.]{0,120}HEAD[^.]{0,120}approved[^.]{0,80}(?:full|exact) commit/i,
    /symbolic revision[^.]{0,100}(?:move|mutable)/i,
    /\.status\.sync\.revision/i,
    /protected promotion ref/i,
    /immutable workload artifact digest/i,
  ]) assert.match(lesson, boundary, `lesson must teach mutable-ref boundary ${boundary}`);
});

test('Section 10 follows one commit through transactional and reconciliation lanes without overstating proof', () => {
  const content = [read('lesson.md'), read('deep-dive.md')].join('\n');
  for (const term of [
    'terraform_data.reviewed_delivery', 'apply_permitted: false',
    'Synced', 'Healthy', 'Succeeded', 'OutOfSync',
    'MOCK INFERENCE: GITOPS DELIVERY', '1.680 GiB', '4 GiB',
    'Terraform 1.14.8', 'OpenTofu 1.12.6', 'Argo CD',
    '10.4.0', '3.5.1', 'human-platform-reviewer',
  ]) assert.match(content, new RegExp(term, 'i'), `content must carry proven evidence: ${term}`);
  for (const overclaim of [
    /a green plan (?:authorizes|approves) apply/i,
    /Synced (?:and|plus) Healthy proves application correctness/i,
    /GitOps eliminates drift/i,
    /a signature proves the change is safe/i,
    /the local Git daemon proves production (?:authentication|authorization)/i,
    /1\.680 GiB is the minimum memory/i,
  ]) assert.doesNotMatch(content, overclaim);
});

test('Section 10 deep dive compares transaction and reconciliation internals and proof limits', () => {
  const deep = read('deep-dive.md');
  assert.match(deep, /sidebar_position: 4/);
  assert.match(deep, /title: 'Deep Dive: Terraform Transactions and Argo Reconciliation'/);
  assert.match(deep, /sidebar_label: 'Deep Dive: Transactions and Reconciliation'/);
  assert(words(deep) >= 2200, `deep dive has only ${words(deep)} substantive words`);
  for (const term of [
    'failure timing', 'stale evidence', 'partial state', 'retry',
    'rollback', 'roll forward', 'refresh', 'diff', 'operation',
    'last successful apply', 'current state', 'proof limit', 'human approval',
  ]) assert.match(deep, new RegExp(term, 'i'), `deep dive must cover ${term}`);
  assert((deep.match(/```mermaid/g) || []).length >= 2);
  assert.match(deep, /:::tip\[Where you will use this\]/);
  assert.doesNotMatch(deep, /<expected output|folded in during live lab validation/i);
  assert.doesNotMatch(deep, /^```bash$/m, 'deep dive is explanatory, not a second runnable lab');
});

test('Section 10 operator challenge is independent, packet-only, and does not leak the answer', () => {
  const challenge = read('operator-challenge.md');
  assert.match(challenge, /independent packet-only review/i);
  assert.match(challenge, /do not run/i);
  assert(words(challenge) >= 900, `challenge has only ${words(challenge)} substantive words`);
  for (const term of [
    'Terraform', 'Helm', 'privileged workflow', 'split', 'minimum safe approval path',
    'event context', 'permissions', 'action pin', 'fork', 'environment',
    'CODEOWNERS', 'branch protection', 'plan', 'commit', 'artifact',
    'Argo', 'runtime observation', 'record your answer',
  ]) assert.match(challenge, new RegExp(term, 'i'), `challenge must require ${term}`);
  assert.match(challenge, /saved plan[^.]{0,100}sensitive/i);
  assert.match(challenge, /hash[^.]{0,100}(?:not|does not)[^.]{0,60}confidentiality/i);
  assert.match(challenge, /targetRevision: HEAD[\s\S]{0,600}(?:symbolic|mutable|move)/i);
  assert.match(challenge, /\.status\.sync\.revision/i);
  for (const leak of [
    'answer-key', 'the correct split is', 'approve packet b', 'reject packet a',
    'the root cause is', 'copy this solution', 'section-10/challenge',
  ]) assert.doesNotMatch(challenge, new RegExp(leak, 'i'), `challenge leaks ${leak}`);
});

test('Section 10 quiz has exactly fifteen balanced scenarios and complete explanations', () => {
  const quiz = read('quiz.mdx');
  assert.equal((quiz.match(/prompt:/g) || []).length, 15);
  assert.equal((quiz.match(/options:\[/g) || []).length, 15);
  assert((quiz.match(/multiSelect:true/g) || []).length >= 5);
  assert.equal((quiz.match(/explanation:/g) || []).length, 60);
  assert.equal((quiz.match(/correct:(?:true|false)/g) || []).length, 60);
  assert.doesNotMatch(quiz, /correctAnswers|"type"\s*:|"id"\s*:/);

  const options = [...quiz.matchAll(/\{text:'([^']+)',correct:(true|false),explanation:'([^']+)'\}/g)]
    .map((match) => ({text: match[1], correct: match[2] === 'true'}));
  assert.equal(options.length, 60, 'every option must use the established compact Quiz schema');
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const correctAverage = mean(options.filter((option) => option.correct).map((option) => option.text.length));
  const distractorAverage = mean(options.filter((option) => !option.correct).map((option) => option.text.length));
  assert(correctAverage / distractorAverage > 0.85 && correctAverage / distractorAverage < 1.15,
    `option lengths are biased: correct ${correctAverage.toFixed(1)}, distractor ${distractorAverage.toFixed(1)}`);

  const questions = [...quiz.matchAll(/prompt:'([^']+)',\s*(multiSelect:true,\s*)?options:\[\s*([\s\S]*?)\s*\]\s*\}/g)]
    .map((match) => ({
      prompt: match[1],
      multi: Boolean(match[2]),
      options: [...match[3].matchAll(/\{text:'([^']+)',correct:(true|false),explanation:'([^']+)'\}/g)]
        .map((option) => ({text: option[1], correct: option[2] === 'true'})),
    }));
  assert.equal(questions.length, 15);
  assert(questions.every((question) => question.options.length === 4));

  const singlePositions = questions.filter((question) => !question.multi)
    .map((question) => question.options.findIndex((option) => option.correct));
  const positionCounts = [0, 1, 2, 3].map((position) => singlePositions.filter((value) => value === position).length);
  assert(positionCounts.every((count) => count >= 2), `single-select positions expose a pattern: ${positionCounts}`);
  assert(Math.max(...positionCounts) - Math.min(...positionCounts) <= 1,
    `single-select positions are unbalanced: ${positionCounts}`);

  const multiSignatures = questions.filter((question) => question.multi)
    .map((question) => question.options.map((option, index) => option.correct ? index : null).filter((index) => index !== null).join(','));
  assert(new Set(multiSignatures).size >= 4, `multi-select subsets are repetitive: ${multiSignatures}`);
  assert(!multiSignatures.includes('0,1,2'), 'multi-select must not expose the old first-three pattern');

  const longestCorrect = questions.filter((question) => {
    const maximum = Math.max(...question.options.map((option) => option.text.length));
    return question.options.find((option) => option.text.length === maximum).correct;
  }).length;
  const chanceExpectation = questions.reduce((sum, question) =>
    sum + question.options.filter((option) => option.correct).length / question.options.length, 0);
  assert(longestCorrect >= Math.floor(chanceExpectation) - 1,
    `longest-option placement exposes an inverse cue: ${longestCorrect} correct versus ${chanceExpectation.toFixed(2)} expected`);
  assert(longestCorrect <= Math.ceil(chanceExpectation),
    `longest-option heuristic beats chance: ${longestCorrect} correct versus ${chanceExpectation.toFixed(2)} expected`);

  for (const trivial of [
    /number of letters/i,
    /Terraform formatting will always reject/i,
    /Argo CD will automatically delete the pull request/i,
    /CODEOWNERS removes the Argo Application/i,
    /any available registry/i,
  ]) assert.doesNotMatch(quiz, trivial, `quiz contains trivial distractor ${trivial}`);
});

test('Section 10 has human-searchable navigation and no stale unpublished scaffolds', () => {
  const lesson = read('lesson.md');
  const deep = read('deep-dive.md');
  const challenge = read('operator-challenge.md');
  const sidebar = readFileSync(new URL('../../sidebars.ts', import.meta.url), 'utf8');
  assert.match(lesson, /title: 'Deliver Infrastructure Safely with GitOps and Human Approval'/);
  assert.match(challenge, /title: 'Operator Challenge - Review a Multi-Lane Delivery Change'/);
  for (const source of [lesson, deep, challenge]) {
    assert.doesNotMatch(source, /\b(?:unleash|supercharge|magic|wizard|bot-powered|governance fabric)\b/i);
  }
  const section9 = sidebar.indexOf("label: 'Section 9 — Deploy Applications with Kubernetes, Helm, and AI Agents'");
  const section10 = sidebar.indexOf("label: 'Section 10 — Deliver Infrastructure Safely with GitOps and Human Approval'");
  assert(section9 >= 0 && section10 > section9, 'Section 10 must follow Section 9');
  for (const page of ['lesson', 'lab', 'operator-challenge', 'deep-dive', 'quiz']) {
    assert.match(sidebar, new RegExp(`m10-deliver-infrastructure-gitops-human-approval/${page}`));
  }
  assert.equal(existsSync(new URL('../../docs/m10-kubernetes-and-helm-delivery/', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../docs/m11-govern-deployment-through-git/', import.meta.url)), false);
});
