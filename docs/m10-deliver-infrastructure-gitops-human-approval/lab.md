---
sidebar_position: 2
title: 'Lab: Deliver Infrastructure with GitOps and Human Approval'
---

# Lab - Deliver Infrastructure with GitOps and Human Approval

In this lab, you review a rejected delivery change, repair three trust
failures, and promote the mock inference platform through Git and Argo CD. You
also prove that drift remains visible when automatic self-heal is disabled.

All infrastructure commands are plan only. You will not run Terraform apply,
OpenTofu apply, or a cloud command.

The tested authoring path used an arm64 machine. It completed below 2 GiB for
the named Kind control-plane container. Use at least 7 GB RAM, 4 logical CPUs,
and 20 GB free disk. If less than 7 GB is available, continue only if you accept
slower startup and possible local resource pressure. The lab does not fail only
because the host reports less RAM.

## PART I - Review and Repair the Candidate

### Check the learner branch

Run these commands from the root of your `309-agentic-iac-labs` clone. A clean
branch prevents an old change from entering the approval evidence.

```bash
pwd
git status --short
```

[ sample output ]

```text
/Users/learner/309-agentic-iac-labs
```

`git status --short` should print nothing. Commit or move unrelated work before
you continue.

### Create isolated evidence locations

The evaluator must come from the approved base commit, not from the candidate
being reviewed. Save that commit and create a detached trusted worktree.

```bash
S10_BASE_REVISION="$(git rev-parse HEAD)"
S10_OS_TEMP="${TMPDIR:-/tmp}"
S10_OS_TEMP="${S10_OS_TEMP%/}"
S10_TEMP_ROOT="$(mktemp -d "${S10_OS_TEMP}/agentic-iac-s10-human.XXXXXX")"
S10_TRUSTED_ROOT="$S10_TEMP_ROOT/trusted"
S10_PLAN_ROOT="$S10_TEMP_ROOT/plans"
S10_APPROVAL_ROOT="$S10_TEMP_ROOT/approvals"
S10_MIRROR_ROOT="$S10_OS_TEMP/agentic-iac-s10-gitops"
S10_STARTER_EVIDENCE="$S10_OS_TEMP/agentic-iac-s10-starter-$$"
S10_REPAIRED_EVIDENCE="$S10_OS_TEMP/agentic-iac-s10-repaired-$$"

mkdir "$S10_APPROVAL_ROOT"
git worktree add --detach "$S10_TRUSTED_ROOT" "$S10_BASE_REVISION"

printf 'base=%s\ntemporary_root=%s\nmirror_root=%s\n' \
  "$S10_BASE_REVISION" "$S10_TEMP_ROOT" "$S10_MIRROR_ROOT"
```

[ sample output ]

```text
base=07d79c4f8037dcd827e9c95cb389ccef8c2f670d
temporary_root=/private/tmp/agentic-iac-s10-human.A1b2C3
mirror_root=/private/tmp/agentic-iac-s10-gitops
```

Your commit and temporary suffix will differ.

### Examine the request and ownership boundary

Read the request before reading the candidate. Then read the task contract to
see which files a learner or coding agent may change.

```bash
sed -n '1,180p' section-10/request.md
sed -n '1,220p' section-10/task.md
```

[ sample output ]

The request and task contract are printed in full.

The request allows a plan and a reviewed GitOps delivery. It does not allow
apply, self-approval, privileged workflow changes, or automatic cluster sync.

Compare the candidate change list, delivery decision, and Application.

```bash
cat section-10/starter/changed-files.txt
jq . section-10/starter/delivery-decision.json
sed -n '1,180p' section-10/starter/gitops/application.yaml
```

[ sample output ]

The three candidate files are printed in full.

Look for these boundaries:

- the author and reviewer must be different people;
- a privileged workflow is outside this candidate's allowed change;
- Argo CD promotion must wait for an explicit human sync.

### Run the approved evaluator

The evaluator reads candidate data from Git and writes evidence outside the
repository. It does not apply or deploy anything.

```bash
node "$S10_TRUSTED_ROOT/section-10/scripts/run-starter-review.mjs" \
  --source "$PWD" \
  --trusted-revision "$S10_BASE_REVISION" \
  --candidate-revision "$S10_BASE_REVISION" \
  --output "$S10_STARTER_EVIDENCE"
```

[ Expected output ]

```text
REJECTED: 3 primary finding(s); evidence written outside the repository
```

Read the decision and the independent Terraform, OpenTofu, and Helm evidence.

```bash
jq '{status,findings,terraform,helm,apply_permitted}' \
  "$S10_STARTER_EVIDENCE/report.json"
```

[ Expected output ]

```json
{
  "status": "REJECTED",
  "findings": [
    "S10_ARGO_AUTOMATION_ENABLED",
    "S10_AUTHOR_SELF_APPROVAL",
    "S10_PRIVILEGED_WORKFLOW_CHANGED"
  ],
  "terraform": {
    "terraform": "VALID",
    "opentofu": "VALID"
  },
  "helm": {
    "lint": "PASS",
    "render": "PASS",
    "workload_policy": "PASS",
    "external_secret_reference": true,
    "network_policy_rendered": false
  },
  "apply_permitted": false
}
```

