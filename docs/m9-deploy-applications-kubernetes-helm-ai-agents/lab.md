---
sidebar_position: 2
title: Lab - Repair and Run a Helm Deployment on Kind
description: Repair two generated Helm defects, validate the rendered package, run it on Kind, and prove the queued-to-complete request flow.
---

# Lab: Repair and Run a Helm Deployment on Kind

In this lab, you will review a generated Helm package before you trust it. The
Go application tests pass and Helm lint passes, but the chart starts with
exactly two primary findings: committed backend token material and missing
worker resource limits.

You will predict the problems, render the chart, reject the unsafe package,
repair only three learner-owned files, and compare independent evaluator
evidence. After human review, you will run the exact package on one small Kind
cluster and observe a job move from queued to complete.

The runtime is local and disposable. It uses no cloud account, model API key,
GPU, Floci, Argo CD, Terraform apply, or OpenTofu apply.

Begin with the
[platform request](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-9/request.md)
and
[task contract](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-9/task.md).

## Objectives

You will:

- inspect a generated three-role application and Helm chart;
- explain why lint and rendering do not prove that a package is safe;
- repair an external Secret reference and the worker resource budget;
- compare rejected and accepted evaluator evidence;
- create the exact `agentic-iac-s9` Kind cluster;
- prove API health, dependency-aware readiness, and worker processing;
- diagnose the running system from Pods, events, endpoints, and logs;
- clean up the exact release, namespace, cluster, and temporary evidence.

## Prerequisites

You need:

- the learner labs repository at the Section 9 starter commit;
- Docker, Kind 0.32, kubectl 1.36, Helm 4.2, Go 1.25, kubeconform 0.8,
  Conftest with OPA 1.19, Node.js 20 or later, OpenSSL, and Git;
- about 15 minutes after the tools are installed;
- one coding agent only if you want the guided agent path.

The three proven Task 5 runs completed in 45.7 to 49.6 seconds after tools and
images were available. Their named Kind node peaked between 643.1 MiB and
671.1 MiB. Docker was configured with 7.744 GiB, but configured capacity is
not measured working-set usage. If your machine has less than the tested 7 GB
reference profile, continue unless Docker or a required tool reports a real
failure.

Only one cluster named `agentic-iac-s9` is allowed. If that name already
exists, stop and decide whether it belongs to you. Do not adopt or delete an
unknown cluster.

## PART I - Inspect the Generated Package

### Confirm your location

Begin at the root of the labs repository so every relative path below resolves
to the reviewed learner artifact.

```bash
pwd
```

[ sample output ]

```text
/Users/learner/309-agentic-iac-labs
```

Your path will be different. It should end at the root of your labs clone.

List the visible Section 9 files before opening individual artifacts.

```bash
command ls -1 section-9
```

[ Expected output ]

```text
README.md
app
challenge
chart
policy
recovery
request.md
scripts
task.md
tests
tools
```

### Read the request and ownership boundary

Read why the package needs a repair.

```bash
sed -n '1,180p' section-9/request.md
```

[ sample output ]

```text
# Request: repair a generated Kubernetes and Helm package

The platform team received a generated Helm package for the compact inference
workload. The application tests pass and Helm lint passes, but the package
contains committed backend token material and missing worker resource limits.
```

Read the complete bounded task before asking an agent or editing manually.

```bash
sed -n '1,220p' section-9/task.md
```

[ sample output ]

```text
# Section 9 task contract

Make the smallest repair that takes the evaluator from exactly two primary
findings to READY_FOR_HUMAN_REVIEW.
```

The task permits changes to only these chart files:

- `section-9/chart/templates/deployment.yaml`;
- `section-9/chart/values.schema.json`;
- `section-9/chart/values.yaml`.

The application, evaluator, policy, tests, lifecycle tools, request, and task
remain read-only.

### Inspect the chart defaults

Read the values because defaults become release intent unless a reviewed
override replaces them.

```bash
sed -n '1,220p' section-9/chart/values.yaml
```

