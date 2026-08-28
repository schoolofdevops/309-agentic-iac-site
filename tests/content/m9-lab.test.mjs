import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const labUrl = new URL('../../docs/m9-deploy-applications-kubernetes-helm-ai-agents/lab.md', import.meta.url);
const readLab = () => readFileSync(labUrl, 'utf8');

test('Section 9 lab follows the complete human-first repair and runtime arc', () => {
  const lab = readLab();
  const stages = [
    '## PART I - Inspect',
    '## PART II - Predict',
    '## PART III - Render',
    '## PART IV - Reject',
    '## PART V - Repair',
    '## PART VI - Compare',
    '## PART VII - Run',
    '## PART VIII - Observe',
    '## PART IX - Diagnose',
    '## Checkpoint',
    '## Teardown',
  ];
  let previous = -1;
  for (const stage of stages) {
    const offset = lab.indexOf(stage);
    assert(offset > previous, `${stage} must follow the previous lab stage`);
    previous = offset;
  }

  for (const command of [
    'pwd',
    'command ls -1 section-9',
    'helm lint --strict section-9/chart',
    'helm template inference-platform section-9/chart',
    'kubectl --context kind-agentic-iac-s9 --namespace inference get pods',
    'kubectl --context kind-agentic-iac-s9 --namespace inference describe deployment/inference-platform-api',
    'kubectl --context kind-agentic-iac-s9 --namespace inference logs deployment/inference-platform-worker',
    'http://127.0.0.1:18080/readyz',
  ]) assert.match(lab, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Section 9 lab freezes the two-defect starter and exact three-file candidate', () => {
  const lab = readLab();
  assert.match(lab, /exactly two primary findings/i);
  assert.match(lab, /committed-backend-token-material/);
  assert.match(lab, /missing-worker-resource-limits/);
  assert.match(lab, /718fd28edab8a026bab114c0f21800e2df450c83/);
  assert.match(lab, /git apply --check section-9\/recovery\/718fd28edab8a026bab114c0f21800e2df450c83\.patch/);
  assert.match(lab, /git apply section-9\/recovery\/718fd28edab8a026bab114c0f21800e2df450c83\.patch/);
});

test('Section 9 lab demonstrates one portable agent task and keeps commands readable', () => {
  const lab = readLab();
  assert.equal((lab.match(/```bash\ncodex\n```/g) || []).length, 1);
  for (const name of ['Claude Code', 'Goose', 'Cursor', 'Copilot', 'VS Code agents', 'manual editing']) {
    assert.match(lab, new RegExp(name, 'i'));
  }
  assert.match(lab, /same task contract/i);
  assert.match(lab, /job-0001/);
  assert.match(lab, /"status":"queued"/);
  assert.match(lab, /MOCK INFERENCE: HELLO PLATFORM/);
  assert.match(lab, /NetworkPolicy is\s+disabled/i);

  for (const pattern of [/\btest -[efd]\b/, /\bfind\s+section-9/, /node -e/, /rm -rf/, /meaningless marker/i]) {
    assert.doesNotMatch(lab, pattern);
  }
});