The valid Terraform and Helm evidence does not cancel the three trust
failures. Reject this candidate.

### Give a coding agent a bounded task

Codex can work from the same learner-owned boundary. A safe task contract is:

```text
Read section-10/task.md and repair only the three reported delivery decisions.
Do not edit trusted scripts, tests, policy, workflow, Terraform intent, or the
chart. Do not commit, approve, sync, deploy, apply, or delete anything. Show me
the diff and validation result for human review.
```

This is a demonstration of the boundary, not a required model call. Claude
Code, Goose, Cursor, Copilot, VS Code, another compatible coding agent, or
manual editing can make the same bounded change. Tool choice is not approval
evidence.

Use the reviewed patch for this no-model core path. Check it before applying
it, then examine every changed line.

```bash
git apply --check section-10/recovery/reviewed.patch
git apply section-10/recovery/reviewed.patch
git diff -- section-10/starter/changed-files.txt \
  section-10/starter/delivery-decision.json \
  section-10/starter/gitops/application.yaml
git diff --check
```

[ sample output ]

The three-file diff is printed. `git diff --check` prints nothing.

The diff should remove the privileged workflow claim, name the independent
reviewer, and remove the `automated` sync block. It should not change
Terraform or the chart.

### Commit the reviewed repair

A commit gives the evidence one exact revision. Approval and commit remain
human actions.

```bash
git add section-10/starter/changed-files.txt \
  section-10/starter/delivery-decision.json \
  section-10/starter/gitops/application.yaml
git diff --cached --check
git diff --cached --stat
git commit -m 'Repair Section 10 delivery boundaries'
S10_V1_REVISION="$(git rev-parse HEAD)"
printf 'v1_revision=%s\n' "$S10_V1_REVISION"
```

[ sample output ]

```text
[section10-gitops a0bb233] Repair Section 10 delivery boundaries
 3 files changed, 2 insertions(+), 6 deletions(-)
v1_revision=a0bb233ede26e14349ab8d7e97db2dd4415006f9
```

Your commit will differ.

### Compare the repaired evidence

Run the evaluator from the same approved base, but bind it to the new
candidate commit.

```bash
node "$S10_TRUSTED_ROOT/section-10/scripts/run-starter-review.mjs" \
  --source "$PWD" \
  --trusted-revision "$S10_BASE_REVISION" \
  --candidate-revision "$S10_V1_REVISION" \
  --output "$S10_REPAIRED_EVIDENCE"

jq '{status,findings,terraform,helm,apply_permitted}' \
  "$S10_REPAIRED_EVIDENCE/report.json"
```

[ Expected output ]

```text
READY_FOR_HUMAN_REVIEW: 0 primary finding(s)
```

The report should show an empty `findings` list, two valid engines, passing
Helm evidence, and `apply_permitted: false`.

### Produce direct Terraform and OpenTofu plans

Run each engine directly in a temporary copy. This keeps provider and plan
files out of the clean delivery repository used by later approval gates.

```bash
mkdir "$S10_PLAN_ROOT" \
  "$S10_PLAN_ROOT/terraform" \
  "$S10_PLAN_ROOT/opentofu"

cp section-10/terraform/main.tf \
  section-10/terraform/reviewed-plan.tftest.hcl \
  "$S10_PLAN_ROOT/terraform/"

cp section-10/terraform/main.tf \
  section-10/terraform/reviewed-plan.tftest.hcl \
  "$S10_PLAN_ROOT/opentofu/"
```

[ Expected output ]

These file preparation commands print nothing.

Run Terraform first. No command below is apply.

```bash
terraform -chdir="$S10_PLAN_ROOT/terraform" fmt -check
terraform -chdir="$S10_PLAN_ROOT/terraform" init -backend=false
terraform -chdir="$S10_PLAN_ROOT/terraform" validate
terraform -chdir="$S10_PLAN_ROOT/terraform" test
terraform -chdir="$S10_PLAN_ROOT/terraform" plan \
  -refresh=false -out=reviewed.tfplan
terraform -chdir="$S10_PLAN_ROOT/terraform" show -json reviewed.tfplan \
  > "$S10_PLAN_ROOT/terraform-plan.json"
```

[ Expected output ]

```text
Success! The configuration is valid.
Success! 1 passed, 0 failed.
Plan: 1 to add, 0 to change, 0 to destroy.
```

Run OpenTofu against the same reviewed source.

```bash
tofu -chdir="$S10_PLAN_ROOT/opentofu" fmt -check
tofu -chdir="$S10_PLAN_ROOT/opentofu" init -backend=false
tofu -chdir="$S10_PLAN_ROOT/opentofu" validate
tofu -chdir="$S10_PLAN_ROOT/opentofu" test
tofu -chdir="$S10_PLAN_ROOT/opentofu" plan \
  -refresh=false -out=reviewed.tfplan
tofu -chdir="$S10_PLAN_ROOT/opentofu" show -json reviewed.tfplan \
  > "$S10_PLAN_ROOT/opentofu-plan.json"
```

[ Expected output ]

```text
Success! The configuration is valid.
Success! 1 passed, 0 failed.
Plan: 1 to add, 0 to change, 0 to destroy.
```

