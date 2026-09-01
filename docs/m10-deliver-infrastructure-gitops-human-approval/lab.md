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

## Objectives

By the end of this lab, you will be able to:

- reject a delivery candidate from Git, Terraform, OpenTofu, and Helm evidence;
- repair only the three failed trust decisions and approve the reviewed v1 commit;
- publish immutable Git revisions and request explicit Argo CD sync operations;
- diagnose stale Git, degraded rollout, and persistent drift evidence; and
- recover with `git revert`, human approval, and a second explicit sync.

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

### Confirm your local Git identity

Section 9 normally sets this identity in the same clone. Set it here as well
so Section 10 also works when you enter from an older Section 9 path. Git
records this identity in each commit used as review evidence. You may use your
own name and email instead of the sample values.

```bash
git config --local user.name "Course Learner"
git config --local user.email "learner@example.invalid"
git config --get user.name
git config --get user.email
```

[ sample output ]

```text
Course Learner
learner@example.invalid
```

The `--local` option changes only this learner clone. It does not change your
global Git identity.

If `git status --short` prints nothing, your Section 9 checkpoint is already
saved. Continue to the next heading.

An older copy of the Section 9 lab may leave these exact three repair files
modified:

```text
 M section-9/chart/templates/deployment.yaml
 M section-9/chart/values.schema.json
 M section-9/chart/values.yaml
```

If these are the only paths listed, inspect and save that completed repair now.

```bash
git diff -- \
  section-9/chart/templates/deployment.yaml \
  section-9/chart/values.schema.json \
  section-9/chart/values.yaml

git add \
  section-9/chart/templates/deployment.yaml \
  section-9/chart/values.schema.json \
  section-9/chart/values.yaml

git diff --cached --check
git diff --cached --stat
git commit -m 'Complete Section 9 Helm repair'
git status --short
```

[ sample output ]

```text
[main <commit>] Complete Section 9 Helm repair
 3 files changed, <insertions and deletions>
```

The final status command should print nothing. If the first status lists any
other path, do not include it in this commit and do not hide it with a broad
stash. Preserve or commit that work separately before continuing.

### Create isolated evidence locations

The evaluator must come from the approved base commit, not from the candidate
being reviewed. Save that commit and create a detached trusted worktree. The
marked approval directory gives the gate one exact output boundary. The Helm
variables isolate repository settings from your normal Helm configuration.

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
S10_HELM_ROOT="$S10_TEMP_ROOT/helm"

mkdir -m 700 "$S10_APPROVAL_ROOT"
printf 'agentic-iac-s10-approval-root-v1\n' > \
  "$S10_APPROVAL_ROOT/.agentic-iac-s10-approval-root"
chmod 400 "$S10_APPROVAL_ROOT/.agentic-iac-s10-approval-root"

mkdir -p "$S10_HELM_ROOT/config" \
  "$S10_HELM_ROOT/cache/repository" \
  "$S10_HELM_ROOT/data"
export HELM_CONFIG_HOME="$S10_HELM_ROOT/config"
export HELM_CACHE_HOME="$S10_HELM_ROOT/cache"
export HELM_DATA_HOME="$S10_HELM_ROOT/data"
export HELM_REPOSITORY_CONFIG="$S10_HELM_ROOT/config/repositories.yaml"
export HELM_REPOSITORY_CACHE="$S10_HELM_ROOT/cache/repository"

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

[ sample output ]

```text
REJECTED: 3 primary finding(s); evidence <temporary-path>/starter-evidence
```

The evidence path varies by run.

Read the decision and the independent Terraform, OpenTofu, and Helm evidence.

```bash
jq '{status, findings: [.findings[].id], terraform, helm, apply_permitted}' \
  "$S10_STARTER_EVIDENCE/report.json"
```

[ sample output ]

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

The command shows each finding by its short `id`. The report also includes a
message for each finding.

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
 3 files changed, 1 insertion(+), 5 deletions(-)
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

jq '{status, findings: [.findings[].id], terraform, helm, apply_permitted}' \
  "$S10_REPAIRED_EVIDENCE/report.json"
