---
sidebar_position: 2
title: 'Lab: Plan an IaC Change Before Writing Code'
---

# Lab: Plan an IaC Change Before Writing Code

In this lab, you will plan an asynchronous queue feature for the Production AI Workload Platform.
You will correct two unsafe ownership decisions, complete four review artifacts, and validate the design before any code is written.

## Objectives

- Convert a feature request into observable acceptance criteria.
- Separate Terraform state and queue resources by environment.
- Assign infrastructure, deployment, promotion, runtime, and secret concerns to the correct lifecycle.
- Record the decision and rollback intent in an ADR.
- Complete a small FINOS CALM architecture model.
- Keep human approval pending after automated checks pass.

## Prerequisites

- Complete Sections 1 and 2 and keep the learner repository.
- Install Node.js 20 or later.
- Use any text editor.
- Allow npm registry access for the CALM check, or use a cached copy of `@finos/calm-cli@1.57.0`.

No cloud account, API key, container runtime, or Kubernetes cluster is required.
This lab creates design artifacts only. Do not generate implementation code or run an apply, deploy, destroy, or state command.

## PART I - Read the request and work boundary

### Confirm your working directory

Begin at the root of the labs repository. Check your current directory.

```bash
pwd
```

[ Expected output ]

```text
/home/learner/309-agentic-iac-labs
```

Your path will be different. It should end at the root of your labs clone.

List the Section 3 entry files.

```bash
ls section-3
```

[ Expected output ]

```text
README.md  challenge  request.md  scripts  starter  task.md  tests
```

The request describes the business change. The task defines what may change and where the work must stop.

### Read the feature request

Read the request before asking an agent to help.

```bash
sed -n '1,220p' section-3/request.md
```

[ Expected output ]

```text
# Feature request: asynchronous AI workload jobs

The Production AI Workload Platform currently keeps an HTTP request open...
...
This section produces design artifacts only. Do not generate Terraform, Helm,
application, or GitOps implementation code.
```

Observe the required flow. A client submits a job, the API places it on a queue, a worker processes it, and the client reads status and results through the API.
The design covers local, test, and production.

The request also sets a data boundary. Job payloads, job status, results, and reusable secret values must stay outside Terraform state.

### Read the task contract

Read the task contract to understand the permitted files and stop conditions.

```bash
sed -n '1,280p' section-3/task.md
```

[ Expected output ]

```text
# Section 3 Design Task

## Goal
...
## Work boundary
...
## Required result
...
## Validate the design
...
## Do not
...
```

Confirm these boundaries before you continue:

- only four design artifacts may change;
- no Terraform, Helm, GitOps, or application implementation may be created;
- no apply, deployment, destroy, or state command may run;
- platform, application, and security approval must remain pending.

## PART II - Inspect all four design artifacts

### Inspect the change brief

The change brief should tell a reviewer what success looks like. Read its current outcome, acceptance criteria, assumptions, non-goals, change class, approval, and rollback intent.

```bash
sed -n '1,240p' section-3/starter/change-brief.md
```

[ Expected output ]

```text
# Change brief: asynchronous workload jobs

## Outcome
...
## Acceptance criteria
...
## Assumptions
...
## Non-goals
...
## Change class
...
## Approval
...
## Rollback intent
...
```

The starter describes API and worker behaviour. It does not yet give enough evidence for state isolation, sensitive-data handling, all architecture paths, and security review.

### Inspect the environment and state map

This artifact assigns state, data, and settings to lifecycle owners. Read each table.

```bash
sed -n '1,280p' section-3/starter/environment-state-map.md
```

[ Expected output ]

```text
# Environment and state ownership

## Environment map
...
| test | `remote://platform/production` | Platform engineering | Test workloads only |
| production | `remote://platform/production` | Platform engineering | Production workloads only |
...
| Terraform state contents | Queue resource IDs, access policy IDs, job payload, job status, result data |
```

Find the two seeded design problems:

1. test and production claim the same Terraform state;
2. Terraform state is planned to contain application job data.

These problems are intentional. You will correct them after checking the starting evidence.

### Inspect the architecture decision record

Read the ADR to see why ownership is divided by lifecycle and how rollback protects accepted jobs.

```bash
sed -n '1,280p' section-3/starter/decisions/0001-queue-ownership.md
```

[ Expected output ]

```text
# ADR 0001: Own the asynchronous queue by lifecycle

