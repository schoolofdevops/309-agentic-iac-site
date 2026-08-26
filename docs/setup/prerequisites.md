---
sidebar_position: 1
title: Prerequisites
---

# Prerequisites

This course is for DevOps, platform, SRE, cloud, infrastructure, software, and AI engineers who want to use coding agents with Infrastructure as Code.

## What you should already know

You should be able to:

- use a terminal and run documented commands;
- create a Git branch, inspect a diff, and make a commit;
- explain what a cloud resource and a container are at a high level.

You do not need previous experience with AI agents.

## Tested system profile

Every core lab runs locally unless the lab states otherwise.

| Requirement | Tested reference | When your machine has less |
|---|---|---|
| RAM | 7 GB | Continue. Close unused applications before container labs. |
| CPU | 4 logical CPUs | Continue. Runtime steps may take longer. |
| Free disk | 20 GB free | Continue with Section 1. Free space before downloading later container images. |
| OS | macOS 13+, Windows 10/11 with WSL2, or recent Linux | Use a Bash-compatible shell. |

The preflight reports these values but does not reject your machine. Section 1 focuses on the agent, the task boundary, and the infrastructure workflow. Later runtime labs tell you what they need before starting a workload.

Supported architectures are Apple Silicon (`arm64`) and Intel/AMD (`amd64`). Windows learners should run lab commands inside WSL2. Native PowerShell is not the documented lab shell.

## Get the learner repository

Clone the repository under your home directory.

```bash
git clone https://github.com/schoolofdevops/309-agentic-iac-labs.git
cd 309-agentic-iac-labs
```

Use `pwd` whenever you want to confirm your current directory. Lab commands normally run from the `309-agentic-iac-labs` repository root.

## Next step

Read [Environment](environment.md) to understand when each tool is needed. You may start Section 1 with system warnings or without a coding agent.