Compare the resource actions and the delivery decision.

```bash
jq -r '.resource_changes[] | [.address, (.change.actions | join(","))] | @tsv' \
  "$S10_PLAN_ROOT/terraform-plan.json" \
  "$S10_PLAN_ROOT/opentofu-plan.json"

jq '{reviewer:.identities.reviewer,apply_permitted}' \
  section-10/starter/delivery-decision.json
```

[ Expected output ]

```text
terraform_data.reviewed_delivery    create
terraform_data.reviewed_delivery    create
{
  "reviewer": "human-platform-reviewer",
  "apply_permitted": false
}
```

Both engines agree on the canonical `create` action. This is plan evidence,
not apply permission and not deployment evidence.

## PART II - Start the Local GitOps Runtime

### Check tools and local capacity

This profile requires Kind 0.32.0 or newer for the pinned Kubernetes 1.36
node. Older Kind releases cannot read this node's containerd configuration.

```bash
docker info --format 'docker_arch={{.Architecture}} memory_bytes={{.MemTotal}} cpus={{.NCPU}}'
df -h .
kind version
kubectl version --client
helm version --short
terraform version
tofu version
node --version
```

[ sample output ]

```text
docker_arch=aarch64 memory_bytes=8315465728 cpus=5
kind v0.32.0 go1.25.7 darwin/arm64
Client Version: v1.36.2
v4.2.1+gd591a19
Terraform v1.14.8
OpenTofu v1.12.6
v22.22.2
```

Stop and update Kind if its version is below 0.32.0. A Kubernetes client one
minor version from 1.36 is suitable for this local lab.

### Check the exact runtime names

The lab owns only the names below. The first command should report no Kind
clusters. The second should print no container names.

```bash
kind get clusters
docker ps -a \
  --filter 'name=agentic-iac-s10' \
  --format '{{.Names}}'
```

[ Expected output ]

```text
No kind clusters found.
```

If either command shows a named Section 10 resource, clean up that earlier run
before continuing.

### Build the two workload images

Both revisions use the Section 9 mock application. Distinct course labels make
their local image identities visible.

```bash
docker build \
  --label com.schoolofdevops.course=agentic-iac-s10 \
  --label com.schoolofdevops.release=s10-v1 \
  --tag 309-agentic-iac/inference-platform:s10-v1 \
  section-9/app

docker build \
  --label com.schoolofdevops.course=agentic-iac-s10 \
  --label com.schoolofdevops.release=s10-v2 \
  --tag 309-agentic-iac/inference-platform:s10-v2 \
  section-9/app

docker image inspect \
  309-agentic-iac/inference-platform:s10-v1 \
  309-agentic-iac/inference-platform:s10-v2 \
  --format '{{.Id}} {{index .Config.Labels "com.schoolofdevops.release"}}'
```

[ sample output ]

```text
sha256:3e2a... s10-v1
sha256:69c8... s10-v2
```

### Pull the frozen runtime images

Kind must load a single-platform image into the node. Build a local transport
tag for Redis and Argo CD after pulling their frozen source references.

```bash
S10_PLATFORM="linux/$(docker version --format '{{.Server.Arch}}')"
printf 'container_platform=%s\n' "$S10_PLATFORM"

helm repo add argo https://argoproj.github.io/argo-helm --force-update
helm repo update argo

docker pull --platform "$S10_PLATFORM" \
  ecr-public.aws.com/docker/library/redis:8.6.4-alpine
docker pull --platform "$S10_PLATFORM" \
  quay.io/argoproj/argocd:v3.5.1
docker pull --platform "$S10_PLATFORM" \
  bitnami/git@sha256:972d6f1ac0e2b62f689794c56620f75d18f22be8f1069554a7622622e5bed548

printf 'FROM %s\n' \
  ecr-public.aws.com/docker/library/redis:8.6.4-alpine | \
  docker build --provenance=false --platform "$S10_PLATFORM" \
  --tag agentic-iac-s10/redis-transport:8.6.4-alpine -

docker tag agentic-iac-s10/redis-transport:8.6.4-alpine \
  ecr-public.aws.com/docker/library/redis:8.6.4-alpine

printf 'FROM %s\n' quay.io/argoproj/argocd:v3.5.1 | \
  docker build --provenance=false --platform "$S10_PLATFORM" \
  --tag agentic-iac-s10/argocd-transport:v3.5.1 -

docker tag agentic-iac-s10/argocd-transport:v3.5.1 \
  quay.io/argoproj/argocd:v3.5.1
```

[ sample output ]

```text
container_platform=linux/arm64
Status: Downloaded newer image for quay.io/argoproj/argocd:v3.5.1
```

The transport builds change no application content. They give Kind one local
platform manifest instead of a multi-platform index.

### Create the pinned Kind cluster

Create the named cluster, then load the four images used by Kubernetes.

