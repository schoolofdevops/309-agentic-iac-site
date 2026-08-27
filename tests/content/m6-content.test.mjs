import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const title = 'Build, Test, and Optimize Reliable IaC Agent Workflows';
const lectureTitles = [
  'What Is an Agent Workflow Harness?',
  'Superpowers-Style Workflow Patterns',
  'Isolation, Checkpoints, and Recovery',
  'Evaluation Design for Agentic IaC',
  'Functional, Safety, and Regression Evals',
  'Run Telemetry and Failure Classification',
  'Token and Cost Engineering',
  'RTK, Caveman, and Evaluation-Driven Optimization',
];

test('Section 6 teaches all eight approved lectures in order', async () => {
  const lesson = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/lesson.md');
  const headings = [...lesson.matchAll(/^## ([1-8])\. (.+)$/gm)].map((match) => match[2]);
  assert.deepEqual(headings, lectureTitles);
  assert.ok(lesson.split(/\s+/).length >= 3500, 'lesson must build a deep conceptual foundation');

  for (const mechanism of [
    'specification',
    'worktree',
    'test-first',
    'functional',
    'safety',
    'regression',
    'budget',
    'Run Card',
    'failure classes',
    'not provider billing',
    'RTK',
    'Caveman',
    'Codex',
    'Claude Code',
    'Goose',
    'Cursor',
    'Copilot',
    'VS Code',
  ]) {
    assert.match(lesson, new RegExp(mechanism.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('Section 6 deep dive audits the evaluator, not only the agent', async () => {
  const deepDive = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/deep-dive.md');
  assert.ok(deepDive.split(/\s+/).length >= 1800, 'deep dive must go beyond lesson summary');
  for (const topic of [
    'false green',
    'false red',
    'evaluator independence',
    'mutation test',
    'benchmark leakage',
    "Goodhart's law",
    'telemetry privacy',
    'budget gaming',
    'model judge',
    'confused deputy',
    'shadow mode',
  ]) {
    assert.match(deepDive, new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('Section 6 lab and challenge remain human-first and match proven evidence', async () => {
  const lab = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/lab.md');
  const challenge = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/operator-challenge.md');
  assert.match(lab, /PASS \(1\/1 enabled gates passed\)/);
  assert.match(lab, /REJECTED \(2\/4 enabled gates passed\)/);
  assert.match(lab, /PASS \(4\/4 enabled gates passed\)/);
  assert.match(lab, /d5cf5251402751f5306926a8d54f2d21066559fe/);
  assert.doesNotMatch(lab, /\btest\s+-[efdLrswx]|command find|\.agent-choice|rm -rf/);
  assert.match(challenge, /second agent/i);
  assert.match(challenge, /mutation validator/i);
  assert.match(challenge, /smallest relevant change/i);
});

test('Section 6 quiz has 15 questions, five multi-selects, and every option explained', async () => {
  const quiz = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/quiz.mdx');
  assert.equal(quiz.match(/\bprompt:/g)?.length, 15);
  assert.equal(quiz.match(/\bmultiSelect:true/g)?.length, 5);
  assert.equal(quiz.match(/\{text:/g)?.length, 60);
  assert.equal(quiz.match(/\bexplanation:/g)?.length, 60);
});

test('Section 6 uses the exact approved title and five-page sidebar order', async () => {
  const lesson = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/lesson.md');
  const lab = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/lab.md');
  const quiz = await read('docs/m6-build-test-optimize-reliable-iac-agent-workflows/quiz.mdx');
  const sidebar = await read('sidebars.ts');
  assert.match(lesson, new RegExp(`# ${title}`));
  assert.match(lab, new RegExp(`# Lab: ${title}`));
  assert.match(quiz, new RegExp(`# ${title} Quiz`));
  const category = sidebar.match(/label: 'Section 6[^]*?\n\s*},/m)?.[0] ?? '';
  assert.match(category, new RegExp(title));
  for (const page of ['lesson', 'lab', 'operator-challenge', 'deep-dive', 'quiz']) {
    assert.match(category, new RegExp(`m6-build-test-optimize-reliable-iac-agent-workflows/${page}`));
  }
});