[ sample output ]

```yaml
backend:
  url: http://inference-platform-dependencies:8081
  token: <committed value withheld>

resources:
  worker:
    requests:
      cpu: 10m
      memory: 32Mi
```

The token field is committed configuration. The worker has requests but no
limits. Do not copy the token-shaped value into notes, prompts, logs, or
rendered evidence.

Read the schema to see whether it prevents these unsafe defaults.

```bash
sed -n '1,280p' section-9/chart/values.schema.json
```

[ sample output ]

```json
"backend": {
  "required": ["url", "token"]
}
```

The starter schema requires the unsafe inline token path and does not require
worker limits. Schema validation therefore agrees with the defective chart.

Read the deployment template to see what the chart creates.

```bash
sed -n '1,300p' section-9/chart/templates/deployment.yaml
```

[ sample output ]

```yaml
kind: Secret
metadata:
  name: inference-platform-backend-token
---
kind: Deployment
```

The chart creates a Secret instead of referencing a Secret supplied outside
Helm. The same template renders the dependencies, API, and worker Deployments.

## PART II - Predict Before You Render

### Write your prediction

Before running a validator, predict what each tool can and cannot prove.

Record answers to these questions:

1. Will Helm lint reject valid YAML that contains an unsafe inline token?
2. Will Helm render reject a worker resource object that matches its weak
   schema?
3. Which independent checks must reject the package even if lint and render
   exit zero?

Your prediction is a review baseline. The tool output should confirm or
challenge it. It should not replace your reading of the chart.

## PART III - Render the Chart and See the False Green

### Check the required tools

Check Docker first because the later runtime depends on its server.

```bash
docker version --format '{{.Server.Version}}'
```

[ sample output ]

```text
29.5.2
```

Check Kind.

```bash
kind version
```

[ sample output ]

```text
kind v0.32.0 go1.25.7 darwin/arm64
```

Check the Kubernetes client.

```bash
kubectl version --client
```

[ sample output ]

```text
Client Version: v1.36.2
```

Check Helm.

```bash
helm version --short
```

[ sample output ]

```text
v4.2.3+g43e8b7f
```

Check the rendered-schema validator.

```bash
kubeconform -v
```

[ sample output ]

```text
v0.8.0
```

Check the policy client.

```bash
conftest --version
```

[ sample output ]

```text
Conftest: dev
```

Check Go and Node.js because the evaluator runs both application and author
contracts.

```bash
go version
```

[ sample output ]

```text
go version go1.25.7 darwin/arm64
```

```bash
node --version
```

[ sample output ]

```text
v24.8.0
```

Version patch numbers and architecture may differ. Stop only when a required
tool is missing or outside the supported major and minor version.

### Lint the starter

Lint answers whether the chart is structurally valid. It does not decide
whether committed secret material or the resource budget is acceptable.

```bash
helm lint --strict section-9/chart
```

[ Expected output ]

```text
==> Linting section-9/chart
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

The starter lint is a real pass. Your prediction should explain why this pass
is insufficient.

### Render the starter

Render the chart with a non-secret placeholder and select the Service template
so no token-shaped default enters the terminal or evidence file.

```bash
helm template inference-platform section-9/chart --namespace inference --set backend.token=render-only-placeholder --show-only templates/service.yaml
```

[ sample output ]

```yaml
kind: Service
metadata:
  name: inference-platform-api
spec:
  type: NodePort
  ports:
    - port: 8080
      nodePort: 30080
