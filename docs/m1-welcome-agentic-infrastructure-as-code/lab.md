---
sidebar_position: 2
title: 'Lab: Prepare the Agentic IaC Workspace'
---

# Lab: Prepare the Agentic IaC Workspace

In this lab, you will check your workstation, discover available coding agents, and inspect the task brief used in Section 2.

The lab does not create a cluster or apply infrastructure. You can complete it without a coding agent.

## Objectives

- Confirm that you are working from the learner repository.
- Read the workstation preflight report.
- Identify which infrastructure tools and coding agents are available.
- Recognize a safe Agentic IaC task boundary.
- Distinguish suggestion, bounded action, approved delivery, and unsafe authority.

## Prerequisites

- You can open a terminal.
- Git is available, or you can download the learner repository as a ZIP file.
- A Bash-compatible shell is available. Windows learners should use WSL2.

The course was tested with 7 GB RAM, four logical CPUs, and 20 GB free disk.
These values are a reference profile. Lower values produce a warning and allow you to continue.

## PART I - Open the learner repository

Use the learner repository you cloned during Setup. Check your current directory.

```bash
pwd
```

[ Expected output ]

```text
/home/learner/309-agentic-iac-labs
```

Your path will be different. It should end with `309-agentic-iac-labs`.
If it does not, change to the directory where you cloned the learner repository,
then run `pwd` again.

List the repository contents.

```bash
ls
```

[ Expected output ]

```text
README.md  labs  phase-0  section-1  section-2
```

You are now at the repository root. Later commands use paths from this directory.

## PART II - Read the preflight report

Run the preflight.

```bash
./section-1/scripts/preflight.sh
```

[ Expected output ]

```text
Agentic IaC Section 1 preflight report
The tested reference profile is 7 GB RAM, 4 logical CPUs, and 20 GB free disk.
Lower values produce a warning, not a failure.

System profile
OK         RAM      16.0 GB
OK         CPU      8 logical CPUs
WARN       Disk     18.0 GB free is below the tested 20 GB baseline; continue with the lab

Infrastructure tools
AVAILABLE  Git              git version 2.x.x
AVAILABLE  Docker           Docker server 2x.x.x
AVAILABLE  Terraform        Terraform v1.x.x
AVAILABLE  OpenTofu         OpenTofu v1.x.x

Coding agents and interfaces (optional)
AVAILABLE  Codex            codex-cli x.x.x
NOT FOUND  Claude Code      command: claude
NOT FOUND  Goose            command: goose

READY     Preflight report complete. Warnings and missing optional agents do not block Section 1.
```

Your report will be different. Read it as an inventory.

- `OK` means the detected system resource meets the tested reference profile.
- `WARN` means your value is lower. Continue with Section 1. Before a later container lab, close unused applications and run only the profile required by that lab.
- `AVAILABLE` means the command was found and returned a version.
- `NOT READY` means the command exists, but its service or runtime is not ready.
- `NOT FOUND` means the command is not currently on your `PATH`.

You need only one compatible coding agent for the coding-agent labs.
The instructor demonstrates Codex. You may use Claude Code, Goose, Cursor, GitHub Copilot, VS Code, or another compatible agent.

## PART III - Inspect a safe task brief

Read the canonical task prepared for the first Terraform repair.

```bash
sed -n '1,240p' section-2/task.md
```

[ Expected output ]

```text
# Section 2 Repair Task

## Goal
...
## Work boundary
...
## Validate the repair
...
## About the provider lock file
...
## Do not
...
```

Observe the boundary:

1. The objective describes one result.
2. The agent may edit one named file.
3. Validation commands are allowed.
4. Apply, state operations, credentials, and deletion are forbidden.
5. The agent must return a diff and validation output.
6. The task stops when the repair needs more authority or a wider file scope.

This task brief is useful to both a human and an agent. You will use it during the real repair in Section 2.

## PART IV - Classify the agent actions

Read each action and choose the lowest useful level.

| Action | Your classification |
|---|---|
| Ask a model to explain a Terraform provider error. | L1, L2, L3, L4, or REJECT? |
| Allow an agent to edit one approved file and run validation. | L1, L2, L3, L4, or REJECT? |
| Let an agent use administrator credentials, apply immediately, and delete anything it considers unused. | L1, L2, L3, L4, or REJECT? |
| Run an already reviewed apply after a separate human approval. | L1, L2, L3, L4, or REJECT? |

Use these questions:

- Can the action change a file or infrastructure state?
- Is its scope explicit?
- What evidence will the action return?
- Is a separate approval required?

<details>
<summary>Check your classifications</summary>

| Action | Classification | Reason |
|---|---|---|
| Explain the provider error | L1 | The model suggests or explains. It does not act. |
| Edit one file and validate | L3 | The agent performs a bounded, non-destructive repository change. |
| Administrator access, immediate apply, and deletion | REJECT | The request combines broad credentials, destructive authority, and no approval boundary. |
| Apply after separate approval | L4 | A reviewed state-changing action runs only after human approval. |

</details>

## PART V - Compare an unsafe request

Read the unsafe version of the same task.

```bash
sed -n '1,160p' section-1/challenge/unsafe-request.md
```

[ Expected output ]

```text
# Unsafe request

Give the agent administrator credentials and access to the full repository. Ask it to fix the Terraform module, apply the change immediately, clean up anything it thinks is unused, and report success when it is done.

This request has no accepted file boundary, evidence requirement, retry limit, approval point, or stop condition.
```

Compare it with `safe-task-brief.md`. The safe brief corrects five problems:

- broad credentials;
- full-repository write access;
- immediate apply authority;
- unapproved deletion;
- success without required evidence or stop conditions.

## PART VI - Confirm a clean starting point

Check the repository before you begin Section 2.

```bash
git status
```

[ Expected output ]

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

The clean Git state gives you a visible starting point for the first agent-generated change.

## Troubleshooting

:::warning[The preflight script is not executable]

Run it through Bash:

```bash
bash section-1/scripts/preflight.sh
```

[ Expected output ]

```text
Agentic IaC Section 1 preflight report
...
READY     Preflight report complete. Warnings and missing optional agents do not block Section 1.
```

:::

:::warning[Docker reports NOT READY]

Section 1 does not start a container. You may continue. Start your Docker-compatible runtime before a later lab that uses containers.

:::

:::warning[Your machine is below the reference profile]

Continue with Section 1. For later runtime labs, close unused applications, start only the documented profile, and clean it up before starting another profile.

:::

:::warning[No coding agent is found]

Continue with Section 1. Choose and install one compatible coding agent before the Section 2 repair. You do not need every agent shown in the report.

:::

## Teardown

No runtime resources were created. Keep the repository for Section 2.

## Summary

You checked your working directory, read a non-blocking environment report, discovered available coding agents, and inspected the safe boundary for the first Agentic IaC change.