```

[ sample output ]

```text
READY_FOR_HUMAN_REVIEW: 0 primary finding(s)
```

The evaluator line is followed by the complete selected JSON object. It should
show an empty `findings` list, two valid engines, passing Helm evidence, and
`apply_permitted: false`.

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

[ sample output ]

```text
Success! The configuration is valid.
Success! 1 passed, 0 failed.
Plan: 1 to add, 0 to change, 0 to destroy.
```

This excerpt omits variable `init`, test progress, and provider detail. The
three shown lines are the validation, test summary, and plan summary to check.

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

[ sample output ]

```text
Success! The configuration is valid.
Success! 1 passed, 0 failed.
Plan: 1 to add, 0 to change, 0 to destroy.
```

This excerpt omits variable `init`, test progress, and provider detail. The
three shown lines must agree with Terraform.

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
terraform_data.reviewed_delivery	create
terraform_data.reviewed_delivery	create
{
  "reviewer": "human-platform-reviewer",
  "apply_permitted": false
}
```

Both engines agree on the canonical `create` action. This is plan evidence,
not apply permission and not deployment evidence.

### Approve the reviewed v1 commit

The first published revision also needs a human approval. Confirm the repaired
evidence and both direct plans before running this command. The annotated tag
records the fixed reviewer identity, purpose, and exact v1 commit that the v2
gate will later verify.

```bash
git tag -a section-10-reviewed-v1 \
  -m 'approved_by=human-platform-reviewer purpose=promote-v1' \
  "$S10_V1_REVISION"

printf 'v1_approval_revision=%s\n' \
  "$(git rev-list -n 1 section-10-reviewed-v1)"
git for-each-ref refs/tags/section-10-reviewed-v1 \
  --format='approval_tag=%(refname:short) object_type=%(objecttype)'
git cat-file tag section-10-reviewed-v1 | sed -n '/^$/,$p'
```

[ sample output ]

```text
v1_approval_revision=a0bb233ede26e14349ab8d7e97db2dd4415006f9
approval_tag=section-10-reviewed-v1 object_type=tag

approved_by=human-platform-reviewer purpose=promote-v1
```

Your revision will differ. This local annotated tag is visible approval
evidence for the course gate. It is not an external code-review identity.

## PART II - Start the Local GitOps Runtime

### Check tools and local capacity

The course has directly exercised two local client profiles: Kind 0.27 with
kubectl 1.35, and Kind 0.32 with kubectl 1.36. The Section 10 cluster command
pins its node image separately from these host clients. Nearby versions may
also work, but they are not directly proven by the course evidence.

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

Do not reject a working machine only because its version differs from the
sample. Continue when the required tools are present. Stop only if a printed
command reports a real tool or runtime failure, then troubleshoot that failure
before continuing.

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

### Protect preexisting Docker state

The four course tags must be free before the lab creates them. Stop if this
check prints a tag; cleanup must not overwrite an earlier learner image. Also
record whether the four frozen source images already exist. Setup will not
pull over an existing source reference.

