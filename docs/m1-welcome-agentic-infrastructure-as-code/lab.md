---
sidebar_position: 2
title: 'Lab: Prepare Your Agentic IaC Workspace'
---

# Lab — Prepare Your Agentic IaC Workspace

This lab verifies the small local toolset needed to begin the course. It does not start a workload, create a cluster, or apply infrastructure.

## Objectives

- Confirm the 7 GB local-first learner profile.
- Verify Git, Docker, Terraform, and OpenTofu.
- Inspect the learner lab repository.
- Choose a compatible coding agent for later labs.

## Prerequisites

- Git, Docker, Terraform, and OpenTofu are installed.
- Your Docker runtime is running.
- You have at least 7 GB RAM, four logical CPUs, and 20 GB of free disk.

## PART I - Get the learner labs

Clone the lab repository. This lab only reads files and checks tool versions.

```bash
git clone https://github.com/schoolofdevops/309-agentic-iac-labs.git
cd 309-agentic-iac-labs
```

[ Expected output ]

```text
Cloning into '309-agentic-iac-labs'...
```

Check that you are at the repository root before continuing.

## PART II - Run the local preflight

Run the preflight script.

```bash
./section-1/scripts/preflight.sh
```

[ Expected output ]

```text
Agentic IaC Section 1 preflight
Baseline: 7 GB RAM, 4 logical CPUs, 20 GB free disk

git version 2.55.0
Docker server 29.5.2
Terraform v1.14.8
OpenTofu v1.12.6
PASS     machine meets the 7 GB RAM course baseline
PASS     learner lab repository detected

PASS     preflight complete; choose any compatible coding agent for later labs.
```

Your version numbers can differ. The important result is the final `PASS` line. The script checks only your workstation and repository. It does not start anything.

## PART III - Inspect the project map

List the current lab areas.

```bash
find phase-0 section-1 -maxdepth 2 -type d | sort
```

[ Expected output ]

```text
phase-0
phase-0/p0-agent-terraform
phase-0/p1-local-cloud
section-1
section-1/scripts
section-1/tests
```

Observe the separation. `phase-0` contains internal feasibility fixtures.

`section-1` contains the learner preflight. Later sections add only the tools and project capability they need.

## PART IV - Choose your coding-agent path

Use any compatible coding agent in later labs: Codex, Claude Code, Goose, Cursor, GitHub Copilot, VS Code, or another agent with files and a terminal.

The lab checks evaluate repository evidence, not an agent transcript.

Create a local note with your choice.

```bash
printf '%s\n' 'Chosen coding agent: <replace with your tool>' > .agent-choice.txt
cat .agent-choice.txt
```

[ Expected output ]

```text
Chosen coding agent: <replace with your tool>
```

Replace the placeholder before moving on. This file is local to you and is not a graded course artifact.

## Troubleshooting

:::warning[Docker version check fails]

Start your Docker-compatible runtime and wait until it reports ready. Then run the preflight again. Do not start containers just to make this check pass.

:::

:::warning[The RAM check fails]

Close unneeded applications and confirm the machine has at least 7 GB installed RAM. This course is designed for that baseline; adding a larger lab profile is not the fix.

:::

:::warning[OpenTofu is missing]

Install OpenTofu before Section 2. Terraform and OpenTofu are both first-class paths in this course.

A validation result from one tool is not automatically evidence for the other.

:::

## Teardown

No runtime resources were created. Keep the cloned repository for the next lab. Remove only your local agent-choice note if you do not want it.

```bash
rm -f .agent-choice.txt
```

[ Expected output ]

```text
# no output
```

## Summary

You verified the supported local profile and the course safety boundary.

In Section 2, you will use your chosen agent to repair a deliberately broken Terraform module. The repair stays within a written task contract.
