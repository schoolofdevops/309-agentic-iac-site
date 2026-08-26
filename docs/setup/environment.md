---
sidebar_position: 2
title: Environment
---

# Environment

Install tools when the course first uses them. You do not need the complete toolchain for Section 1.

## Tool progression

| Tool | First needed | Check command |
|---|---|---|
| Git and a Bash-compatible shell | Section 1 | `git --version` |
| One compatible coding agent | Section 2 | Use the version command supplied by that agent. |
| Terraform | Section 2 | `terraform version` |
| OpenTofu | Section 2 | `tofu version` |
| Docker-compatible runtime | Later local runtime labs | `docker version` |
| kubectl and Kind | Kubernetes section | `kubectl version --client` and `kind version` |
| Helm | Kubernetes section | `helm version --short` |
| Argo CD CLI | GitOps section | `argocd version --client --short` |
| Hermes | Hermes operations section | `hermes --version` |

The instructor demonstrates Codex. The coding-agent labs use portable task briefs and command-line evidence, so you may use Codex, Claude Code, Goose, Cursor, GitHub Copilot, VS Code, or another compatible agent. Hermes is the named tool in the Hermes section.

You need one coding agent, not every coding agent.

## Run the Section 1 report

From the learner repository root, run:

```bash
./section-1/scripts/preflight.sh
```

The report shows:

- detected RAM, CPU, and free disk;
- available infrastructure tools;
- coding agents and editor interfaces found on `PATH`;
- tools that are installed but not ready;
- tools that are not found.

The report is discovery, not an admission test. A lower system value or a missing optional agent prints a warning and allows you to continue with Section 1.

## What to install before Section 2

Before the Terraform repair, prepare:

1. Git;
2. Terraform;
3. OpenTofu;
4. one compatible coding agent.

Run the preflight again after installing a tool. Confirm that its row changes to `AVAILABLE`.

## Troubleshooting

### Docker reports NOT READY

The Docker command exists, but the runtime service is not responding. Section 1 does not use containers, so you may continue. Start the runtime before a later lab that requires it.

### A tool is installed but reports NOT FOUND

Open a new terminal and run:

```bash
command -v TOOL_NAME
```

Replace `TOOL_NAME` with the command, such as `terraform` or `codex`. If the command prints nothing, add the tool's installation directory to your `PATH`.

### The machine is below the reference profile

Continue with Section 1. Before a later container lab:

- close unused applications;
- run only the profile named by the lab;
- clean up that profile before starting another one;
- keep enough disk space for the images used by that lab.