```bash
S10_COURSE_REFS_FILE="$S10_TEMP_ROOT/course-image-refs.txt"
S10_COURSE_IMAGES="$S10_TEMP_ROOT/course-images.tsv"
printf '%s\n' \
  309-agentic-iac/inference-platform:s10-v1 \
  309-agentic-iac/inference-platform:s10-v2 \
  agentic-iac-s10/redis-transport:8.6.4-alpine \
  agentic-iac-s10/argocd-transport:v3.5.1 \
  > "$S10_COURSE_REFS_FILE"

while read -r S10_IMAGE_REF
do
  if docker image inspect "$S10_IMAGE_REF" >/dev/null 2>&1; then
    printf 'STOP: course tag already exists: %s\n' "$S10_IMAGE_REF" >&2
    exit 1
  fi
done < "$S10_COURSE_REFS_FILE"

S10_REDIS_IMAGE_REF='ecr-public.aws.com/docker/library/redis:8.6.4-alpine'
S10_ARGO_IMAGE_REF='quay.io/argoproj/argocd:v3.5.1'
S10_GIT_IMAGE_REF='bitnami/git@sha256:972d6f1ac0e2b62f689794c56620f75d18f22be8f1069554a7622622e5bed548'
S10_NODE_IMAGE_REF='kindest/node@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5'

S10_REDIS_IMAGE_BEFORE="$(docker image inspect --format '{{.Id}}' \
  "$S10_REDIS_IMAGE_REF" 2>/dev/null || printf 'absent')"
S10_ARGO_IMAGE_BEFORE="$(docker image inspect --format '{{.Id}}' \
  "$S10_ARGO_IMAGE_REF" 2>/dev/null || printf 'absent')"
S10_GIT_IMAGE_BEFORE="$(docker image inspect --format '{{.Id}}' \
  "$S10_GIT_IMAGE_REF" 2>/dev/null || printf 'absent')"
S10_NODE_IMAGE_BEFORE="$(docker image inspect --format '{{.Id}}' \
  "$S10_NODE_IMAGE_REF" 2>/dev/null || printf 'absent')"

printf 'course_tags=free redis=%s argocd=%s git=%s node=%s\n' \
  "$S10_REDIS_IMAGE_BEFORE" "$S10_ARGO_IMAGE_BEFORE" \
  "$S10_GIT_IMAGE_BEFORE" "$S10_NODE_IMAGE_BEFORE"
```

[ sample output ]

```text
course_tags=free redis=absent argocd=sha256:71ad... git=absent node=sha256:fa8c...
```

Existing IDs and `absent` values vary. The stable evidence is
`course_tags=free`.

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

if [[ "$S10_REDIS_IMAGE_BEFORE" == "absent" ]]; then
  docker pull --platform "$S10_PLATFORM" "$S10_REDIS_IMAGE_REF"
fi
if [[ "$S10_ARGO_IMAGE_BEFORE" == "absent" ]]; then
  docker pull --platform "$S10_PLATFORM" "$S10_ARGO_IMAGE_REF"
fi
if [[ "$S10_GIT_IMAGE_BEFORE" == "absent" ]]; then
  docker pull --platform "$S10_PLATFORM" "$S10_GIT_IMAGE_REF"
fi

printf 'FROM %s\n' \
  "$S10_REDIS_IMAGE_REF" | \
  docker build --provenance=false --platform "$S10_PLATFORM" \
  --tag agentic-iac-s10/redis-transport:8.6.4-alpine -

printf 'FROM %s\n' "$S10_ARGO_IMAGE_REF" | \
  docker build --provenance=false --platform "$S10_PLATFORM" \
  --tag agentic-iac-s10/argocd-transport:v3.5.1 -
```

[ sample output ]

```text
container_platform=linux/arm64
Status: Downloaded newer image for quay.io/argoproj/argocd:v3.5.1
```

The transport builds change no application content. They give Kind one local
platform manifest instead of a multi-platform index.

Bind cleanup to the four exact course tag IDs. Also save the frozen source IDs
so cleanup can remove only a source image pulled by this run.

```bash
: > "$S10_COURSE_IMAGES"
while read -r S10_IMAGE_REF
do
  S10_CREATED_ID="$(docker image inspect --format '{{.Id}}' "$S10_IMAGE_REF")"
  printf '%s\t%s\n' "$S10_IMAGE_REF" "$S10_CREATED_ID" \
    >> "$S10_COURSE_IMAGES"
  printf 'created ref=%s id=%s\n' "$S10_IMAGE_REF" "$S10_CREATED_ID"
done < "$S10_COURSE_REFS_FILE"

S10_REDIS_IMAGE_CREATED="$(docker image inspect \
  --format '{{.Id}}' "$S10_REDIS_IMAGE_REF")"
S10_ARGO_IMAGE_CREATED="$(docker image inspect \
  --format '{{.Id}}' "$S10_ARGO_IMAGE_REF")"
S10_GIT_IMAGE_CREATED="$(docker image inspect \
  --format '{{.Id}}' "$S10_GIT_IMAGE_REF")"
