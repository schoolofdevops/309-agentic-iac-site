---
sidebar_position: 2
title: 'Lab: Prepare the Agentic IaC Workspace'
---

# Lab: Prepare the Agentic IaC Workspace

In this lab, you will verify the supported workstation, inspect the course project boundaries, classify infrastructure-agent actions by autonomy level, and convert an unsafe request into a bounded task brief.

You do not need a coding agent for this lab. The instructor uses Codex in demonstrations. Starting in Section 2, you may complete the same agent tasks with Codex, Claude Code, Goose, Cursor, GitHub Copilot, VS Code, or another compatible coding agent.

This lab does not create a cluster or apply infrastructure.

## Objectives

- Verify Git, Docker, Terraform, and OpenTofu.
- Confirm the 7 GB local learner profile.
- Identify the project and tool ownership boundaries.
- Classify manual, assisted, agentic, approved-delivery, and persistent-observation actions.
- Write a safe task brief with scope, evidence, stop, and approval controls.

## Prerequisites

- Git, Docker, Terraform, and OpenTofu are installed.
- Your Docker-compatible runtime is running.
- You have at least 7 GB RAM, four logical CPUs, and 20 GB of free disk.
- Node.js 20 or newer is available for the local checkpoint script.

## PART I - Get the learner repository

Clone the public lab repository.

```bash
git clone https://github.com/schoolofdevops/309-agentic-iac-labs.git
cd 309-agentic-iac-labs
```

[ Expected output ]

```text
Cloning into '309-agentic-iac-labs'...
```

Confirm the repository root.

```bash
test -f phase-0/p0-agent-terraform/task.md && printf 'PASS repository root\n'
```

[ Expected output ]

```text
PASS repository root
```

## PART II - Run the local preflight

Run the workstation check.

```bash
./section-1/scripts/preflight.sh
```

[ Expected output ]

```text
Agentic IaC Section 1 preflight
Baseline: 7 GB RAM, 4 logical CPUs, 20 GB free disk

git version 2.x.x
Docker server 2x.x.x
Terraform v1.x.x
OpenTofu v1.x.x
PASS     machine meets the 7 GB RAM course baseline
PASS     learner lab repository detected

PASS     preflight complete; workspace is ready for bounded agent tasks.
```

Your version numbers can differ. The final `PASS` line is the checkpoint. The script checks Docker availability but does not start a container.

## PART III - Inspect the project boundaries

List the top-level learner and feasibility areas.

```bash
command find phase-0 section-1 -maxdepth 2 -type d | sort
```

You should see the learner preflight under `section-1` and the small validation fixtures under `phase-0`.

Now inspect the five project ownership areas that will grow later in the course.

| Area | Primary owner | What belongs there |
|---|---|---|
| Cloud-shaped foundation | Terraform/OpenTofu | Storage, queue, job state, identity, and supporting resources |
| Workload package | Helm | API and worker manifests, values contract, health, and resources |
| Runtime | Kubernetes | Current Pods, Services, events, logs, and status |
| Delivery | GitHub Actions and Argo CD | Reviewed plans, promotion, reconciliation, and delivery evidence |
| Observation | Hermes | Read-only drift and operational reports |

Answer these questions before continuing:

1. Should an application job result be stored in Terraform state?
2. Should an agent edit a GitHub Actions deployment workflow in the same change that the workflow will execute?
3. Does a successful Helm render prove that the Pods are healthy?
4. Can a read-only drift observer apply its own remediation?

The expected answer is **no** for all four. Each case crosses an ownership, trust, or evidence boundary.

## PART IV - Classify autonomy levels

Read the action scenarios.

```bash
sed -n '1,240p' section-1/scenarios/autonomy-actions.json
```

Open `section-1/answers/autonomy-classification.json` in your editor. This is a file path, not a terminal command.

Replace each `TODO` classification with one of these values:

- `L0`: a human performs the action without an agent.
- `L1`: the model suggests or explains.
- `L2`: the agent inspects and plans but cannot change anything.
- `L3`: the agent makes a bounded change and runs non-destructive checks.
- `L4`: a specific state-changing delivery action runs after separate approval.
- `L5`: a persistent agent performs scheduled, read-only observation.
- `REJECT`: the action should not be authorized as written.

Add one short reason for every answer. Focus on authority, evidence, and approval. Do not select a higher level because it sounds more advanced.

Run the checkpoint. The safe-task section will still fail until Part V is complete, but your classifications should pass first.

```bash
node section-1/scripts/check-foundations.mjs
```

[ Expected output after the classifications are correct ]

```text
PASS     autonomy classifications are complete
AssertionError ... define a bounded objective
```

The failure is expected at this point. It proves the second part of the checkpoint has not been completed.

## PART V - Replace an unsafe request with a task brief

Read the unsafe request.

```bash
sed -n '1,160p' section-1/challenge/unsafe-request.md
```

The request gives the agent broad credentials, a full-repository write boundary, apply authority, and permission to remove resources. It also has no evidence requirement or stop condition.

Open `section-1/challenge/safe-task-brief.json` in your editor. This is a file path, not a terminal command.

Complete every field. Use the upcoming missing-provider repair as the task:

- The objective is to repair and validate one broken Terraform module.
- Allow only the fixture's `main.tf` file.
- Allow inspection, formatting, initialization without a backend, and validation.
- Forbid apply, state operations, and delete/destroy actions.
- Require the diff plus Terraform and OpenTofu validation evidence.
- Stop on success, repeated failure, or a required out-of-scope change.
- Require human approval for state-changing or destructive work.

Run the complete checkpoint.

```bash
node section-1/scripts/check-foundations.mjs
```

[ Expected output ]

```text
PASS     autonomy classifications are complete
PASS     safe task brief contains scope, evidence, stop, and approval controls
PASS     Section 1 foundation checkpoint complete
```

## PART VI - Inspect the evidence you will produce next

The Section 2 repair will not be graded by a chat transcript. It will be graded by these artifacts:

```text
task brief
Git diff
Terraform formatting result
Terraform validation result
OpenTofu validation result
changed-file boundary check
stop-condition record
```

This evidence works across compatible coding agents. The instructor will demonstrate the task with Codex, but Codex is not required for the learner result.

## Troubleshooting

:::warning[Docker version check fails]

Start your Docker-compatible runtime and wait until it reports ready. Run the preflight again. Do not start containers just to pass this lab.

:::

:::warning[OpenTofu is missing]

Install OpenTofu and run the preflight again. A Terraform validation result is not automatically an OpenTofu compatibility result.

:::

:::warning[The classification checkpoint fails]

Read the failing scenario ID. Ask three questions: who performs the action, can the action change state, and where is approval? Use `REJECT` when the authority is unsafe as written.

:::

:::warning[The safe task brief checkpoint fails]

The assertion names the missing control. Keep each list explicit. For example, `no dangerous actions` is too vague; name apply, state operations, and delete/destroy.

:::

## Teardown

No runtime resources were created. Keep the repository for Section 2.

## Summary

You verified the local environment, mapped the project boundaries, classified autonomy, and turned an unsafe request into a bounded task brief.

In Section 2, you will give that brief to a compatible coding agent and complete the first governed Terraform repair.