```bash
kind create cluster \
  --name agentic-iac-s10 \
  --image kindest/node@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5 \
  --config section-10/tools/kind/cluster.yaml \
  --wait 180s

kind load docker-image \
  309-agentic-iac/inference-platform:s10-v1 \
  --name agentic-iac-s10
kind load docker-image \
  309-agentic-iac/inference-platform:s10-v2 \
  --name agentic-iac-s10
kind load docker-image \
  ecr-public.aws.com/docker/library/redis:8.6.4-alpine \
  --name agentic-iac-s10
kind load docker-image \
  quay.io/argoproj/argocd:v3.5.1 \
  --name agentic-iac-s10

docker exec agentic-iac-s10-control-plane crictl images
```

[ sample output ]

```text
IMAGE                                                   TAG             IMAGE ID
docker.io/309-agentic-iac/inference-platform            s10-v1          ...
docker.io/309-agentic-iac/inference-platform            s10-v2          ...
ecr-public.aws.com/docker/library/redis                  8.6.4-alpine    ...
quay.io/argoproj/argocd                                  v3.5.1          ...
```

Check that the output includes both workload tags, Redis 8.6.4, and Argo CD
3.5.1 before installing the chart.

### Install Argo CD

The frozen values disable Dex and automatic delivery. Helm installs only the
controller used by this lab.

```bash
helm upgrade --install argocd argo/argo-cd \
  --version 10.4.0 \
  --kube-context kind-agentic-iac-s10 \
  --namespace argocd \
  --create-namespace \
  --values section-10/argocd/values.yaml \
  --wait=legacy \
  --timeout 8m

kubectl --context kind-agentic-iac-s10 \
  -n argocd get pods
```

[ sample output ]

```text
NAME                                                READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                     1/1     Running   0          48s
argocd-applicationset-controller-...                1/1     Running   0          48s
argocd-redis-...                                    1/1     Running   0          48s
argocd-repo-server-...                              1/1     Running   0          48s
argocd-server-...                                   1/1     Running   0          48s
```

### Create the workload boundary

Create the destination namespace and an external Kubernetes Secret. The chart
references this Secret; it does not store the value in Git.

```bash
kubectl --context kind-agentic-iac-s10 \
  create namespace inference

openssl rand -hex 16 | \
  kubectl --context kind-agentic-iac-s10 \
  -n inference create secret generic inference-platform-backend-token \
  --from-file=token=/dev/stdin

kubectl --context kind-agentic-iac-s10 \
  -n inference create configmap agentic-iac-s10-lifecycle-owner \
  --from-literal=cluster=agentic-iac-s10 \
  --from-literal=application=inference-platform

kubectl --context kind-agentic-iac-s10 \
  -n inference get secret inference-platform-backend-token \
  -o custom-columns='NAME:.metadata.name,TYPE:.type'
```

[ Expected output ]

```text
NAME                                 TYPE
inference-platform-backend-token     Opaque
```

## PART III - Publish and Sync the Reviewed Revision

### Start the read-only v1 mirror

The mirror publishes one clean commit to the Kind network. It disables Git
receive-pack, uses a read-only root filesystem, and mounts the repository
read-only.

```bash
node section-10/scripts/prepare-git-mirror.mjs \
  --source "$PWD" \
  --revision "$S10_V1_REVISION" \
  --root "$S10_MIRROR_ROOT"

node section-10/scripts/start-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"

docker inspect agentic-iac-s10-git \
  --format 'rootfs_readonly={{.HostConfig.ReadonlyRootfs}} mount_rw={{(index .Mounts 0).RW}} command={{json .Config.Cmd}}'
```

[ sample output ]

```text
rootfs_readonly=true mount_rw=false command=["-c","safe.directory=/git/delivery.git",...,"--disable=receive-pack",...]
```

This is anonymous local course transport. It demonstrates immutable delivery
content, not production Git authentication.

### Create the Application

Apply the reviewed Application object. This creates controller intent, but it
does not sync the workload because the `automated` block is absent.

```bash
kubectl --context kind-agentic-iac-s10 \
  apply -f section-10/argocd/application.yaml

S10_WORKLOAD_NAMESPACE="$(kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o jsonpath='{.spec.destination.namespace}')"

printf 'workload_namespace=%s\n' "$S10_WORKLOAD_NAMESPACE"

kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o jsonpath='{.spec.syncPolicy}'
printf '\n'
```

[ Expected output ]

```text
workload_namespace=inference
{"syncOptions":["CreateNamespace=false"]}
```

### Request the v1 sync

Build the operation as readable JSON. The human command names the exact
reviewed revision and keeps prune disabled.

```bash
S10_SYNC_PATCH="$(jq -cn --arg revision "$S10_V1_REVISION" '{
  operation: {
    initiatedBy: {username: "human-platform-reviewer"},
    sync: {
      revision: $revision,
      prune: false,
      syncOptions: ["CreateNamespace=false"]
    }
  }
}')"

echo "$S10_SYNC_PATCH" | jq

kubectl --context kind-agentic-iac-s10 \
  -n argocd annotate application inference-platform \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl --context kind-agentic-iac-s10 \
  -n argocd patch application inference-platform \
  --type=merge \
  --patch "$S10_SYNC_PATCH"
```

[ sample output ]

```text
application.argoproj.io/inference-platform annotated
application.argoproj.io/inference-platform patched
```

Wait for each independent signal. An operation result alone is not enough.

