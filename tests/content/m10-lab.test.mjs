import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const labUrl = new URL('../../docs/m10-deliver-infrastructure-gitops-human-approval/lab.md', import.meta.url);

test('whole-fixture mirror replacements visibly reset only the local Argo repository cache', () => {
  const lab = readFileSync(labUrl, 'utf8');
  const restart = 'kubectl --context kind-agentic-iac-s10 -n argocd rollout restart deployment/argocd-repo-server';
  assert.equal(lab.split(restart).length - 1, 2, 'v2 and recovery must each reset the repo-server cache');
  assert.match(lab, /This cache reset is specific to the local lab fixture[\s\S]*Production Git\s+repositories keep one stable repository identity/);
  assert.equal(lab.split('kubectl --context kind-agentic-iac-s10 -n argocd rollout status deployment/argocd-repo-server --timeout=120s').length - 1, 2);
});

test('every stable Expected output block matches the preserved replay bytes', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.equal(lab.split('[ Expected output ]').length - 1, 4);
  for (const exact of [
    '[ Expected output ]\n\nThese file preparation commands print nothing.',
    '[ Expected output ]\n\n```text\nterraform_data.reviewed_delivery\tcreate\nterraform_data.reviewed_delivery\tcreate\n{\n  "reviewer": "human-platform-reviewer",\n  "apply_permitted": false\n}\n```',
    '[ Expected output ]\n\n```text\nNo kind clusters found.\n```',
    '[ Expected output ]\n\nThese process cleanup commands print nothing.',
  ]) assert.ok(lab.includes(exact), `missing exact replay output:\n${exact}`);
});

test('variable and abridged evaluator displays are honestly labeled', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.match(lab, /\[ sample output \]\n\n```text\nREJECTED: 3 primary finding\(s\); evidence <temporary-path>\/starter-evidence\n```/);
  assert.match(lab, /The evidence path varies by run\./);
  assert.match(lab, /The sample shortens each finding object to its `id`\./);
});

test('human approval stays foreground and visibly interactive through publication', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.doesNotMatch(lab, /owner-only handoff|binding\.json|\.sock|GATE_PID|GATE_LOG/);
  assert.match(lab, /keeps the exact gate binding in memory[\s\S]*Only\s+that live process writes the approval record/);
  assert.equal(lab.split('node section-10/scripts/open-gitops-approval-gate.mjs').length - 1, 2);
  assert.equal(lab.split('node section-10/scripts/approve-gitops-revision.mjs').length - 1, 0);
  assert.equal(lab.split('Approval> type exactly: approve ').length - 1, 2);
  assert.match(lab, /```text\napprove bd7ef2a026ef20cba82f95bca56487721277487d\n```/);
  assert.match(lab, /```text\napprove 06aae8fb5edfebd1ff0637648ccc762de74553f5\n```/);
  const blocks = [...lab.matchAll(/```bash\n([\s\S]*?)\n```/g)]
    .map((match) => match[1])
    .filter((block) => block.includes('open-gitops-approval-gate.mjs'));
  assert.equal(blocks.length, 2);
  for (const block of blocks) {
    assert.doesNotMatch(block, /\||<<|\b(?:echo|printf)\b|2>&1|&\s*$/m,
      'approval input must be typed at the foreground prompt');
  }
});

test('Section 10 accepts both clean and older three-file Section 9 handoffs', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.match(lab, /If `git status --short` prints nothing, your Section 9 checkpoint is already\s+saved/i);
  for (const path of [
    'section-9/chart/templates/deployment.yaml',
    'section-9/chart/values.schema.json',
    'section-9/chart/values.yaml',
  ]) assert.ok(lab.includes(path));
  assert.match(lab, /git commit -m 'Complete Section 9 Helm repair'/);
  assert.match(lab, /do not include it in this commit and do not hide it with a broad\s+stash/i);
});

test('tool discovery reports both proven profiles without an artificial version gate', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.match(lab, /Kind 0\.27 with\s+kubectl 1\.35/i);
  assert.match(lab, /Kind 0\.32 with kubectl 1\.36/i);
  assert.match(lab, /Do not reject a working machine only because its version differs/i);
  assert.match(lab, /Stop only if a printed\s+command reports a real tool or runtime failure/i);
  assert.doesNotMatch(lab, /requires Kind 0\.32\.0 or newer/i);
  assert.doesNotMatch(lab, /install that exact client before continuing/i);
  assert.doesNotMatch(lab, /Install Kind 0\.32\.0 or newer/i);
});

test('revert follows a readable and distinct v1-v2 lineage checkpoint', () => {
  const lab = readFileSync(labUrl, 'utf8');
  const identity = lab.indexOf("printf 'v1_revision=%s\\nv2_revision=%s\\n'");
  const v1 = lab.indexOf('git show --no-patch --oneline "$S10_V1_REVISION"');
  const v2 = lab.indexOf('git show --no-patch --oneline "$S10_V2_REVISION"');
  const revert = lab.indexOf('git revert --no-edit "$S10_V2_REVISION"');
  assert.ok(identity > 0 && identity < v1 && v1 < v2 && v2 < revert);
  assert.match(lab, /two full revision values must be present and different/i);
  assert.match(lab, /Promote inference platform to s10-v2/);
});

test('read-only approval marker cleanup is exact and noninteractive', () => {
  const lab = readFileSync(labUrl, 'utf8');
  assert.match(lab, /command rm -f "\$S10_V2_APPROVAL"[\s\S]*"\$S10_APPROVAL_ROOT\/\.agentic-iac-s10-approval-root"/);
  assert.doesNotMatch(lab, /\nrm "\$S10_V2_APPROVAL"/);
  assert.match(lab, /remaining\s+file-removal commands print nothing/i);
});
