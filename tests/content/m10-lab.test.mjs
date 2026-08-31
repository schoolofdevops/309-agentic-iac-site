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