```bash
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.revision}'="$S10_V1_REVISION" \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.status}'=Synced \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.health.status}'=Healthy \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.operationState.phase}'=Succeeded \
  application/inference-platform --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-dependencies --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-api --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-worker --timeout=180s
```

[ Expected output ]

```text
application.argoproj.io/inference-platform condition met
deployment "inference-platform-dependencies" successfully rolled out
deployment "inference-platform-api" successfully rolled out
deployment "inference-platform-worker" successfully rolled out
```

Observe the revision and workload image.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='TARGET:.spec.source.targetRevision,SYNC:.status.sync.status,HEALTH:.status.health.status,PHASE:.status.operationState.phase,REVISION:.status.sync.revision'

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" get deployment \
  -o custom-columns='NAME:.metadata.name,DESIRED:.spec.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'
```

[ sample output ]

```text
TARGET   SYNC     HEALTH    PHASE       REVISION
HEAD     Synced   Healthy   Succeeded   a0bb233ede26e14349ab8d7e97db2dd4415006f9

NAME                              DESIRED   READY   IMAGE
inference-platform-api            1         1       309-agentic-iac/inference-platform:s10-v1
inference-platform-dependencies   1         1       309-agentic-iac/inference-platform:s10-v1
inference-platform-worker         1         1       309-agentic-iac/inference-platform:s10-v1
```

## PART IV - Promote v2 with Human Approval

### Create the v2 commit

Change only the reviewed image tag. Examine the diff before the human commit.

```bash
perl -0pi -e 's/tag: s10-v1/tag: s10-v2/' \
  section-10/starter/gitops/chart/values.yaml

git diff -- section-10/starter/gitops/chart/values.yaml
git diff --check
git add section-10/starter/gitops/chart/values.yaml
git diff --cached --check
git commit -m 'Promote inference platform to s10-v2'

S10_V2_REVISION="$(git rev-parse HEAD)"
printf 'v2_revision=%s\n' "$S10_V2_REVISION"
```

[ sample output ]

```text
[section10-gitops bd7ef2a] Promote inference platform to s10-v2
 1 file changed, 1 insertion(+), 1 deletion(-)
v2_revision=bd7ef2a026ef20cba82f95bca56487721277487d
```

### Approve the exact v2 commit

The gate opener checks the clean Git lineage and direct Application evidence.
It does not trust a learner-supplied health flag.

```bash
S10_V2_APPROVAL="$S10_APPROVAL_ROOT/v2.json"

node section-10/scripts/open-gitops-approval-gate.mjs \
  --source "$PWD" \
  --revision "$S10_V2_REVISION" \
  --approval "$S10_V2_APPROVAL" \
  --purpose promote-v2

jq . "$S10_V2_APPROVAL.gate.json"
```

[ sample output ]

```text
Approval gate opened for bd7ef2a026ef20cba82f95bca56487721277487d (promote-v2).
Gate: /private/tmp/agentic-iac-s10-human.A1b2C3/approvals/v2.json.gate.json
```

Check that the gate binds the candidate commit to a `Synced`, `Healthy`, and
`Succeeded` v1 Application. Then run the separate human approval command.

```bash
node section-10/scripts/approve-gitops-revision.mjs \
  --gate "$S10_V2_APPROVAL.gate.json" \
  --output "$S10_V2_APPROVAL" \
  --revision "$S10_V2_REVISION" \
  --purpose promote-v2

jq . "$S10_V2_APPROVAL"
```

[ sample output ]

```text
Approved revision bd7ef2a026ef20cba82f95bca56487721277487d for promote-v2.
```

The local approval record binds one purpose and one commit. It does not prove
an external identity provider or production code-review system.

### Publish the approved v2 commit

Stop the v1 mirror before preparing the same exact mirror name at v2. The
helpers validate ownership before removing or creating the container.

```bash
node section-10/scripts/stop-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"

node section-10/scripts/prepare-git-mirror.mjs \
  --source "$PWD" \
  --revision "$S10_V2_REVISION" \
  --root "$S10_MIRROR_ROOT"

node section-10/scripts/start-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"
```

[ sample output ]

The stop command reports `container_removed` and `mirror_removed` as `true`.
The start command reports a ready mirror at `S10_V2_REVISION`.

### Explicitly sync v2

Ask Argo CD to refresh its cached Git clone first. Wait until Application
status resolves the exact v2 revision before requesting a sync.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd annotate application inference-platform \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.revision}'="$S10_V2_REVISION" \
  application/inference-platform --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='SYNC:.status.sync.status,REVISION:.status.sync.revision'

S10_SYNC_PATCH="$(jq -cn --arg revision "$S10_V2_REVISION" '{
  operation: {
    initiatedBy: {username: "human-platform-reviewer"},
    sync: {
      revision: $revision,
      prune: false,
      syncOptions: ["CreateNamespace=false"]
    }
  }
}')"

echo "$S10_SYNC_PATCH" | jq

kubectl --context kind-agentic-iac-s10 \
  -n argocd patch application inference-platform \
  --type=merge \
  --patch "$S10_SYNC_PATCH"
```

[ sample output ]

```text
application.argoproj.io/inference-platform annotated
application.argoproj.io/inference-platform condition met
SYNC        REVISION
OutOfSync   bd7ef2a026ef20cba82f95bca56487721277487d
application.argoproj.io/inference-platform patched
```