## Status
...
## Context
...
## Decision
...
## Alternatives considered
...
## Consequences
...
## Rollback intent
...
## Approval
...
```

The candidate still needs explicit environment isolation, secret rotation, runtime secret lookup, operational consequences, and security review.

### Inspect the architecture model

The CALM document gives reviewers a machine-readable view of components, relationships, and trust boundaries.

```bash
sed -n '1,340p' section-3/starter/architecture/queue-feature.calm.json
```

[ Expected output ]

```json
{
  "$schema": "https://calm.finos.org/release/1.2/meta/calm.json",
  "title": "Production AI Workload Platform - asynchronous queue path",
  "metadata": {
    "trust-boundaries": [
      "public-api",
      "workload-platform",
      "secret-management"
    ]
  },
  "nodes": [
    ...
  ],
  "relationships": [
    ...
  ]
}
```

Trace every current relationship by its source and destination.
The model has the API, queue, worker, result store, and secret manager. It does not yet show every path required by the task.

## PART III - Compare the two starting checks

### Run the local design check

The local validator knows the ownership and safety rules for this course. Run it against the unchanged starter.

```bash
node section-3/scripts/check-design-pack.mjs section-3/starter
```

[ Expected output ]

```text
Design pack: NEEDS WORK (2 design problems found)
- environment-state-map.md [terraform-state.contents]: Application job data belongs to the application, not Terraform state.
- environment-state-map.md [environments.test.state]: Test and production must use different Terraform state.
```

The command exits with status 1. This is the expected starting result. It identifies engineering decisions that must change.

### Check the starter against CALM

Now check whether the architecture JSON conforms to the pinned CALM 1.2 schema.

```bash
npx --yes @finos/calm-cli@1.57.0 validate -a section-3/starter/architecture/queue-feature.calm.json -f pretty
```

[ Expected output ]

```text
info [calm-validate]:     Formatting output as pretty
Summary
- Errors: no (0)
- Warnings: no (0)
- Info/Hints: 0