```

Rendering proves that Helm can produce Kubernetes objects. It does not prove
that the full package contains no secret material or that every role has exact
requests and limits.

## PART IV - Reject the Unsafe Package

### Create a real temporary evidence parent

The trusted evaluator accepts only a new directory below the operating-system
temporary directory. Create one real parent so the command also works on a
macOS host where `/tmp` is a symbolic link.

```bash
S9_TEMP_ROOT="$(mktemp -d)"
```

[ Expected output ]

```text
(no output)
```

Display the exact parent before writing evidence.

```bash
echo "$S9_TEMP_ROOT"
```

[ sample output ]

```text
/var/folders/.../T/tmp.ABC123
```

### Run the trusted evaluator

The external launcher checks the protected evaluator and scope before it
examines learner-owned files. The starter must be rejected.

```bash
node labs/m9/check-section-9.mjs section-9 "$S9_TEMP_ROOT/agentic-iac-section-9-starter"
```

[ Expected output ]

```text
Section 9 package: REJECTED
FINDING committed-backend-token-material: Committed backend token material
FINDING missing-worker-resource-limits: Missing worker resource limits
Evidence: <temporary path>/agentic-iac-section-9-starter/evidence-report.json
```

The non-zero exit is expected. There are exactly two primary findings. Schema,
secret scan, resource, and policy consequences are grouped beneath those two
defect families rather than presented as extra root causes.

### Read the rejected evidence

Read the report because a summary alone does not bind a decision to source,
tools, commands, and rendered output.

```bash
sed -n '1,260p' "$S9_TEMP_ROOT/agentic-iac-section-9-starter/evidence-report.json"
```

[ sample output ]

```json
{
  "decision": "REJECTED",
  "gates": {
    "helm_lint": {"status": "PASS"},
    "secret_scan": {"status": "FAIL"},
    "resource_limits": {"status": "FAIL"}
  },
  "primary_findings": [
    {"id": "committed-backend-token-material"},
    {"id": "missing-worker-resource-limits"}
  ]
}
```

Observe that application tests, Helm lint, render, kubeconform, security
context, probes, role boundaries, and allowed scope pass. The package still
requires repair.

## PART V - Repair Only the Owned Chart Files

### Instructor path with Codex

The instructor demonstrates Codex once from the labs repository. Codex asks a
human to approve repository trust before it loads project-local instructions.

```bash
codex
```

[ sample output ]

```text
You are in <path-to-the-labs-repository>

Do you trust the contents of this directory? Working with untrusted contents
comes with higher risk of prompt injection. Trusting the directory allows
project-local config, hooks, and exec policies to load.

› 1. Yes, continue
  2. No, quit