Wait for the v2 revision and all three rollouts.

```bash
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.status}'=Synced \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.health.status}'=Healthy \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.operationState.phase}'=Succeeded \
  application/inference-platform --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-dependencies --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-api --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-worker --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='SYNC:.status.sync.status,HEALTH:.status.health.status,PHASE:.status.operationState.phase,REVISION:.status.sync.revision'

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" get deployment \
  -o custom-columns='NAME:.metadata.name,DESIRED:.spec.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'
```

[ sample output ]

The three wait commands report `condition met`. The three rollouts report
`successfully rolled out`. The Application revision equals `S10_V2_REVISION`,
and all three Deployment templates use `s10-v2`.

The Application revision must equal `S10_V2_REVISION`. Every Deployment
template should use `s10-v2`.

### Send a deterministic request

Port-forward the API service to a local port. Save the process ID so the human
cleanup can stop only this process.

```bash
S10_PORT_FORWARD_LOG="$S10_TEMP_ROOT/port-forward.log"

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" \
  port-forward service/inference-platform-api 18081:8080 \
  > "$S10_PORT_FORWARD_LOG" 2>&1 &

S10_PORT_FORWARD_PID=$!
sleep 2
printf 'port_forward_pid=%s\n' "$S10_PORT_FORWARD_PID"
cat "$S10_PORT_FORWARD_LOG"
```

[ sample output ]

```text
port_forward_pid=32921
Forwarding from 127.0.0.1:18081 -> 8080
```

Submit one job, save its returned ID, and read the completed result.

```bash
S10_SUBMIT_RESPONSE="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"input":"gitops delivery"}' \
  http://127.0.0.1:18081/jobs)"

echo "$S10_SUBMIT_RESPONSE" | jq
S10_JOB_ID="$(echo "$S10_SUBMIT_RESPONSE" | jq -r '.job_id')"
printf 'job_id=%s\n' "$S10_JOB_ID"
sleep 1
curl -fsS "http://127.0.0.1:18081/jobs/$S10_JOB_ID" | jq
```

[ Expected output ]

```json
{
  "job_id": "job-0001",
  "status": "complete",
  "result": "MOCK INFERENCE: GITOPS DELIVERY"
}
```

The submit response first reports `queued`. The final response is the stable
request result shown above.

## PART V - Observe Drift without Self-Heal

### Create safe replica drift

Scale only the API Deployment. This changes a local replica count and does not
call a cloud service.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" \
  scale deployment inference-platform-api --replicas=2

kubectl --context kind-agentic-iac-s10 \
  -n argocd annotate application inference-platform \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.status}'=OutOfSync \
  application/inference-platform --timeout=120s

sleep 15
```

[ Expected output ]

```text
deployment.apps/inference-platform-api scaled
application.argoproj.io/inference-platform condition met
```

Check the Application and replica count after the observation period.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='SYNC:.status.sync.status,HEALTH:.status.health.status,AUTOMATED:.spec.syncPolicy.automated,REVISION:.status.sync.revision'

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" get deployment inference-platform-api \
  -o custom-columns='DESIRED:.spec.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'
```

[ sample output ]

```text
SYNC        HEALTH    AUTOMATED   REVISION
OutOfSync   Healthy   <none>      bd7ef2a026ef20cba82f95bca56487721277487d

DESIRED   READY   IMAGE
2         2       309-agentic-iac/inference-platform:s10-v2
```

The two replicas remain after 15 seconds. Argo CD detects drift, but it does
not repair the Deployment without a human sync.

## PART VI - Diagnose and Recover

### Create the Git revert

Revert the exact v2 commit. Do not rewrite history or patch the live workload
back to v1.

```bash
git revert --no-edit "$S10_V2_REVISION"
S10_REVERT_REVISION="$(git rev-parse HEAD)"

git log --oneline -3
git diff-tree --stat "$S10_V2_REVISION" "$S10_REVERT_REVISION"

printf 'v1_tree=%s\nrecovery_tree=%s\n' \
  "$(git rev-parse "$S10_V1_REVISION^{tree}")" \
  "$(git rev-parse "$S10_REVERT_REVISION^{tree}")"
```

[ sample output ]

```text
06aae8f Revert "Promote inference platform to s10-v2"
bd7ef2a Promote inference platform to s10-v2
a0bb233 Repair Section 10 delivery boundaries
v1_tree=49a167c3aa1db4a704075089237c0090ad90f145
recovery_tree=49a167c3aa1db4a704075089237c0090ad90f145
```

The two tree IDs must match. The revert is a new commit whose content returns
to the reviewed v1 state.

### Complete the diagnostics challenge

The recovery commit now exists only in local Git. Follow the separate live
challenge before publishing it.

```bash
sed -n '1,320p' section-10/challenge/task.md
```

[ sample output ]

The live diagnostics task and its five evidence questions are printed.

Run every command in that file. Write the five-part diagnosis before reading
`section-10/challenge/answer-key.md`.

### Approve the recovery commit

The recovery gate derives the exact revert lineage from Git. It also rechecks
that the two-replica drift remains `OutOfSync` for 15 seconds.