```

[ sample output ]

```text
created ref=309-agentic-iac/inference-platform:s10-v1 id=sha256:3e2a...
created ref=309-agentic-iac/inference-platform:s10-v2 id=sha256:69c8...
created ref=agentic-iac-s10/redis-transport:8.6.4-alpine id=sha256:ab32...
created ref=agentic-iac-s10/argocd-transport:v3.5.1 id=sha256:71ad...
```

The four printed bindings are the tags owned by this run.

### Create the pinned Kind cluster

Create the named cluster, then load the four images used by Kubernetes.

```bash
kind create cluster \
  --name agentic-iac-s10 \
  --image kindest/node@sha256:3489c7674813ba5d8b1a9977baea8a6e553784dab7b84759d1014dbd78f7ebd5 \
  --config section-10/tools/kind/cluster.yaml \
  --wait 180s
```

[ sample output ]

```text
Set kubectl context to "kind-agentic-iac-s10"
```

Kind 0.27 can create this pinned node, but its built-in image loader cannot
read the node's newer containerd configuration. The course helper supports
Kind 0.27 and Kind 0.32. It checks the exact node and local images, then
transfers the four image archives directly into the disposable node.
The transfer uses privileged containerd access only inside that local node. It
does not give the workload privileged access.

```bash
node section-10/scripts/load-kind-images.mjs \
  --cluster agentic-iac-s10 \
  309-agentic-iac/inference-platform:s10-v1 \
  309-agentic-iac/inference-platform:s10-v2 \
  agentic-iac-s10/redis-transport:8.6.4-alpine \
  agentic-iac-s10/argocd-transport:v3.5.1
```

[ sample output ]

```text
Loaded 309-agentic-iac/inference-platform:s10-v1 into agentic-iac-s10-control-plane
Loaded 309-agentic-iac/inference-platform:s10-v2 into agentic-iac-s10-control-plane
Loaded agentic-iac-s10/redis-transport:8.6.4-alpine into agentic-iac-s10-control-plane
Loaded agentic-iac-s10/argocd-transport:v3.5.1 into agentic-iac-s10-control-plane
```

Now read the node's image list.

```bash
docker exec agentic-iac-s10-control-plane crictl images
```

[ sample output ]

```text
IMAGE                                                   TAG             IMAGE ID
docker.io/309-agentic-iac/inference-platform            s10-v1          ...
docker.io/309-agentic-iac/inference-platform            s10-v2          ...
docker.io/agentic-iac-s10/redis-transport                8.6.4-alpine    ...
docker.io/agentic-iac-s10/argocd-transport               v3.5.1          ...
```

Check that the output includes both workload tags, Redis 8.6.4, and Argo CD
3.5.1 before installing the chart.

Kind may pull the frozen node image during cluster creation. Save its exact ID
so cleanup can remove it only when it was absent before this run.

```bash
S10_NODE_IMAGE_CREATED="$(docker image inspect \
  --format '{{.Id}}' "$S10_NODE_IMAGE_REF")"
printf 'created ref=%s id=%s\n' \
  "$S10_NODE_IMAGE_REF" "$S10_NODE_IMAGE_CREATED"
```

[ sample output ]

```text
created ref=kindest/node@sha256:3489c... id=sha256:fa8c...
```

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
  --set global.image.repository=agentic-iac-s10/argocd-transport \
  --set global.image.tag=v3.5.1 \
  --set redis.image.repository=agentic-iac-s10/redis-transport \
  --set redis.image.tag=8.6.4-alpine \
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

[ sample output ]

```text
NAME                                 TYPE
inference-platform-backend-token     Opaque
```

The namespace, Secret, and ConfigMap creation lines appear before this table.

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

[ sample output ]

```text
application.argoproj.io/inference-platform created
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

[ sample output ]

```text
application.argoproj.io/inference-platform condition met
deployment "inference-platform-dependencies" successfully rolled out
deployment "inference-platform-api" successfully rolled out
deployment "inference-platform-worker" successfully rolled out
```

Each of the four Application waits prints the same `condition met` line. The
sample shows one of those four lines and all three rollout results.

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
It does not trust a learner-supplied health flag. The opener stays alive and
keeps the exact gate binding in memory while you inspect its evidence. Only
that live process writes the approval record after it receives your explicit
approval input and rechecks the original gate. There is no handoff file or
background approval service.

