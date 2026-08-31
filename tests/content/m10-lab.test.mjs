import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const labUrl = new URL('../../docs/m10-deliver-infrastructure-gitops-human-approval/lab.md', import.meta.url);

function helmInstallSettings() {
  const lab = readFileSync(labUrl, 'utf8');
  const block = [...lab.matchAll(/```bash\n([\s\S]*?)\n```/g)]
    .map((match) => match[1])
    .find((candidate) => candidate.includes('helm upgrade --install argocd'));
  assert.ok(block, 'the learner Helm install block must exist');
  return new Map([...block.matchAll(/--set ([A-Za-z0-9.]+)=([^\s\\]+)/g)].map((match) => [match[1], match[2]]));
}

test('the constrained runtime gives the repo-server full liveness check five seconds', () => {
  const settings = helmInstallSettings();
  assert.equal(settings.get('repoServer.livenessProbe.timeoutSeconds'), '5');
});
