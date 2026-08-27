import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const lectureTitles = [
  'Capability Boundaries for Agents',
  'CLI, API, MCP, Skill, or Manual Step?',
  'CLI as the Portable Execution and Evidence Plane',
  'Build an Agent Skill for Terraform Review',
  'Test, Version, Own, and Revoke Skills',
  'MCP for Narrow Context and Tool Access',
  'Tool and Skill Supply-Chain Threats',
  'Agent Adapters Without Vendor Lock-In',
];

test('Section 5 teaches all eight approved lectures in order', async () => {
  const lesson = await read('docs/m5-connect-iac-agent-tools-skills-mcp/lesson.md');
  const headings = [...lesson.matchAll(/^## ([1-8])\. (.+)$/gm)].map((match) => match[2]);

  assert.deepEqual(headings, lectureTitles);
  for (const mechanism of [
    'effective authority = task scope',
    'CLI, API, MCP, Skill, or Manual',
    'progressive disclosure',
    'server/discover',
    '2026-07-28',
    'confused deputy',
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

test('Section 5 separates official protocol facts from course controls', async () => {
  const bundle = [
    await read('docs/m5-connect-iac-agent-tools-skills-mcp/lesson.md'),
    await read('docs/m5-connect-iac-agent-tools-skills-mcp/deep-dive.md'),
  ].join('\n');

  assert.match(bundle, /official \[Agent Skills specification\]/i);
  assert.match(bundle, /official \[MCP 2026-07-28 specification\]/i);
  assert.match(bundle, /course engineering control/i);
  assert.match(bundle, /course control artifact/i);
  assert.match(bundle, /annotations as untrusted|annotations are hints/i);
  assert.match(bundle, /allowed-tools[\s\S]{0,120}metadata|metadata[\s\S]{0,120}allowed-tools/i);
  assert.match(bundle, /not be treated as an operating-system permission boundary/i);
});

test('Section 5 quiz has 15 questions, five multi-selects, and every option explained', async () => {
  const quiz = await read('docs/m5-connect-iac-agent-tools-skills-mcp/quiz.mdx');

  assert.equal(quiz.match(/\bprompt:/g)?.length, 15);
  assert.equal(quiz.match(/\bmultiSelect:true/g)?.length, 5);
  assert.equal(quiz.match(/\{text:/g)?.length, 60);
  assert.equal(quiz.match(/\bexplanation:/g)?.length, 60);
});

test('Section 5 appears in learner sidebar order with five published pages', async () => {
  const sidebar = await read('sidebars.ts');
  const category = sidebar.match(/label: 'Section 5[^]*?\n\s*},/m)?.[0] ?? '';

  assert.match(category, /Connect Your IaC Agent to Tools, Skills, and MCP/);
  for (const page of ['lesson', 'lab', 'operator-challenge', 'deep-dive', 'quiz']) {
    assert.match(category, new RegExp(`m5-connect-iac-agent-tools-skills-mcp/${page}`));
  }
});