```bash
S10_RECOVERY_APPROVAL="$S10_APPROVAL_ROOT/recovery.json"

node section-10/scripts/open-gitops-approval-gate.mjs \
  --source "$PWD" \
  --revision "$S10_REVERT_REVISION" \
  --approval "$S10_RECOVERY_APPROVAL" \
  --purpose revert-and-recover

jq . "$S10_RECOVERY_APPROVAL.gate.json"
```

[ sample output ]

```text
Approval gate opened for 06aae8fb5edfebd1ff0637648ccc762de74553f5 (revert-and-recover).
Gate: /private/tmp/agentic-iac-s10-human.A1b2C3/approvals/recovery.json.gate.json
```

Check the revision, purpose, `OutOfSync` status, and two replicas. Then approve
that exact recovery commit.

```bash
node section-10/scripts/approve-gitops-revision.mjs \
  --gate "$S10_RECOVERY_APPROVAL.gate.json" \
  --output "$S10_RECOVERY_APPROVAL" \
  --revision "$S10_REVERT_REVISION" \
  --purpose revert-and-recover

jq . "$S10_RECOVERY_APPROVAL"
```

[ sample output ]

```text
Approved revision 06aae8fb5edfebd1ff0637648ccc762de74553f5 for revert-and-recover.
```

### Publish and sync the recovery

Replace the v2 mirror with the approved recovery commit.

```bash
node section-10/scripts/stop-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"

node section-10/scripts/prepare-git-mirror.mjs \
  --source "$PWD" \
  --revision "$S10_REVERT_REVISION" \
  --root "$S10_MIRROR_ROOT"

node section-10/scripts/start-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"
```

[ sample output ]

The start command reports a ready mirror at `S10_REVERT_REVISION`.

Refresh the cached Git clone and wait until Application status resolves the
exact recovery revision. Then build the explicit recovery operation.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd annotate application inference-platform \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.revision}'="$S10_REVERT_REVISION" \
  application/inference-platform --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='SYNC:.status.sync.status,REVISION:.status.sync.revision'

S10_SYNC_PATCH="$(jq -cn --arg revision "$S10_REVERT_REVISION" '{
  operation: {
    initiatedBy: {username: "human-platform-reviewer"},
    sync: {
      revision: $revision,
      prune: false,
      syncOptions: ["CreateNamespace=false"]
    }
  }
}')"

echo "$S10_SYNC_PATCH" | jq

kubectl --context kind-agentic-iac-s10 \
  -n argocd patch application inference-platform \
  --type=merge \
  --patch "$S10_SYNC_PATCH"
```

[ sample output ]

```text
application.argoproj.io/inference-platform annotated
application.argoproj.io/inference-platform condition met
SYNC        REVISION
OutOfSync   06aae8fb5edfebd1ff0637648ccc762de74553f5
application.argoproj.io/inference-platform patched
```

Wait for Git, Application, operation, and workload evidence to agree.

```bash
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.sync.status}'=Synced \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.health.status}'=Healthy \
  application/inference-platform --timeout=180s
kubectl --context kind-agentic-iac-s10 -n argocd wait \
  --for=jsonpath='{.status.operationState.phase}'=Succeeded \
  application/inference-platform --timeout=180s

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-dependencies --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-api --timeout=180s
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" rollout status \
  deployment/inference-platform-worker --timeout=180s
```

[ Expected output ]

```text
application.argoproj.io/inference-platform condition met
deployment "inference-platform-dependencies" successfully rolled out
deployment "inference-platform-api" successfully rolled out
deployment "inference-platform-worker" successfully rolled out
```

Observe the recovered revision, replica count, and v1 image.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='TARGET:.spec.source.targetRevision,SYNC:.status.sync.status,HEALTH:.status.health.status,PHASE:.status.operationState.phase,REVISION:.status.sync.revision'

kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" get deployment \
  -o custom-columns='NAME:.metadata.name,DESIRED:.spec.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'
```

[ sample output ]

```text
TARGET   SYNC     HEALTH    PHASE       REVISION
HEAD     Synced   Healthy   Succeeded   06aae8fb5edfebd1ff0637648ccc762de74553f5

NAME                              DESIRED   READY   IMAGE
inference-platform-api            1         1       309-agentic-iac/inference-platform:s10-v1
inference-platform-dependencies   1         1       309-agentic-iac/inference-platform:s10-v1
inference-platform-worker         1         1       309-agentic-iac/inference-platform:s10-v1
```

## PART VII - Save the Checkpoint and Clean Up

### Save a readable learner checkpoint

Keep a short Markdown record in the learner repository. It survives runtime
cleanup and remains untracked until you decide where to store it.

```bash
S10_CHECKPOINT="$PWD/section-10-checkpoint.md"

printf '# Section 10 GitOps checkpoint\n\n' | tee "$S10_CHECKPOINT"
printf 'v1: `%s`\nv2: `%s`\nrecovery: `%s`\n\n' \
  "$S10_V1_REVISION" "$S10_V2_REVISION" "$S10_REVERT_REVISION" | \
  tee -a "$S10_CHECKPOINT"

git log --oneline -3 | tee -a "$S10_CHECKPOINT"

kubectl --context kind-agentic-iac-s10 \
  -n argocd get application inference-platform \
  -o custom-columns='SYNC:.status.sync.status,HEALTH:.status.health.status,REVISION:.status.sync.revision' | \
  tee -a "$S10_CHECKPOINT"

cat "$S10_CHECKPOINT"
```