Press enter to continue
```

This is the recorded trust prompt from Codex 0.150.1. Read the repository
before choosing. The human approves repository trust by selecting
`1. Yes, continue`. Choose `2. No, quit` if the clone or its instructions are
not trusted. Repository trust allows local configuration to load; it does not
approve the repair, a deployment, or any other action.

Give Codex this bounded task:

```text
Read section-9/request.md and section-9/task.md. Inspect the chart, protected
scope, and rejected evidence report. Edit only
section-9/chart/templates/deployment.yaml,
section-9/chart/values.schema.json, and section-9/chart/values.yaml. Remove the
inline backend token and rendered Secret. Require and reference the existing
Secret inference-platform-backend-token with key token. Add the worker's 10m
CPU and 32Mi memory requests and 100m CPU and 64Mi memory limits, and require
the same exact resource contract in the schema. Preserve all three roles,
services, labels, probes, separate service accounts, security contexts, and
disabled-by-default NetworkPolicy rendering. Do not change the app, policy,
evaluator, tests, lifecycle tools, request, or task. Do not create a cluster,
namespace, release, image, credential, network call, or deployment. Show the
three-file diff, rerun Helm lint and the trusted evaluator in a new evidence
directory, and stop for my review.
```

Review the proposed diff before accepting it. Claude Code, Goose, Cursor,
Copilot, VS Code agents, and manual editing can use the same task contract and
the same independent gates.

### Manual editing path

If you edit manually, make these bounded changes:

1. Replace `backend.token` with `backend.existingSecret.name` and
   `backend.existingSecret.key` in `values.yaml`.
2. Add the worker's exact 10m/32Mi requests and 100m/64Mi limits.
3. Make the schema require the existing Secret object and the complete exact
   resource definition for every role.
4. Remove the generated Secret object from `deployment.yaml`.
5. Reference the existing Secret name and key from the projected read-only
   volume.

Inspect only the three learner-owned files.

```bash
git diff -- section-9/chart/templates/deployment.yaml section-9/chart/values.schema.json section-9/chart/values.yaml
```

[ sample output ]

```diff
-  token: <committed value withheld>
+  existingSecret:
+    name: inference-platform-backend-token
+    key: token
```

The diff must not contain an app, policy, evaluator, test, lifecycle, request,
or task change.

### Optional pinned recovery

Try the repair first. If you need the reviewed candidate, preserve your attempt
before restoring anything. This command saves staged and unstaged changes from
the three owned files outside the repository.

```bash
git diff --binary HEAD -- section-9/chart/templates/deployment.yaml section-9/chart/values.schema.json section-9/chart/values.yaml > "$S9_TEMP_ROOT/section-9-learner-attempt.patch"
```

[ Expected output ]

```text
(no output)
```

Restore only the three owned files from the pinned starter commit. This removes
your current staged and unstaged edits from those files. It does not change any
other learner file, and the saved patch preserves the attempt for later review.

```bash
git restore --source fdcc15c57c9879b3f15d03319ad5dd394e2706f2 --staged --worktree -- section-9/chart/templates/deployment.yaml section-9/chart/values.schema.json section-9/chart/values.yaml
```

[ Expected output ]

```text
(no output)
```

The repository includes the exact three-file diff from candidate commit
`718fd28edab8a026bab114c0f21800e2df450c83`. Check it against the clean pinned
starter files.

```bash
git apply --check section-9/recovery/718fd28edab8a026bab114c0f21800e2df450c83.patch
```

[ Expected output ]

```text
(no output)
```

Apply the pinned patch only after its clean check passes. It touches only the
same three owned files.

```bash
git apply section-9/recovery/718fd28edab8a026bab114c0f21800e2df450c83.patch
```

[ Expected output ]

```text
(no output)
```

Review the recovered diff before evaluation.

```bash
git diff -- section-9/chart/templates/deployment.yaml section-9/chart/values.schema.json section-9/chart/values.yaml
```

[ sample output ]

```diff
-kind: Secret
-metadata:
-  name: inference-platform-backend-token
+# The chart references a Secret created outside Helm.
```

## PART VI - Compare the Repaired Evidence

### Lint and render again

Lint the repaired chart before the independent evaluator runs its larger gate
set.

```bash
helm lint --strict section-9/chart
```

[ Expected output ]

```text
==> Linting section-9/chart
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

Render the complete repaired package through kubeconform. The Secret must
already exist at runtime, but no Secret object or value is rendered here.

```bash
helm template inference-platform section-9/chart --namespace inference --set networkPolicy.enabled=false | kubeconform -strict -summary
```

[ Expected output ]

```text
Summary: 9 resources found parsing stdin - Valid: 9, Invalid: 0, Errors: 0, Skipped: 0
```

### Run the repaired evaluator

Use a new evidence directory so the rejected baseline remains available for
comparison.

```bash
node labs/m9/check-section-9.mjs section-9 "$S9_TEMP_ROOT/agentic-iac-section-9-repaired"
```

[ Expected output ]

```text
Section 9 package: READY_FOR_HUMAN_REVIEW
Evidence: <temporary path>/agentic-iac-section-9-repaired/evidence-report.json
```

Read the accepted report.

```bash
sed -n '1,260p' "$S9_TEMP_ROOT/agentic-iac-section-9-repaired/evidence-report.json"
```

[ sample output ]

```json
{
  "decision": "READY_FOR_HUMAN_REVIEW",
  "gates": {
    "app_tests": {"status": "PASS"},
    "helm_lint": {"status": "PASS"},
    "render": {"status": "PASS"},
    "secret_scan": {"status": "PASS"},
    "resource_limits": {"status": "PASS"}
  },
  "primary_findings": []
}
```