Run the opener directly. It prints the gate JSON before asking for approval.
At the `Approval>` line, type the exact text shown after `type exactly:` and
press Enter. For the sample revision above, the text would be:

```text
approve bd7ef2a026ef20cba82f95bca56487721277487d
```

Use your full `v2_revision`, not this sample value. The command remains alive
from evidence validation through approval publication.

```bash
S10_V2_APPROVAL="$S10_APPROVAL_ROOT/v2.json"

node section-10/scripts/open-gitops-approval-gate.mjs \
  --source "$PWD" \
  --revision "$S10_V2_REVISION" \
  --approval "$S10_V2_APPROVAL" \
  --purpose promote-v2

jq . "$S10_V2_APPROVAL"
```

[ sample output ]

```text
Approval gate opened for bd7ef2a026ef20cba82f95bca56487721277487d (promote-v2).
Gate: /private/tmp/agentic-iac-s10-human.A1b2C3/approvals/v2.json.gate.json
{
  "schema": "agentic-iac-s10-approval-gate/v1",
  "purpose": "promote-v2",
  "revision": "bd7ef2a026ef20cba82f95bca56487721277487d",
  "opened_at": "2026-08-31T16:13:08.277Z",
  "observed": {
    "sync": "Synced",
    "health": "Healthy",
    "operation": "Succeeded",
    "revision": "a0bb233ede26e14349ab8d7e97db2dd4415006f9"
  }
}
Approval> type exactly: approve bd7ef2a026ef20cba82f95bca56487721277487d
Approved revision bd7ef2a026ef20cba82f95bca56487721277487d for promote-v2.
{
  "schema": "agentic-iac-s10-human-approval/v1",
  "approved_by": "human-platform-reviewer",
  "requested_by": "agent-author",
  "revision": "bd7ef2a026ef20cba82f95bca56487721277487d",
  "purpose": "promote-v2",
  "approved": true
}
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

The lab replaces the complete bare repository while keeping the same local
URL. Argo CD can still hold object cache from the previous fixture. Restart
only the repo-server so it opens the replacement repository without that
cache. This cache reset is specific to the local lab fixture. Production Git
repositories keep one stable repository identity and advance its refs; they
do not normally require a repo-server restart for every approved commit.

```bash
kubectl --context kind-agentic-iac-s10 -n argocd rollout restart deployment/argocd-repo-server
kubectl --context kind-agentic-iac-s10 -n argocd rollout status deployment/argocd-repo-server --timeout=120s
```

[ sample output ]

```text
deployment.apps/argocd-repo-server restarted
deployment "argocd-repo-server" successfully rolled out
```

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

[ sample output ]

```text
{
  "job_id": "job-0001",
  "status": "queued"
}
job_id=job-0001
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

[ sample output ]

```text
deployment.apps/inference-platform-api scaled
application.argoproj.io/inference-platform annotated
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

First, read the two revision identities that the revert depends on.

```bash
printf 'v1_revision=%s\nv2_revision=%s\n' \
  "$S10_V1_REVISION" "$S10_V2_REVISION"

git show --no-patch --oneline "$S10_V1_REVISION"
git show --no-patch --oneline "$S10_V2_REVISION"
```

[ sample output ]

```text
v1_revision=a0bb233ede26e14349ab8d7e97db2dd4415006f9
v2_revision=bd7ef2a026ef20cba82f95bca56487721277487d
a0bb233 Repair Section 10 delivery boundaries
bd7ef2a Promote inference platform to s10-v2
```

The two full revision values must be present and different. The second commit
must be the named `Promote inference platform to s10-v2` change. If either
revision is missing, both values are the same, or the v2 subject is different,
stop here and return to the v1 and v2 commit steps.

Now revert the exact v2 commit. Do not rewrite history or patch the live
workload back to v1.

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
that the two-replica drift remains `OutOfSync` for 15 seconds. This foreground
opener also retains its in-memory binding through publication.

At the `Approval>` line, type the exact text shown after `type exactly:` and
press Enter. For the sample recovery revision, the text would be:

```text
approve 06aae8fb5edfebd1ff0637648ccc762de74553f5
```

Use your full `revert_revision`, not this sample value.

```bash
S10_RECOVERY_APPROVAL="$S10_APPROVAL_ROOT/recovery.json"

