---
sidebar_position: 3
title: 'Operator Challenge - Review a Multi-Lane Delivery Change'
description: Review an independent evidence packet that mixes Terraform, Helm, and a privileged workflow, then design the minimum safe approval path.
---

# Operator Challenge: Review a Multi-Lane Delivery Change

You are the senior platform reviewer for a pull request that claims to reduce
inference-platform cost. The pull request changes Terraform, a Helm package,
and the privileged workflow that produces delivery evidence. The authoring
agent reports that formatting and validation pass.

This is an **independent packet-only review**. It is separate from the live
diagnostics exercise. Do not run a command, change a repository, inject a
fault, or use information from the Section 10 lab. Work only from the packet
on this page.

Your job is not to repair the files. Your job is to decide how the change must
be split and to design the **minimum safe approval path** for each resulting
part.

:::warning[Do not let a green check answer the authority question]

The packet includes valid-looking output. First decide whether the workflow
that produced it was allowed to evaluate this pull request and whether the
evidence is bound to the current commit and artifact.

:::

## Review context

The protected `main` branch contains the production delivery workflow. A
normal pull request may propose Terraform and Helm changes. Workflow changes
need review by `@delivery-security`. Terraform environment changes need
`@platform-infra`. Helm workload changes need `@workload-platform`.

The delivery workflow normally runs on `pull_request` with read-only contents
permission. A separate production environment requires a reviewer before its
deployment credential becomes available. The organization supports required
checks and CODEOWNERS review. Signed provenance is available for build
artifacts, but it is not yet required by every repository rule.

## Evidence packet

### Pull request summary

```text
PR number:          842
base branch:        main
author:             agent-author
head commit:        9f64a2c580c75c276d5fdf65aa39d0b78839581e
author statement:   reduce worker cost and automate delivery
changed files:      5
```

### Changed files

```text
.github/workflows/terraform-plan.yml
terraform/worker/main.tf
terraform/worker/variables.tf
helm/inference-platform/values-prod.yaml
helm/inference-platform/templates/deployment-worker.yaml
```

### Current ownership rules

```text
/terraform/                       @platform-infra
/helm/inference-platform/         @workload-platform
/.github/workflows/               @delivery-security
```

### Workflow diff

```diff
-on: pull_request
+on: pull_request_target

 permissions:
   contents: read
+  id-token: write
+  deployments: write

 jobs:
   plan:
+    environment: production
     steps:
-      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608
+      - uses: actions/checkout@v4
+        with:
+          ref: ${{ github.event.pull_request.head.sha }}
       - run: terraform plan -out reviewed.tfplan
-      - uses: actions/upload-artifact@65462800fd760344b1a7b4382951275a0abb4808
+      - uses: actions/upload-artifact@v4
         with:
-          path: evidence/reviewed-plan.json
+          path: .
+      - run: terraform apply -auto-approve reviewed.tfplan
```

### Terraform diff

```diff
 resource "example_worker_pool" "inference" {
-  minimum_nodes = 2
-  maximum_nodes = 6
+  minimum_nodes = var.minimum_nodes
+  maximum_nodes = var.maximum_nodes
 }

+variable "minimum_nodes" {
+  type    = number
+  default = 0
+}
+
+variable "maximum_nodes" {
+  type    = number
+  default = 10
+}
```

### Helm diff

```diff
 worker:
-  replicas: 2
+  replicas: 0
   image:
-    digest: sha256:6a15...bb31
+    tag: latest

 spec:
   template:
     spec:
-      serviceAccountName: inference-platform-worker
+      serviceAccountName: default
```

### Check summary attached to the pull request

```text
check name:          terraform-plan
reported commit:     9f64a2c580c75c276d5fdf65aa39d0b78839581e
workflow ref:        refs/pull/842/merge
terraform fmt:       PASS
terraform validate:  PASS
terraform plan:      PASS
helm lint:           PASS
overall:             PASS
```

The summary contains no workflow SHA-256, plan SHA-256, plan JSON SHA-256,
resource action list, policy identity, artifact digest, runner identity, or
proof that the checked workflow is the protected base version.

### Proposed approval comment

```text
approved_by=agent-author
purpose=plan-and-deploy
revision=9f64a2c580c75c276d5fdf65aa39d0b78839581e
environment=production
```

### Proposed Argo Application change after merge

