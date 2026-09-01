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
  assert.match(lab, /git diff --binary HEAD -- section-9\/chart\/templates\/deployment\.yaml section-9\/chart\/values\.schema\.json section-9\/chart\/values\.yaml > "\$S9_TEMP_ROOT\/section-9-learner-attempt\.patch"/);
  assert.match(lab, /git restore --source fdcc15c57c9879b3f15d03319ad5dd394e2706f2 --staged --worktree -- section-9\/chart\/templates\/deployment\.yaml section-9\/chart\/values\.schema\.json section-9\/chart\/values\.yaml/);
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
  assert.match(lab, /Do you trust the contents of this directory\?/);
  assert.match(lab, /Working with untrusted contents\s+comes with higher risk of prompt injection\./);
  assert.match(lab, /project-local config, hooks, and exec policies\s+to load\./);
  assert.match(lab, /1\. Yes, continue/);
  assert.match(lab, /2\. No, quit/);
  assert.match(lab, /human.*approves.*repository trust/is);
  assert.match(lab, /job-0001/);
  assert.match(lab, /"status":"queued"/);
  assert.match(lab, /MOCK INFERENCE: HELLO PLATFORM/);
  assert.match(lab, /NetworkPolicy is\s+disabled/i);

  for (const pattern of [/\btest -[efd]\b/, /\bfind\s+section-9/, /node -e/, /rm -rf/, /meaningless marker/i]) {
    assert.doesNotMatch(lab, pattern);
  }
});