[ sample output ]

The file contains the three revisions, the three-commit log, and the recovered
Application status.

### Verify ownership before cleanup

Read the marker created by this lab and the exact Kind node identity. Stop if
either name belongs to a different run.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n "$S10_WORKLOAD_NAMESPACE" \
  get configmap agentic-iac-s10-lifecycle-owner -o yaml

docker inspect agentic-iac-s10-control-plane \
  --format 'name={{.Name}} cluster={{index .Config.Labels "io.x-k8s.kind.cluster"}} role={{index .Config.Labels "io.x-k8s.kind.role"}} image={{.Config.Image}}'
```

[ sample output ]

```text
name=/agentic-iac-s10-control-plane cluster=agentic-iac-s10 role=control-plane image=kindest/node@sha256:3489c7...
```

The ConfigMap must name `agentic-iac-s10` and `inference-platform`. The node
labels must name the same cluster and the `control-plane` role.

### Stop the local request path

Stop only the port-forward process whose PID you saved.

```bash
kill "$S10_PORT_FORWARD_PID"
wait "$S10_PORT_FORWARD_PID" 2>/dev/null || true
```

[ Expected output ]

These process cleanup commands print nothing.

### Remove the Kubernetes and Git resources

These are direct human cleanup commands for the exact names inspected above.

```bash
kubectl --context kind-agentic-iac-s10 \
  -n argocd delete application inference-platform --wait=true

helm --kube-context kind-agentic-iac-s10 \
  -n argocd uninstall argocd --timeout 3m

kubectl --context kind-agentic-iac-s10 \
  delete namespace "$S10_WORKLOAD_NAMESPACE" --wait=true

kubectl --context kind-agentic-iac-s10 \
  delete namespace argocd --wait=true

node section-10/scripts/stop-git-mirror.mjs \
  --root "$S10_MIRROR_ROOT"

kind delete cluster --name agentic-iac-s10
```

[ sample output ]

```text
application.argoproj.io "inference-platform" deleted from argocd namespace
release "argocd" uninstalled
namespace "inference" deleted
namespace "argocd" deleted
Deleted nodes: ["agentic-iac-s10-control-plane"]
```

Argo CD keeps three CustomResourceDefinitions during Helm uninstall. Deleting
the named Kind cluster removes them with the local cluster.

### Remove the owned local evidence

The cleanup helper checks the course marker before removing each evaluator
directory. Remove the remaining named files from the unique temporary root.

```bash
node section-10/scripts/cleanup-starter-evidence.mjs \
  "$S10_STARTER_EVIDENCE"
node section-10/scripts/cleanup-starter-evidence.mjs \
  "$S10_REPAIRED_EVIDENCE"

rm "$S10_V2_APPROVAL" \
  "$S10_V2_APPROVAL.gate.json" \
  "$S10_RECOVERY_APPROVAL" \
  "$S10_RECOVERY_APPROVAL.gate.json" \
  "$S10_PORT_FORWARD_LOG"

rm "$S10_PLAN_ROOT/terraform-plan.json" \
  "$S10_PLAN_ROOT/opentofu-plan.json"
rm -r "$S10_PLAN_ROOT/terraform" \
  "$S10_PLAN_ROOT/opentofu"
rmdir "$S10_PLAN_ROOT" "$S10_APPROVAL_ROOT"

git worktree remove "$S10_TRUSTED_ROOT"
rmdir "$S10_TEMP_ROOT"
```

[ sample output ]

The two evidence helpers report `Removed course evidence`. The remaining
file-removal commands print nothing.

### Prove cleanup and keep the checkpoint

Check the exact runtime names. The checkpoint remains as the only expected
untracked learner artifact.

```bash
kind get clusters
docker ps -a \
  --filter 'name=agentic-iac-s10' \
  --format '{{.Names}}'
git status --short
ls -l "$S10_CHECKPOINT"
```

[ sample output ]

```text
No kind clusters found.
?? section-10-checkpoint.md
-rw-r--r--  1 learner  staff  332 Aug 31 18:20 section-10-checkpoint.md
```

## Troubleshooting

### Kind reports an unknown containerd config version

Your Kind CLI is older than the pinned Kubernetes node. Install Kind 0.32.0 or
newer, delete the partial `agentic-iac-s10` cluster, and restart Part II.

### Kind cannot load a Redis or Argo CD digest

Re-run the single-platform transport build for your Docker server architecture.
Then tag the transport image back to the frozen source reference and run the
matching `kind load docker-image` command again.

### Application revision does not change

Check the mirror container's `com.schoolofdevops.source-revision` label. A
local Git commit is not published until the old mirror is stopped and the new
read-only mirror is started.

### Application is healthy but the workload check fails

Read the destination namespace from the Application again. In this lab it is
`inference`, not `inference-platform`. Then check Deployment events and rollout
status before requesting another sync.
