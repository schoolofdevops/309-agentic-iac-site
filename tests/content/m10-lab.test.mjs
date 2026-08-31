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
