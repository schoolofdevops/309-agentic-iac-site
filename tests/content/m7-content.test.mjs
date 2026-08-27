import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const docs = new URL('../../docs/m7-build-infrastructure-terraform-opentofu-ai/', import.meta.url);
const read = (name) => readFileSync(new URL(name, docs), 'utf8');
const lessonTitles = [
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

test('Section 7 teaches all eleven approved lectures in order', () => {
  const lesson = read('lesson.md');
  const headings = [...lesson.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings.slice(0, 11), lessonTitles);
  const words = lesson.replace(/^---[\s\S]*?---/, '').split(/\s+/).filter(Boolean).length;
  assert(words >= 3800, `lesson has only ${words} words`);
  for (const term of ['unknown', 'dependency graph', '.terraform.lock.hcl', 'moved', 'state lineage', 'least privilege', '6.61.0']) {
    assert.match(lesson, new RegExp(term.replace('.', '\\.'), 'i'));
  }
});

test('Section 7 deep dive audits provider, state, lock, and refactor failure modes', () => {
  const deep = read('deep-dive.md');
  const words = deep.replace(/^---[\s\S]*?---/, '').split(/\s+/).filter(Boolean).length;
  assert(words >= 1400, `deep dive has only ${words} words`);
  for (const term of ['unknown', 'provider planning', 'graph cycles', 'lineage', 'checksums', 'state mv', 'replacement', 'one writer']) {
    assert.match(deep, new RegExp(term, 'i'));
  }
});

test('Section 7 lab and challenge remain human-first and match proven evidence', () => {
  const lab = read('lab.md');
  const challenge = read('operator-challenge.md');
  assert.match(lab, /Resources: 8 created, 1 moved, 1 changed in place, 0 remain/);
  assert.match(lab, /ca2a5fd324a8007cf14efc827d1edc9d25044fcb/);
  assert.match(lab, /36\.2 MiB/);
  assert.match(lab, /61\.83 MiB/);
  assert.match(lab, /explicit approval for this one disposable\s+local run/i);
  for (const pattern of [/\btest -[efd]\b/, /\bfind\s+section-7/, /\.agent-choice/, /node -e/, /rm -rf/]) assert.doesNotMatch(lab, pattern);
  for (const signal of ['update in-place', 'replace', 'known after apply', 'moved to']) assert.match(challenge, new RegExp(signal));
});

test('Section 7 quiz has 15 questions, five multi-selects, and every option explained', () => {
  const quiz = read('quiz.mdx');
  assert.equal((quiz.match(/prompt:/g) || []).length, 15);
  assert.equal((quiz.match(/multiSelect:true/g) || []).length, 5);
  assert.equal((quiz.match(/options:\[/g) || []).length, 15);
  assert.equal((quiz.match(/explanation:/g) || []).length, 60);
  assert.equal((quiz.match(/correct:true/g) || []).length, 25);
});

test('Section 7 uses the exact title and five-page sidebar order', () => {
  const sidebar = readFileSync(new URL('../../sidebars.ts', import.meta.url), 'utf8');
  assert.match(sidebar, /Section 7 — Build Infrastructure with Terraform, OpenTofu, and AI Agents/);
  const start = sidebar.indexOf("'m7-build-infrastructure-terraform-opentofu-ai/lesson'");
  const order = ['lesson', 'lab', 'operator-challenge', 'deep-dive', 'quiz'].map((page) => sidebar.indexOf(`'m7-build-infrastructure-terraform-opentofu-ai/${page}'`));
  assert(start >= 0);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});
