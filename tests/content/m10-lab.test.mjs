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