```yaml
spec:
  source:
    targetRevision: HEAD
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

`HEAD` is a mutable symbolic revision. The packet does not show which full
commit it resolved to, whether that commit was approved, or whether
`.status.sync.revision` matched it when the sync ran.

No Argo diff, sync status, health status, operation phase, workload image
identity, or runtime observation is included. The request assumes that a
successful workflow will make those records unnecessary.

## Your review task

Record your answer in course notes. Use headings so another reviewer can
follow your decision without seeing your reasoning process.

### 1. Classify the changes

Create a table with one row for every changed file. For each row, state:

- the owner and reviewer group;
- whether the file is payload, evaluator, delivery authority, or runtime
  configuration;
- the possible production effect;
- the evidence required before approval; and
- whether it can remain in the same pull request as the other files.

Pay specific attention to the privileged workflow. Explain how its event
context, token permissions, untrusted fork checkout, mutable action pin,
production environment, broad artifact path, and apply command change the
trust boundary.

### 2. Design the split

Propose the smallest set of pull requests that prevents one candidate from
changing both the payload and the system that judges or deploys it. For every
part, name:

- exact file scope;
- CODEOWNERS review;
- required checks;
- protected branch or merge rule;
- allowed workflow identity and token permissions;
- artifact boundary; and
- the condition that stops the part from progressing.

Do not assume that splitting files alone is enough. Explain which part must
land first, which workflow version evaluates later parts, and how a new push
invalidates previous approval.

### 3. Evaluate the Terraform evidence

State whether the attached plan summary is sufficient for a controlled apply.
List the fields needed to bind a plan to the source commit, workflow, engine,
target, direct plan JSON, resource actions, and policy results. Explain what
must happen if the plan, state, variables, provider selection, target identity,
or head commit changes while approval is pending.

The broad workspace artifact includes a saved plan that can contain sensitive
values in clear text, and its JSON form can expose the same data. Explain
why those files remain unsafe even when terminal
output is redacted. State why a hash proves integrity but does not provide
confidentiality. Separate a protected saved plan for the controlled consumer
from a sanitized review summary, and define bounded paths, access control, and
minimum retention for both.

Your design must keep planning separate from apply. Name the independent human
approval, protected environment, workflow identity, concurrency rule, and
stale-plan rejection needed before any production apply could be considered.
Do not invent an apply success result; none is present in the packet.

### 4. Evaluate the Helm and Argo path

Identify the review questions raised by zero worker replicas, a mutable image
tag, and the default ServiceAccount. Define the static evidence needed for the
rendered chart and the immutable artifact identity needed for promotion.

Then define the Argo evidence that would be needed after a reviewed Git change:
target revision, diff, sync status, health, operation phase, observed workload
image, and an application-level runtime observation. Explain why automatic
prune and self-heal require a separate policy decision and why Synced or
Healthy would not replace a client result.

Evaluate `targetRevision: HEAD` directly. Explain how a symbolic revision can
move between approval and sync. Choose either a pinned commit or a protected
promotion ref, then require the approved full commit to match
`.status.sync.revision` and the immutable workload artifact digest.

### 5. Draw the minimum safe approval path

Draw one flow from request to runtime. Include these nodes:

1. bounded change request;
2. exact commit;
3. trusted required checks;
4. correct CODEOWNERS reviews;
5. commit-bound plan or render artifact;
6. independent human approval with one purpose;
7. protected delivery identity;
8. Terraform transaction or Argo reconciliation result; and
9. runtime observation.

Label every handoff with the evidence that crosses it. Mark where the path must
stop if the workflow changes, the commit moves, the artifact digest differs,
the environment is wrong, Argo becomes Degraded, or the runtime result fails.

## Submission checklist

Your review is complete only when it contains:

- a five-file classification table;
- a proposed pull-request split and landing order;
- event context and untrusted-fork analysis;
- explicit token permissions and exact action pin requirements;
- required checks, CODEOWNERS, branch protection, and environment gates;
- a commit-bound Terraform plan evidence schema and stale-plan response;
- saved-plan confidentiality controls and a sanitized review summary;
- Helm render and immutable image evidence;
- a mutable symbolic-revision check against `.status.sync.revision`;
- an Argo revision, sync, health, operation, and runtime evidence path;
- separation of author, reviewer, workflow, and runtime identities;
- one minimum safe approval-path diagram; and
- a clear reject, revise, or approve decision for every proposed part.

Do not score the packet by counting green labels. Record your answer by stating
which exact claim each artifact supports and which decision still belongs to a
human reviewer.