node section-10/scripts/open-gitops-approval-gate.mjs \
  --source "$PWD" \
  --revision "$S10_REVERT_REVISION" \
  --approval "$S10_RECOVERY_APPROVAL" \
  --purpose revert-and-recover

jq . "$S10_RECOVERY_APPROVAL"
```

[ sample output ]

```text
Approval gate opened for 06aae8fb5edfebd1ff0637648ccc762de74553f5 (revert-and-recover).
Gate: /private/tmp/agentic-iac-s10-human.A1b2C3/approvals/recovery.json.gate.json
{
  "schema": "agentic-iac-s10-approval-gate/v1",
  "purpose": "revert-and-recover",
  "revision": "06aae8fb5edfebd1ff0637648ccc762de74553f5",
  "opened_at": "2026-08-31T16:14:35.072Z",
  "observed": {
    "sync": "OutOfSync",
    "replicas_after_15_seconds": 2
  }
}
Approval> type exactly: approve 06aae8fb5edfebd1ff0637648ccc762de74553f5
Approved revision 06aae8fb5edfebd1ff0637648ccc762de74553f5 for revert-and-recover.
{
  "schema": "agentic-iac-s10-human-approval/v1",
  "approved_by": "human-platform-reviewer",
  "requested_by": "agent-author",
  "revision": "06aae8fb5edfebd1ff0637648ccc762de74553f5",
  "purpose": "revert-and-recover",
  "approved": true
}
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

This second whole-fixture replacement has the same local cache boundary.
Reset only the repo-server again before asking the Application to refresh.

```bash
kubectl --context kind-agentic-iac-s10 -n argocd rollout restart deployment/argocd-repo-server
kubectl --context kind-agentic-iac-s10 -n argocd rollout status deployment/argocd-repo-server --timeout=120s
```

[ sample output ]

```text
deployment.apps/argocd-repo-server restarted
deployment "argocd-repo-server" successfully rolled out
```

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

[ sample output ]

```text
application.argoproj.io/inference-platform condition met
deployment "inference-platform-dependencies" successfully rolled out
deployment "inference-platform-api" successfully rolled out
deployment "inference-platform-worker" successfully rolled out
```

Each of the three Application waits prints the same `condition met` line. The
sample shows one of those three lines and all three rollout results.

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

### Remove owned Docker and Helm state

The cluster and mirror are gone, so their images are no longer in use. Remove
each course tag only after its current ID matches the ID saved by this run.

```bash
while IFS=$'\t' read -r S10_IMAGE_REF S10_CREATED_ID
do
  S10_CURRENT_ID="$(docker image inspect --format '{{.Id}}' "$S10_IMAGE_REF")"
  if [[ "$S10_CURRENT_ID" != "$S10_CREATED_ID" ]]; then
    printf 'STOP: image ownership changed for %s\n' "$S10_IMAGE_REF" >&2
    exit 1
  fi
  docker image rm "$S10_IMAGE_REF"
done < "$S10_COURSE_IMAGES"
```

[ sample output ]

```text
Untagged: 309-agentic-iac/inference-platform:s10-v1
Untagged: 309-agentic-iac/inference-platform:s10-v2
Untagged: agentic-iac-s10/redis-transport:8.6.4-alpine
Untagged: agentic-iac-s10/argocd-transport:v3.5.1
```

Remove a frozen source image only when it was absent before the lab and still
has the exact ID saved after setup. Preexisting source images remain untouched.