Compare the two reports. The repaired result binds 13 green gates to exact
source, evaluator, render, app, chart, policy, tool, and command evidence. It
means ready for human review. It does not approve a deployment.

## PART VII - Run the Reviewed Package on Kind

Running the following commands is your explicit approval for this one
disposable local Kind run. It is not approval for a production deployment or
for an unknown existing cluster.

### Confirm the exact cluster name is free

List existing Kind clusters before creating anything.

```bash
kind get clusters
```

[ sample output ]

```text
shared-training
```

The list may instead be empty. Continue only when the exact name
`agentic-iac-s9` is absent. Do not delete or adopt an unrelated cluster.

### Build the local workload image

Build the one multi-role image from the reviewed application source.

```bash
docker build --tag 309-agentic-iac/inference-platform:s9 section-9/app
```

[ sample output ]

```text
naming to docker.io/309-agentic-iac/inference-platform:s9 done
```

### Create the exact Kind cluster

The reviewed configuration maps loopback host port `18080` to NodePort
`30080` and creates one control-plane node.

```bash
kind create cluster --name agentic-iac-s9 --config section-9/tools/kind/cluster.yaml --wait 120s
```

[ sample output ]

```text
Set kubectl context to "kind-agentic-iac-s9"
You can now use your cluster with:

kubectl cluster-info --context kind-agentic-iac-s9
```

### Load the local image

Kind nodes have their own container image store. Load the exact local image so
the Deployments do not need a registry.

```bash
kind load docker-image 309-agentic-iac/inference-platform:s9 --name agentic-iac-s9
```

[ sample output ]

```text
Image: "309-agentic-iac/inference-platform:s9" with ID "sha256:..." not yet present on node "agentic-iac-s9-control-plane", loading...
```

### Create the namespace

Create only the frozen runtime namespace on the exact context.

```bash
command kubectl --context kind-agentic-iac-s9 create namespace inference
```

[ Expected output ]

```text
namespace/inference created
```

### Create the disposable external Secret

Generate disposable local course data and pass it through standard input. The
value is not committed, printed, or stored by Helm.

```bash
openssl rand -hex 24 | command kubectl --context kind-agentic-iac-s9 --namespace inference create secret generic inference-platform-backend-token --from-file=token=/dev/stdin
```

[ Expected output ]

```text
secret/inference-platform-backend-token created
```

### Install the chart

Install the reviewed release with NetworkPolicy disabled. NetworkPolicy is
disabled in this core Kind profile. Default Kind networking is not proof that
NetworkPolicy rules are enforced.

```bash
helm install inference-platform section-9/chart --kube-context kind-agentic-iac-s9 --namespace inference --set networkPolicy.enabled=false --wait --timeout 120s
```

[ sample output ]

```text
NAME: inference-platform
NAMESPACE: inference
STATUS: deployed
```

### Check all three rollouts

Wait for the dependency role first because API and worker readiness depends on
it.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference rollout status deployment/inference-platform-dependencies --timeout=120s
```

[ Expected output ]

```text
deployment "inference-platform-dependencies" successfully rolled out
```

Check the API rollout.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference rollout status deployment/inference-platform-api --timeout=120s
```

[ Expected output ]

```text
deployment "inference-platform-api" successfully rolled out
```

Check the worker rollout.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference rollout status deployment/inference-platform-worker --timeout=120s
```

[ Expected output ]

```text
deployment "inference-platform-worker" successfully rolled out
```

## PART VIII - Observe the Queued-to-Complete Flow

### Check Pods and Services

Read Pod readiness before calling the API.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference get pods
```

[ sample output ]

```text
NAME                                              READY   STATUS    RESTARTS
inference-platform-api-595cc58cf9-d2drx           1/1     Running   0
inference-platform-dependencies-9b59cf594-fhx9f   1/1     Running   0
inference-platform-worker-6945b77bdc-nflfk        1/1     Running   0
```