test('Section 9 lab prints exact kubeconform evidence and tolerates unrelated Kind clusters', () => {
  const lab = readLab();
  assert.match(lab, /Summary: 9 resources found in 4 files - Valid: 9, Invalid: 0, Errors: 0, Skipped: 0/);
  assert.match(lab, /Unrelated Kind clusters\s+may remain/i);
  assert.match(lab, /exact name `agentic-iac-s9`.*absent/is);
  assert.doesNotMatch(lab, /\[ Expected output \]\n\n```text\nNo kind clusters found\./);
});

test('Section 9 teardown prints the complete Kind deletion output', () => {
  const lab = readLab();
  assert.match(lab, /kind delete cluster --name agentic-iac-s9/);
  assert.match(lab, /```text\nDeleting cluster "agentic-iac-s9" \.\.\.\nDeleted nodes: \["agentic-iac-s9-control-plane"\]\n```/);
});

test('Section 9 lab updates a returning learner clone without discarding Section 8 work', () => {
  const lab = readLab();
  const status = lab.indexOf('git status --short');
  const stash = lab.indexOf('git stash push --include-untracked -m "section-8-checkpoint" -- section-8');
  const fetch = lab.indexOf('git fetch origin main');
  const fastForward = lab.indexOf('git merge --ff-only origin/main');
  const restore = lab.indexOf('git stash pop');
  const section = lab.indexOf('command ls -1 section-9');

  assert(status >= 0, 'the learner must inspect local work before updating');
  assert(stash > status, 'the lab must preserve learner-owned Section 8 changes before updating');
  assert(fetch > stash, 'the lab must fetch the released learner branch after preserving local work');
  assert(fastForward > fetch, 'the learner branch must fast-forward to the release');
  assert(restore > fastForward, 'the lab must restore the learner-owned Section 8 changes');
  assert(section > restore, 'Section 9 inspection must happen after the repository update');
  assert.match(lab, /fresh clone/i);
  assert.match(lab, /https:\/\/github\.com\/schoolofdevops\/309-agentic-iac-labs\.git/);
});

test('Section 9 lab separates two proven tool profiles from nearby unproven versions', () => {
  const lab = readLab();
  assert.match(lab, /Kind 0\.27 with kubectl 1\.35/i);
  assert.match(lab, /Kind 0\.32 with kubectl 1\.36/i);
  assert.match(lab, /two directly tested profiles/i);
  assert.match(lab, /nearby versions may work/i);
  assert.match(lab, /not directly proven/i);
  assert.match(lab, /continue to attempt\s+the lab/i);
  assert.match(lab, /Stop only when a required\s+tool is missing or an actual tool or runtime\s+command fails/i);
  assert.doesNotMatch(lab, /Kind 0\.27 through 0\.32|kubectl 1\.35 through 1\.36/i);
  assert.doesNotMatch(lab, /Kind 0\.28 through 0\.32 use the same course path/i);
});

test('Section 9 lab renders to a file before kubeconform validates it', () => {
  const lab = readLab();
  const render = 'helm template inference-platform section-9/chart --namespace inference --set networkPolicy.enabled=false --output-dir "$S9_RENDER_ROOT"';
  const validate = 'kubeconform -strict -summary "$S9_RENDER_ROOT/inference-platform/templates"';

  assert.match(lab, new RegExp(render.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(lab, new RegExp(validate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(lab.indexOf(render) < lab.indexOf(validate), 'render must finish before validation starts');
  assert.doesNotMatch(lab, /helm template[^\n]+\|\s*kubeconform/);
  assert.match(lab, /wrote .*inference-platform\/templates\/serviceaccount\.yaml/i);
  assert.match(lab, /9 resources found in 4 files/i);
});

test('Section 9 names the live diagnostics lab separately from the packet-only operator review', () => {
  const lab = readLab();
  assert.match(lab, /advanced live diagnostics lab/i);
  assert.match(lab, /deliberately injects and recovers three faults/i);
  assert.match(lab, /sidebar Operator Challenge/i);
  assert.match(lab, /independent packet-only\s+review/i);
  assert.doesNotMatch(lab, /independent diagnostic challenge/i);
});

test('Section 9 lets the learner reconcile the direct Helm command with evaluator provenance', () => {
  const lab = readLab();
  assert.ok(lab.indexOf('command -v helm') < lab.indexOf('helm version --short'));
  assert.match(lab, /"tool_paths": \{/);
  assert.match(lab, /"helm": "<resolved Helm path>"/);
  assert.match(lab, /uses that exact path for every Helm gate/i);
  assert.match(lab, /compare `tool_paths\.helm` and `tool_versions\.helm`/i);
  assert.match(lab, /yq --version/);
});

test('Section 9 ends with a human checkpoint commit for exactly the three repair files', () => {
  const lab = readLab();
  const heading = lab.indexOf('### Save the reviewed Section 9 repair');
  const checkpoint = lab.indexOf('## Checkpoint');
  assert.ok(heading > 0 && heading < checkpoint, 'repair commit must precede the Section 9 checkpoint');
  assert.match(lab, /git add \\\n+  section-9\/chart\/templates\/deployment\.yaml \\\n+  section-9\/chart\/values\.schema\.json \\\n+  section-9\/chart\/values\.yaml/);
  assert.match(lab, /git commit -m 'Complete Section 9 Helm repair'/);
  assert.match(lab, /git show --stat --oneline --summary HEAD/);
  assert.match(lab, /final `git status --short` should print nothing/i);
});

test('Section 9 sets a copy-safe local Git identity before the learner creates commits', () => {
  const lab = readLab();
  const identity = lab.indexOf('git config --local user.name "Course Learner"');
  const firstCommit = lab.indexOf("git commit -m 'Complete Section 9 Helm repair'");
  assert.ok(identity > lab.indexOf('pwd'), 'identity setup must follow the repository location check');
  assert.ok(identity < firstCommit, 'local identity must be set before the learner commit');
  assert.match(lab, /git config --local user\.email "learner@example\.invalid"/);
  assert.match(lab, /git config --get user\.name\ngit config --get user\.email/);
  assert.match(lab, /```text\nCourse Learner\nlearner@example\.invalid\n```/);
  assert.match(lab, /identity.*recorded.*commit.*evidence/is);
  assert.match(lab, /use your own name\s+and email/i);
  assert.doesNotMatch(lab, /git config --global user\.(?:name|email)/);
});

test('Section 9 starter-evidence teardown explains and tolerates the selected recovery path', () => {
  const lab = readLab();
  const cleanup = lab.slice(lab.indexOf('### Remove the exact temporary evidence'));
  assert.match(cleanup, /if \[\[ ! -d "\$S9_STARTER_EVIDENCE" \]\]/);
  assert.match(cleanup, /Starter evidence was not created; nothing to remove\./);
  assert.match(cleanup, /command rm -f "\$S9_STARTER_EVIDENCE\/\.section-9-evaluation\.json"/);
  assert.doesNotMatch(cleanup, /rm "\$S9_TEMP_ROOT\/agentic-iac-section-9-starter\/\.section-9-evaluation\.json"/);
});
