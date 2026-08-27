import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const docs = new URL('../../docs/m8-test-secure-ai-generated-infrastructure/', import.meta.url);
const read = (name) => readFileSync(new URL(name, docs), 'utf8');
const words = (source) => source
  .replace(/^---[\s\S]*?---/, '')
  .replace(/```[\s\S]*?```/g, ' ')
  .split(/\s+/)
  .filter(Boolean).length;

const lectureTitles = [
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

test('Section 8 teaches the nine approved lectures in exact order and at full depth', () => {
  const lesson = read('lesson.md');
  const headings = [...lesson.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, lectureTitles);
  assert(words(lesson) >= 4500, `lesson has only ${words(lesson)} substantive words`);
  assert.equal((lesson.match(/\*\*Lecture \d · \d+ minutes\*\*/g) || []).length, 9);

  for (const term of [
    'false green',
    'terraform validate',
    'provider schema',
    'Terraform test',
    'TFLint',
    'Trivy',
    'Conftest',
    'after_unknown',
    'after_sensitive',
    'redaction',
    'FinOps',
    'adversarial',
    'source_sha256',
    'evaluator_sha256',
    'plan_sha256',
    'READY_FOR_HUMAN_REVIEW',
    'OpenTofu',
  ]) assert.match(lesson, new RegExp(term, 'i'), `lesson must teach ${term}`);

  assert((lesson.match(/```mermaid/g) || []).length >= 6, 'lesson needs a visual for each major mechanism');
});

test('Section 8 deep dive covers evaluator internals and proof boundaries', () => {
  const deep = read('deep-dive.md');
  assert.match(deep, /sidebar_position: 4/);
  assert.match(deep, /sidebar_label: 'Deep Dive: When Green IaC Checks Are Wrong'/);
  assert(words(deep) >= 2200, `deep dive has only ${words(deep)} substantive words`);

  for (const term of [
    'false green',
    'undefined',
    'unknown',
    'missing',
    'sensitive',
    'check bundle',
    'suppression',
    'evaluator mutation',
    'provenance',
    'source SHA',
    'plan SHA',
    'Terraform and OpenTofu',
    'lock entries',
    'semantic',
  ]) assert.match(deep, new RegExp(term, 'i'), `deep dive must cover ${term}`);

  const commandBlocks = (deep.match(/```bash\n/g) || []).length;
  const validatedBlocks = (deep.match(/\*\*(?:Validated (?:output|result)|Output structure)\*\*/g) || []).length;
  assert.equal(commandBlocks, validatedBlocks, 'every deep-dive command needs validated output');
  assert.doesNotMatch(deep, /placeholder|folded in during live lab validation/i);
  assert.match(deep, /:::tip\[Where you will use this\]/);
});

test('Section 8 keeps the teardown recovery and learner navigation complete', () => {
  const lab = read('lab.md');
  const deep = read('deep-dive.md');
  const challenge = read('operator-challenge.md');

  assert.match(lab, /command ls -1 section-8/);
  assert.match(deep, /Run the baseline with Terraform/);
  assert.match(deep, /Run the repaired pipeline/);
  assert.match(deep, /Compare the OpenTofu evidence/);
  assert.match(deep, /Your hashes will not match a recording or another run/);
  assert.match(challenge, /section-8\/challenge\/answer-key\.md/);
});

test('Section 8 quiz has fifteen scenarios, at least five multi-selects, and complete explanations', () => {
  const quiz = read('quiz.mdx');
  assert.equal((quiz.match(/prompt:/g) || []).length, 15);
  assert.equal((quiz.match(/options:\[/g) || []).length, 15);
  assert((quiz.match(/multiSelect:true/g) || []).length >= 5);
  assert.equal((quiz.match(/explanation:/g) || []).length, 60);
  assert.equal((quiz.match(/correct:true/g) || []).length, 25);
  assert.equal((quiz.match(/correct:false/g) || []).length, 35);
  assert.doesNotMatch(quiz, /correctAnswers|"type"\s*:|"id"\s*:/);
  assert.match(quiz, /An agent returns formatted, valid Terraform/);
  assert.match(quiz, /Conftest exits zero/);
  assert.match(quiz, /Terraform and OpenTofu produce different plan hashes/);
});

test('Section 8 does not make superficial proof or approval claims', () => {
  const content = [read('lesson.md'), read('deep-dive.md'), read('quiz.mdx')].join('\n');
  for (const pattern of [
    /formatting proves (?:the )?infrastructure is safe/i,
    /validation proves (?:the )?infrastructure is secure/i,
    /zero findings (?:proves|guarantees) no security defects/i,
    /green pipeline automatically approves/i,
    /agent may approve (?:the )?(?:merge|apply|deployment)/i,
    /plan-only evidence proves production behaviour/i,
    /hashes prove correctness/i,
  ]) assert.doesNotMatch(content, pattern);

  for (const statement of [
    'Generated IaC begins as an untrusted candidate',
    'It cannot approve merge, deployment, or risk acceptance',
    'A person still reviews risk and decides what happens next',
  ]) assert.match(content, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});