```bash
remove_new_source_image() {
  local image_ref="$1" before_id="$2" created_id="$3" current_id
  if [[ "$before_id" != "absent" ]]; then
    current_id="$(docker image inspect --format '{{.Id}}' "$image_ref")"
    if [[ "$current_id" != "$before_id" ]]; then
      printf 'STOP: preexisting source image changed for %s\n' "$image_ref" >&2
      exit 1
    fi
    return
  fi
  current_id="$(docker image inspect --format '{{.Id}}' "$image_ref")"
  if [[ "$current_id" != "$created_id" ]]; then
    printf 'STOP: source image ownership changed for %s\n' "$image_ref" >&2
    exit 1
  fi
  docker image rm "$image_ref"
}

remove_new_source_image \
  "$S10_REDIS_IMAGE_REF" "$S10_REDIS_IMAGE_BEFORE" "$S10_REDIS_IMAGE_CREATED"
remove_new_source_image \
  "$S10_ARGO_IMAGE_REF" "$S10_ARGO_IMAGE_BEFORE" "$S10_ARGO_IMAGE_CREATED"
remove_new_source_image \
  "$S10_GIT_IMAGE_REF" "$S10_GIT_IMAGE_BEFORE" "$S10_GIT_IMAGE_CREATED"
remove_new_source_image \
  "$S10_NODE_IMAGE_REF" "$S10_NODE_IMAGE_BEFORE" "$S10_NODE_IMAGE_CREATED"
unset -f remove_new_source_image

rm -r "$S10_HELM_ROOT"
while read -r S10_IMAGE_REF
do
  if docker image inspect "$S10_IMAGE_REF" >/dev/null 2>&1; then
    printf 'STOP: course tag remains: %s\n' "$S10_IMAGE_REF" >&2
    exit 1
  fi
done < "$S10_COURSE_REFS_FILE"
if [[ -e "$S10_HELM_ROOT" ]]; then
  printf 'STOP: isolated Helm state remains\n' >&2
  exit 1
fi
printf 'docker_course_tags=removed isolated_helm_state=removed\n'
```

[ sample output ]

```text
Untagged: bitnami/git@sha256:972d6f...
docker_course_tags=removed isolated_helm_state=removed
```

Docker removal output varies with pre-run cache state. The last line confirms
that the course tags and isolated Helm repository state were removed.

### Remove the owned local evidence

The cleanup helper checks the course marker before removing each evaluator
directory. Remove the remaining named files from the unique temporary root.

```bash
node section-10/scripts/cleanup-starter-evidence.mjs \
  "$S10_STARTER_EVIDENCE"
node section-10/scripts/cleanup-starter-evidence.mjs \
  "$S10_REPAIRED_EVIDENCE"

command rm -f "$S10_V2_APPROVAL" \
  "$S10_V2_APPROVAL.gate.json" \
  "$S10_RECOVERY_APPROVAL" \
  "$S10_RECOVERY_APPROVAL.gate.json" \
  "$S10_PORT_FORWARD_LOG" \
  "$S10_APPROVAL_ROOT/.agentic-iac-s10-approval-root" \
  "$S10_COURSE_REFS_FILE" \
  "$S10_COURSE_IMAGES"

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

### Kind cluster creation fails

Read the error from `kind create cluster`. Do not upgrade only because your
version differs from the sample. If the command reports a real configuration
or runtime error, delete only the partial `agentic-iac-s10` cluster, correct
the reported problem, and run the cluster command again.

### Kind cannot load a Redis or Argo CD digest

Re-run the single-platform transport build for your Docker server architecture.
Then load the matching `agentic-iac-s10` transport tag again. Keep the Helm
repository and tag overrides shown in the install command.

### Application revision does not change

Check the mirror container's `com.schoolofdevops.source-revision` label. A
local Git commit is not published until the old mirror is stopped and the new
read-only mirror is started.

### Application is healthy but the workload check fails

Read the destination namespace from the Application again. In this lab it is
`inference`, not `inference-platform`. Then check Deployment events and rollout
status before requesting another sync.

## Summary

You rejected exactly three trust failures, repaired only the reviewed delivery
files, and compared direct Terraform and OpenTofu plans without apply. A human
approved v1, v2, and the recovery revision before each publication boundary.

The runtime evidence separated Git publication, Application status, operation
status, workload readiness, and request behavior. Replica and image drift
remained visible because self-heal was disabled. The final `git revert` and
explicit recovery sync returned the workload to one ready v1 replica, and the
cleanup restored the pre-run Docker tag state and removed isolated Helm state.