Pod suffixes will differ. All three Pods must show `1/1 Running`.

Read the two Services and their exact ports.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference get services
```

[ sample output ]

```text
NAME                              TYPE        PORT(S)
inference-platform-api            NodePort    8080:30080/TCP
inference-platform-dependencies   ClusterIP   8081/TCP
```

### Check health and readiness

Health proves the API process is alive.

```bash
curl -sS -o /dev/null -w 'health HTTP %{http_code}\n' http://127.0.0.1:18080/healthz
```

[ Expected output ]

```text
health HTTP 200
```

Readiness proves the API can reach its backend dependency with the mounted
token.

```bash
curl -sS -o /dev/null -w 'ready HTTP %{http_code}\n' http://127.0.0.1:18080/readyz
```

[ Expected output ]

```text
ready HTTP 200
```

### Submit one deterministic job

Submit the reviewed course input. The API acknowledges the job before the
worker completes it.

```bash
curl -sS -X POST -H 'Content-Type: application/json' --data '{"input":"hello platform"}' http://127.0.0.1:18080/jobs
```

[ Expected output ]

```json
{"job_id":"job-0001","status":"queued"}
```

This is the directly observed queued state.

### Read the completed job

Read the same job after the worker has had a moment to claim and complete it.

```bash
curl -sS http://127.0.0.1:18080/jobs/job-0001
```

[ Expected output ]

```json
{"job_id":"job-0001","status":"complete","result":"MOCK INFERENCE: HELLO PLATFORM"}
```

If the first read still shows `queued` or `running`, run the same GET once
more. Do not submit another job. The three Task 5 runs directly observed
`queued` and `complete`; the short `running` state completed between polls.

## PART IX - Diagnose from Kubernetes Evidence

### Check ready endpoints

Endpoints connect Service selection to ready Pod addresses.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference get endpoints
```

[ sample output ]

```text
NAME                              ENDPOINTS
inference-platform-api            10.244.0.5:8080
inference-platform-dependencies   10.244.0.7:8081
```

Kubernetes 1.36 may print a deprecation warning for the legacy Endpoints view.
That warning does not change the observed addresses.

### Describe the API Deployment

Use the controller description to connect desired replicas, the probe path,
and rollout conditions.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference describe deployment/inference-platform-api
```

[ sample output ]

```text
Replicas:               1 desired | 1 updated | 1 total | 1 available
Readiness:              http-get http://:8080/readyz
Available               True
```

### Read role-specific logs

Read API logs for request handling without exposing the Secret value.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference logs deployment/inference-platform-api --tail=50
```

[ sample output ]

```text
(the healthy API may emit no log lines)
```

Read worker logs because dependency startup retries are useful operating
evidence.

```bash
command kubectl --context kind-agentic-iac-s9 --namespace inference logs deployment/inference-platform-worker --tail=50
```

[ sample output ]

```text
worker poll failed: backend request failed: ... connect: connection refused
```

Bounded retries during dependency startup are expected. A final ready Pod,
ready endpoint, HTTP 200 readiness response, and completed job prove recovery.
One earlier connection-refused line does not mean the final release failed.

### Run the independent diagnostic challenge

The challenge introduces a bad readiness path, an unreachable backend
connection, and a wrong Helm value. It requires Pods, events, endpoints,
rendered values, descriptions, and logs before diagnosis.

Open
[the Section 9 diagnostic task](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-9/challenge/task.md)
and complete it before reading its separate answer key.

## Checkpoint

Your Section 9 checkpoint contains:

- one starter rejected for exactly two primary findings;
- one three-file repair at the external Secret and worker resource boundaries;
- one 13-gate evaluator result ready for human review;
- one local image and one exact single-node Kind cluster;
- three separate Deployments and service accounts;
- two Services with ready endpoints;
- direct health and dependency-aware readiness HTTP 200 evidence;
- a directly observed `job-0001` queued-to-complete flow;
- Pod, Service, endpoint, event, description, and role-log evidence;
- no NetworkPolicy enforcement claim;
- a human decision boundary before any non-local deployment.