No issues found.
```

The unsafe starter can pass CALM because its JSON is valid against the CALM schema.
Schema conformance does not decide whether runtime data belongs in Terraform state or whether environments share state.

The checks prove different things:

| Check | What a PASS proves | What it does not prove |
| --- | --- | --- |
| Local design validator | The encoded course rules are satisfied. | CALM conformance, approval, implementation, or runtime behaviour. |
| FINOS CALM validator | The architecture JSON conforms to CALM 1.2. | Correct ownership, safe state, approval, deployment, or runtime behaviour. |

If npm cannot download the package, record this result:

```text
CALM schema validation: NOT RUN - package download unavailable
```

Continue with the local design work. Do not record CALM as passed when the CLI did not run.

## PART IV - Complete the design pack

### Choose how you will edit

The instructor demonstrates this task with Codex. From the repository root, start an interactive Codex session.

```bash
codex
```

[ Expected output ]

Codex opens an interactive session in the learner repository. If you use another agent or edit manually, skip this command.

Give Codex this instruction:

```text
Read section-3/request.md and section-3/task.md. Explain the unsafe decisions
before editing. Change only the four allowed design artifacts. Stop after local
and CALM validation. Keep every human approval pending.
```

You may use Claude Code, Goose, Cursor, Copilot, another compatible coding agent, or edit the files manually.
The task contract and validators remain the same. You do not need to record which tool you chose in a file.

### Correct environment and data ownership

Open `section-3/starter/environment-state-map.md` in your editor.

Make these decisions explicit:

- local, test, and production have different state paths and queue boundaries;
- Terraform state stores resource identifiers and non-secret infrastructure configuration only;
- job payloads, status, and results belong to application runtime storage;
- secret management owns credential and encryption-key values;
- the API and worker read secret values at runtime;
- Terraform, Helm, GitOps, application configuration, and secret management have separate responsibilities.

Do not move a problem from one table to another. State both the lifecycle owner and the storage boundary for runtime data.

### Strengthen the change brief

Open `section-3/starter/change-brief.md`.

Add observable criteria for:

- separate state and queue resources in every environment;
- no job data or secret values in Terraform state or Git;
- the client, queue, result, and trust-boundary paths in the architecture model.

Record the assumption about result lookup by job ID.
Keep implementation and product selection outside the scope. Add security to the required review and state clearly that the candidate is not approved.

### Complete the ADR

Open `section-3/starter/decisions/0001-queue-ownership.md`.

Record why each environment needs independent state, where secret values live, how workloads obtain them, and who reviews the boundary.
Add the consequence that a state operation in one environment cannot claim another environment's queue.

Keep rollback safe for accepted jobs. Removing a queue is not the first rollback action.

### Complete the CALM model

Open `section-3/starter/architecture/queue-feature.calm.json`.

Add the external client and the missing relationships so a reviewer can trace:

1. client to API;
2. API to queue;
3. queue to worker;
4. worker to result store;
5. API to result store;
6. API and worker runtime access to secret management.

Give the client its own trust boundary. Keep each relationship reference consistent with a node `unique-id`. This file records architecture. It is not deployment configuration.

## PART V - Validate and review the candidate

### Run the local design check again

Run the course validator after all four artifacts are complete.

```bash
node section-3/scripts/check-design-pack.mjs section-3/starter
```

[ Expected output ]

```text
Design pack: PASS (0 design problems found)
The local ownership and safety rules are satisfied.
```

This PASS covers only the rules encoded by the local validator. Read the full task contract again before you accept the candidate for review.

### Validate the completed CALM model

Run the schema check against the edited architecture file.

```bash
npx --yes @finos/calm-cli@1.57.0 validate -a section-3/starter/architecture/queue-feature.calm.json -f pretty
```

[ Expected output ]

```text
info [calm-validate]:     Formatting output as pretty
Summary
- Errors: no (0)
- Warnings: no (0)
- Info/Hints: 0

No issues found.
```

If the package is unavailable, keep the local PASS and record CALM as NOT RUN. Do not replace missing schema evidence with an assumption.

### Confirm the changed scope

Check which design files changed before review.

```bash
git status --short section-3/starter
```

[ Expected output ]

```text
 M section-3/starter/architecture/queue-feature.calm.json
 M section-3/starter/change-brief.md
 M section-3/starter/decisions/0001-queue-ownership.md
 M section-3/starter/environment-state-map.md
```

Four changed design artifacts are expected. Stop if an implementation file or another repository file appears.

## Checkpoint

Your Section 3 checkpoint is a reviewable design pack with this evidence:

| Evidence | Required result |
| --- | --- |
| Local design validator | `PASS (0 design problems found)` |
| CALM validator | `No issues found`, or honestly recorded as `NOT RUN` |
| Changed scope | Only the four allowed design artifacts |
| Implementation code | Not generated |
| Human approval | Pending |

Continue with the [lifecycle ownership challenge](./operator-challenge.md) after you record this checkpoint.

## Troubleshooting

### The local check still reports two problems

Read the artifact and field named in each message. Give test and production different state paths.
Remove runtime job data from Terraform state and record its application-owned storage boundary.

### The local check passes before you complete the design

The checker covers a small set of course rules. Use every acceptance criterion in `section-3/task.md`; do not stop at the first green command.

### CALM reports an unknown node reference

Compare each relationship source and destination with the node `unique-id` values. The spelling must match exactly.

### npm cannot reach the registry

Keep the local validator result. Record CALM as NOT RUN and retry when npm network access is available.
A network failure does not require cloud credentials or a global package install.

## Teardown

This lab creates no infrastructure and runs no background service. No runtime teardown is required. Keep the four changed artifacts for human design review.

## Summary

You converted a feature request into a bounded design pack and separated lifecycle ownership.
You checked a CALM architecture model and stopped before implementation. Automated evidence is ready; human approval is still pending.
