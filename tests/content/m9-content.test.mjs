import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const docs = new URL('../../docs/m9-deploy-applications-kubernetes-helm-ai-agents/', import.meta.url);
const read = (name) => readFileSync(new URL(name, docs), 'utf8');
const words = (source) => source
  .replace(/^---[\s\S]*?---/, '')
  .replace(/```[\s\S]*?```/g, ' ')
  .split(/\s+/)
  .filter(Boolean).length;

const lectureTitles = [
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

test('Section 9 teaches all eleven approved lectures in exact order and at full depth', () => {
  const lesson = read('lesson.md');
  const headings = [...lesson.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, lectureTitles);
  assert(words(lesson) >= 5200, `lesson has only ${words(lesson)} substantive words`);
  assert.equal((lesson.match(/\*\*Lecture \d+ · \d+ minutes\*\*/g) || []).length, 11);

  for (const term of [
    'desired state',
    'reconciliation',
    'status',
    'events',
    'EndpointSlice',
    'values.schema.json',
    'chart version',
    'application version',
    'Kustomize',
    'kubeconform',
    'Conftest',
    'ServiceAccount',
    'automountServiceAccountToken',
    'external Secret',
    'startup probe',
    'readiness probe',
    'liveness probe',
    'terminationGracePeriodSeconds',
    'NetworkPolicy',
    'no enforcement claim',
  ]) assert.match(lesson, new RegExp(term, 'i'), `lesson must teach ${term}`);

  assert((lesson.match(/```mermaid/g) || []).length >= 7, 'lesson needs visible mechanism diagrams');
  assert((lesson.match(/```yaml/g) || []).length >= 5, 'lesson needs annotated workload artifacts');
  assert((lesson.match(/^\|.+\|$/gm) || []).length >= 35, 'lesson needs visible evidence and decision tables');
});

test('Section 9 carries the exact tested project and measured evidence without overstating proof', () => {
  const content = [read('lesson.md'), read('deep-dive.md')].join('\n');

  for (const term of [
    'API → dependencies → worker → result',
    'job-0001',
    'MOCK INFERENCE: HELLO PLATFORM',
    'nine objects',
    '10,617',
    '13 gates',
    '45.698',
    '49.630',
    '643.1 MiB',
    '671.1 MiB',
    '3,241,788 bytes',
    '7.744 GiB',
    'READY_FOR_HUMAN_REVIEW',
  ]) assert.match(content, new RegExp(term, 'i'), `content must carry proven evidence: ${term}`);

  for (const pattern of [
    /READY_FOR_HUMAN_REVIEW (?:approves|authorizes) (?:an )?(?:install|deployment)/i,
    /Helm lint proves (?:the )?runtime/i,
    /rendered YAML proves (?:the )?(?:Pod|workload) (?:is|will be) healthy/i,
    /Kind proves (?:the )?cloud/i,
    /NetworkPolicy (?:was|is) enforced in the core (?:lab|profile)/i,
    /configured capacity (?:is|equals) (?:the )?(?:working set|measured memory)/i,
  ]) assert.doesNotMatch(content, pattern);
});

test('Section 9 deep dive connects render evidence to runtime evidence and its limits', () => {
  const deep = read('deep-dive.md');
  assert.match(deep, /sidebar_position: 4/);
  assert.match(deep, /title: 'Deep Dive: Rendered YAML and Runtime Evidence'/);
  assert.match(deep, /sidebar_label: 'Deep Dive: Rendered YAML and Runtime Evidence'/);
  assert(words(deep) >= 2300, `deep dive has only ${words(deep)} substantive words`);

  for (const term of [
    'render evidence',
    'runtime evidence',
    'generation',
    'observedGeneration',
    'conditions',
    'readinessGates',
    'EndpointSlice',
    'ConfigMap',
    'projected volume',
    'external Secret',
    'requests',
    'limits',
    'NetworkPolicy',
    'CNI',
    'DNS',
    'proof limit',
  ]) assert.match(deep, new RegExp(term, 'i'), `deep dive must cover ${term}`);

  assert((deep.match(/```mermaid/g) || []).length >= 2);
  assert.match(deep, /:::tip\[Where you will use this\]/);
  assert.doesNotMatch(deep, /<expected output|folded in during live lab validation/i);
  assert.doesNotMatch(deep, /An copied policy/);
});

test('Section 9 independent packet-only operator review preserves three sequential incidents', () => {
  const challenge = read('operator-challenge.md');
  assert.match(challenge, /independent packet-only review/i);
  assert.match(challenge, /do not inject a fault/i);
  const incidents = [...challenge.matchAll(/^## Incident ([A-C])$/gm)].map((match) => match[1]);
  assert.deepEqual(incidents, ['A', 'B', 'C']);
  assert(words(challenge) >= 700, `challenge has only ${words(challenge)} substantive words`);

  for (const term of [
    'evidence packet',
    'complete\\s+the\\s+recovery\\s+proof\\s+before',
    'Pod status',
    'rollout status',
    'events',
    'EndpointSlice',
    'live Deployment',
    'logs',
    'Helm render',
    'Helm values',
    'live Service',
    'HTTP 200',
    'likely layer and cause',
    'bounded verification',
    'recovery proof',
    'record your answers',
  ]) assert.match(challenge, new RegExp(term, 'i'), `challenge must require ${term}`);

  for (const leak of [
    'challenge/task.md',
    'diagnostic task',
    'answer-key',
    'bad-readiness-path',
    'unreachable-backend-connection',
    'wrong-helm-value',
    'unreachable-backend',
    'http://unreachable-backend:8081',
    'service.api.nodePort=30081',
    '30081',
    '30080',
    '/readyz',
    '/ready',
    '"value":"/readyz"',
    'kubectl patch',
    'helm upgrade',
    '--reset-values',
    'the root cause is',
  ]) assert.doesNotMatch(challenge, new RegExp(leak, 'i'), `challenge leaks ${leak}`);
});

test('Section 9 keeps NetworkPolicy intent separate from the disabled core runtime', () => {
  const lesson = read('lesson.md');
  const quiz = read('quiz.mdx');

  assert.doesNotMatch(lesson, /denied by tested policy/i);
  assert.match(lesson, /unproven in (?:the )?core profile/i);
  assert.match(quiz, /networkPolicy\.enabled=false/);
  assert.match(quiz, /no NetworkPolicy object (?:was|is) rendered or enforced/i);
  assert.match(quiz, /optional policy render/i);
  assert.doesNotMatch(quiz, /A valid NetworkPolicy object exists in the core Kind run/i);
});

test('Section 9 quiz has fifteen balanced scenarios and complete explanations', () => {
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
  const correctAverage = options.filter((option) => option.correct)
    .reduce((sum, option) => sum + option.text.length, 0) / options.filter((option) => option.correct).length;
  const distractorAverage = options.filter((option) => !option.correct)
    .reduce((sum, option) => sum + option.text.length, 0) / options.filter((option) => !option.correct).length;
  assert(correctAverage / distractorAverage > 0.85 && correctAverage / distractorAverage < 1.15,
    `option lengths are biased: correct ${correctAverage.toFixed(1)}, distractor ${distractorAverage.toFixed(1)}`);

  for (const term of [
    'accepted by the Kubernetes API',
    'Helm values schema',
    'Kustomize',
    'rendered manifest',
    'ServiceAccount',
    'readiness',
    'graceful shutdown',
    'NetworkPolicy',
    'EndpointSlice',
    'Kind node',
  ]) assert.match(quiz, new RegExp(term, 'i'), `quiz must assess ${term}`);
});

test('Section 9 uses human searchable page titles and is wired after Section 8', () => {
  const lesson = read('lesson.md');
  const deep = read('deep-dive.md');
  const challenge = read('operator-challenge.md');
  const sidebar = readFileSync(new URL('../../sidebars.ts', import.meta.url), 'utf8');

  assert.match(lesson, /title: 'Deploy Applications with Kubernetes, Helm, and AI Agents'/);
  assert.match(challenge, /title: 'Operator Challenge - Independent Evidence Packet Review'/);
  for (const source of [lesson, deep, challenge]) {
    assert.doesNotMatch(source, /\b(?:unleash|supercharge|magic|wizard|bot-powered|master Kubernetes)\b/i);
  }

  const section8 = sidebar.indexOf("label: 'Section 8 — Test and Secure AI-Generated Infrastructure Code'");
  const section9 = sidebar.indexOf("label: 'Section 9 — Deploy Applications with Kubernetes, Helm, and AI Agents'");
  assert(section8 >= 0 && section9 > section8, 'Section 9 must follow Section 8');
  for (const page of ['lesson', 'lab', 'operator-challenge', 'deep-dive', 'quiz']) {
    assert.match(sidebar, new RegExp(`m9-deploy-applications-kubernetes-helm-ai-agents/${page}`));
  }
});