## Teardown

### Uninstall the exact Helm release

Remove only the named release from namespace `inference`.

```bash
helm uninstall inference-platform --kube-context kind-agentic-iac-s9 --namespace inference --wait --timeout 60s
```

[ Expected output ]

```text
release "inference-platform" uninstalled
```

### Delete the exact namespace

Delete the namespace so the disposable external Secret is removed with it.

```bash
command kubectl --context kind-agentic-iac-s9 delete namespace inference --wait=true --timeout=60s
```

[ Expected output ]

```text
namespace "inference" deleted
```

### Delete the exact Kind cluster

Delete only `agentic-iac-s9`. Do not run a broad container cleanup.

```bash
kind delete cluster --name agentic-iac-s9
```

[ Expected output ]

```text
Deleted nodes: ["agentic-iac-s9-control-plane"]
```

### Verify runtime cleanup

List Kind clusters and confirm the exact name is absent. Unrelated Kind clusters
may remain because teardown owns only `agentic-iac-s9`.

```bash
kind get clusters
```

[ sample output ]

```text
shared-training
```

Your output may instead say `No kind clusters found.` The cleanup proof is that
the exact name `agentic-iac-s9` is absent from the complete list.

Check that the exact node container is absent.

```bash
docker ps -a --filter name=agentic-iac-s9-control-plane --format '{{.Names}}'
```

[ Expected output ]

```text
(no output)
```

### Remove the exact temporary evidence

The reports were useful for comparison. Remove their known files and empty
directories now that your checkpoint notes are complete.

```bash
rm "$S9_TEMP_ROOT/agentic-iac-section-9-starter/.section-9-evaluation.json" "$S9_TEMP_ROOT/agentic-iac-section-9-starter/evidence-report.json"
```

[ Expected output ]

```text
(no output)
```

```bash
rmdir "$S9_TEMP_ROOT/agentic-iac-section-9-starter"
```

[ Expected output ]

```text
(no output)
```

```bash
rm "$S9_TEMP_ROOT/agentic-iac-section-9-repaired/.section-9-evaluation.json" "$S9_TEMP_ROOT/agentic-iac-section-9-repaired/evidence-report.json"
```

[ Expected output ]

```text
(no output)
```

```bash
rmdir "$S9_TEMP_ROOT/agentic-iac-section-9-repaired"
```

[ Expected output ]

```text
(no output)
```

If you used pinned recovery, remove the saved learner attempt after you have
finished reviewing it.

```bash
rm "$S9_TEMP_ROOT/section-9-learner-attempt.patch"
```

[ Expected output ]

```text
(no output)
```

```bash
rmdir "$S9_TEMP_ROOT"
```

[ Expected output ]

```text
(no output)
```

The exact Helm release, namespace, Kind cluster, node container, disposable
Secret, and temporary evidence are now absent. The local Docker image remains
cached for a later warm run and can be removed separately when you no longer
need the course.

## Troubleshooting

### The evaluator rejects the output parent

Create `S9_TEMP_ROOT` with `mktemp -d` as shown above. Do not use a symbolic
link as the parent and do not reuse an existing evidence directory.

### The exact Kind cluster already exists

Stop. Inspect who owns `agentic-iac-s9`. The lab refuses to adopt or delete an
unknown cluster. Continue only after the owner removes it or gives you an
explicit recovery decision.

### Helm reports that the external Secret is missing

Create `inference-platform-backend-token` in namespace `inference` before
installing the chart. Keep the value outside Helm and do not print it.

### A Pod is Running but not ready

Read `kubectl get pods`, `kubectl describe`, endpoints, events, and role logs.
Running describes the process state. Readiness describes whether Kubernetes
should send Service traffic.

### The worker log contains an early connection refusal

Check the current worker READY column, dependency endpoint, `/readyz` response,
and job result. A bounded startup retry followed by full recovery is expected.
