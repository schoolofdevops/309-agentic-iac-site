---
sidebar_position: 2
title: Environment
---

# Environment

This page takes you from a bare machine to a fully verified lab environment. Install in the order given,
then run the verification probe at the end. When every probe command passes, you are lab-ready. Every lab
in this course was validated against exactly this toolchain.

## The toolchain at a glance

The lab environment for this course is **local production AI workload platform environment**. You need these tools:

**Lab tools** (verified by the Phase-0 probe):

- **git** — probe: `git --version`
- **docker** — probe: `docker version --format '{{.Server.Version}}'`
- **terraform** — probe: `terraform version`
- **opentofu** — probe: `tofu version`
- **claude-code** — probe: `claude --version`
- **codex** — probe: `codex --version`
- **hermes** — probe: `hermes --version`
- **kubectl** — probe: `kubectl version --client`
- **kind** — probe: `kind version`
- **helm** — probe: `helm version --short`
- **argocd** — probe: `argocd version --client --short`

- **Spine:** `project/production-ai-workload-platform` (production AI workload platform, grow-in-place)

{/*
  The block above is filled by the scaffold from course.config lab.tools (name + purpose + version).
  Keep the tools list authoritative there — do NOT hardcode a domain toolchain in this template.
*/}

## Install order

Install in dependency order — the base runtime/platform first, everything that builds on it after. If a
tool has no dependency, order among those does not matter.

### macOS (Homebrew)

```bash
# git: add the exact install command for this OS
# docker: add the exact install command for this OS
# terraform: add the exact install command for this OS
# opentofu: add the exact install command for this OS
# claude-code: add the exact install command for this OS
# codex: add the exact install command for this OS
# hermes: add the exact install command for this OS
# kubectl: add the exact install command for this OS
# kind: add the exact install command for this OS
# helm: add the exact install command for this OS
# argocd: add the exact install command for this OS
```

### Linux — and Windows WSL2 (run inside your Ubuntu terminal)

Substitute `arm64` for `amd64` in any download URL if you are on an ARM machine.

```bash
# git: add the exact install command for this OS
# docker: add the exact install command for this OS
# terraform: add the exact install command for this OS
# opentofu: add the exact install command for this OS
# claude-code: add the exact install command for this OS
# codex: add the exact install command for this OS
# hermes: add the exact install command for this OS
# kubectl: add the exact install command for this OS
# kind: add the exact install command for this OS
# helm: add the exact install command for this OS
# argocd: add the exact install command for this OS
```

{/*
  AUTHORING: install_macos / install_linux come from the per-tool install recipes in course.config
  lab.tools. If a tool needs a GUI app (a runtime/VM manager, etc.), add a short "Step 0" section here
  with the exact preference toggles a learner must set, and a :::warning for the single most common
  misconfiguration (this is where the real learner-QA pain lives).
*/}

## Verify your setup

Paste the whole block into your lab terminal (from anywhere — no repo needed yet). Each line is the probe
for one required tool:

```bash
git --version
docker version --format '{{.Server.Version}}'
terraform version
tofu version
claude --version
codex --version
hermes --version
kubectl version --client
kind version
helm version --short
argocd version --client --short
```

Each probe must return without error and print a version. Compare against the expected-shape table the
scaffold generates from `lab.tools` (name → probe → expected output shape). If any probe fails, fix it
before continuing — the first module assumes all of them pass.

## Troubleshooting

These are the failures learners actually hit. Check here before asking for help.

:::warning[Editor / file-watcher: "too many open files" (ENOSPC / inotify)]

On Linux (and WSL2), running the site's dev server or any file-watching tool can exhaust the kernel's
inotify watch limit, failing with `ENOSPC: System limit for number of file watchers reached`. Raise it:

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

:::

:::warning[Environment creation fails with a cryptic timeout — check where you cloned]

If standing up the lab environment times out or hangs, the most common cause is a repo cloned **outside
a VM-shared path**. If your runtime/platform runs in a lightweight VM (common on macOS and Windows),
files are only shared into that VM from specific host paths — your home directory almost always, `/tmp`
and system paths often not. Move the repo under your home directory and retry. (See the clone warning on
the [Prerequisites](prerequisites.md) page.)

:::

:::warning[Cannot connect to the runtime socket]

If tools report they cannot connect to the platform/daemon socket (e.g. a "connection refused" or
"cannot connect to ... .sock"), the underlying runtime is not running or its VM is still starting. Start
it, wait for it to report ready, and re-run the probe. If a second, conflicting runtime is installed
(two daemons fighting over one socket), quit the one this course does not use.

:::

:::warning[macOS: a stale binary shadows your install]

An older copy in `/usr/local/bin` or a runtime's bundled shims (e.g. under `~/.rd/bin`) can shadow a tool
you just installed. Check with `which -a <tool>`. If the fresh install is not first, put its directory
first on `PATH` for your lab sessions (e.g. `export PATH="/opt/homebrew/bin:$PATH"` on Apple Silicon) and
add it to your shell rc file.

:::

{/*
  AUTHORING: keep the four gotchas above (they are learner-QA-proven and largely domain-agnostic).
  ADD any course-specific gotcha discovered during lab validation or learner QA here — this section is
  meant to grow.
*/}
