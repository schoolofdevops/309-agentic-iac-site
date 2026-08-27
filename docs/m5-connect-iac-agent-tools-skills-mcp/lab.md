---
sidebar_position: 2
title: 'Lab: Connect Your IaC Agent to Tools, Skills, and MCP'
---

# Lab: Connect Your IaC Agent to Tools, Skills, and MCP

In this lab, you will review one provider-free Terraform fixture through three
capability routes. You will use the CLI for deterministic checks, a Skill for a
reusable procedure, and MCP for one approved context resource.

You will also decide whether two third-party capabilities should enter the
workflow. This is a review exercise. You will not create infrastructure.

## Objectives

- Run Terraform or OpenTofu checks through a fixed review contract.
- Examine the evidence produced by a controlled CLI runner.
- Build an Agent Skill with discovery, procedure, reference, script, and test
  layers.
- Inspect a local MCP resource exchange without using a model.
- Reject a Skill and server request that ask for broad authority.
- Record ownership, versions, hashes, permissions, tests, and revocation rules.
- Keep technical validation separate from human approval.

## Prerequisites

- Keep the learner labs repository from Section 4.
- Install Node.js 20 or later.
- Install Terraform 1.14 or OpenTofu 1.12.
- Install Git and use any text editor.
- Use a coding agent if you want the guided agent path.

The instructor demonstrates Codex. Claude Code, Goose, Cursor, Copilot, VS Code,
or another compatible coding agent can follow the same request and task. Manual
editing is also supported.

No model API key, cloud account, container, Kubernetes cluster, credential, or
network access is required by the lab checks.

## PART I - Read the capability request

### Confirm your working directory

Begin at the root of the labs repository.

```bash
pwd
```

[ Expected output ]

```text
/home/learner/agentic-iac-labs
```

Your path will be different. It should end at the root of your labs clone.

List the Section 5 files.

```bash
ls section-5
```

[ Expected output ]

```text
README.md  challenge  fixture  incoming  request.md  scripts  starter  task.md  tests
```

The `fixture` directory contains the IaC and approved queue context. The
`incoming` directory contains untrusted evidence. You will change only
`section-5/starter/`.

### Read the request and task

```bash
sed -n '1,160p' section-5/request.md
```

[ sample output ]

```text
# Capability request: review the queue module safely
```

```bash
sed -n '1,260p' section-5/task.md
```

[ sample output ]

```text
# Section 5 Capability Task

## Goal
```

Confirm the work boundary:

- treat `section-5/incoming/` as immutable evidence;
- never run a script from the incoming package;
- edit only `section-5/starter/`;
- allow format, backend-disabled init, and validate only;
- stop if the work needs network, credentials, plan, apply, destroy, or state.

## PART II - Run the CLI review by hand

The CLI is the portable execution path in this course. It is not automatically
safe. You must still control the executable, arguments, directory, environment,
timeout, and output.

### Read the fixed command contract

```bash
sed -n '1,240p' section-5/starter/runner/command-contract.json
```

[ sample output ]

```json
"shell": false,
"timeoutMs": 30000,
"allowedExecutables": ["terraform", "tofu"]
```

Observe the three allowed command arrays. The contract excludes `plan`,
`apply`, `destroy`, and `state`.

### Copy the fixture to a temporary directory

```bash
mkdir -p /tmp/agentic-iac-section-5
```

[ Expected output ]

```text
```

```bash
cp section-5/fixture/main.tf /tmp/agentic-iac-section-5/main.tf
```

[ Expected output ]

```text
```

```bash
cd /tmp/agentic-iac-section-5
```

[ Expected output ]

```text
```

### Run the approved checks

Check the file format.

```bash
terraform fmt -check -diff main.tf
```

[ Expected output ]

```text
```

No output and exit code zero means the file is already formatted.

Initialize without a backend.

```bash
terraform init -backend=false -input=false -no-color
```

[ sample output ]

```text
Initializing provider plugins...

Terraform has been successfully initialized!
```

Validate the configuration.

```bash
terraform validate -no-color
```

[ Expected output ]

```text
Success! The configuration is valid.
```

If you use OpenTofu, run the same commands with `tofu` instead of `terraform`.

Return to the labs repository.

```bash
cd -
```

[ sample output ]

```text
/home/learner/agentic-iac-labs
```

These results prove that this provider-free fixture is formatted and valid.
They do not prove provider lock compatibility, a safe plan, cloud permissions,
or approval to deploy.

## PART III - Inspect the Skill layers

An Agent Skill packages a reusable procedure. It does not add permissions by
itself.

### Read the discovery layer

```bash
sed -n '1,120p' section-5/starter/skills/terraform-review/SKILL.md
```

[ sample output ]

```text
---
name: terraform-review
description: Review the provider-free queue fixture with Terraform or OpenTofu.
---
```

The starter stops at discovery. It has no complete procedure, reference,
runner, test, owner, version, compatibility note, or stop conditions.

### Understand progressive disclosure

A complete Skill uses three useful layers:

1. **Discovery metadata** tells the agent when the Skill may be relevant.
2. **The `SKILL.md` body** gives the procedure after the Skill is selected.
3. **References and scripts** are loaded or run only when the procedure needs
   them.

This reduces context use because the agent does not need every detail during
discovery. Client behavior can vary. The Skill still needs tests and an
external permission boundary.

## PART IV - Inspect the MCP resource exchange

The local MCP server provides context only. A model-free probe lets you inspect
the exact protocol behavior.

```bash
node section-5/starter/mcp/probe.mjs
```

[ Expected output ]

```text
MCP resource probe: PASS
Protocol: 2026-07-28
Resources: 1
Resource bytes: 501
Resource SHA256: b018afe8e5e872e9584430693727effb5503fdbd7ee12a93a286851da86b7af0
Tools capability: absent
Unknown resource URI: rejected with -32602
Missing request metadata: rejected with -32602
Unknown method: rejected with -32601
```

The probe checks `server/discover`, `resources/list`, and `resources/read`. It
also proves that the server declares no tools or prompts capability and rejects
bad requests.

The protocol exchange is separate from admission policy. MCP metadata and
server identity are claims from the server. They do not configure operating
system permissions, prove user consent, authenticate an operator, or approve an
infrastructure change.

## PART V - Review the unsafe admission request

### Read the incoming Skill without running it

```bash
sed -n '1,180p' section-5/incoming/skills/repository-operator/SKILL.md
```

[ sample output ]

```text
allowed-tools: Bash(*) Write(*) Read(*)
```

The Skill asks for repository-wide writes, shell execution, network,
credentials, and Terraform apply. Its `allowed-tools` field is metadata. It is
not a portable operating-system permission boundary.

Read its script as text. Do not execute it.

```bash
sed -n '1,120p' section-5/incoming/skills/repository-operator/scripts/run.sh
```

[ sample output ]

```text
# IMMUTABLE UNSAFE EVIDENCE. DO NOT RUN.
```

### Read the incoming server request

```bash
sed -n '1,240p' section-5/incoming/server-admission-request.json
```

[ sample output ]

```json
"args": ["-y", "@third-party/anywhere-mcp@latest"],
"packagePinned": false
```

This JSON is a course admission-control artifact. It is not an MCP-standard
manifest. Reject the request because startup is unpinned, requested authority
is broad, and mutating tools are labeled read-only.

### Run the initial course gate

```bash
node section-5/scripts/check-capability-pack.mjs section-5/starter section-5/incoming
```

[ Expected output ]

```text
Capability pack: NEEDS WORK (5 capability problems found)
- skills/terraform-review/SKILL.md [skill.procedure]: Complete the reviewed procedure, command reference, deterministic runner, tests, owner, version, compatibility, and stop conditions before admission.
- admission/decision.json [incoming-skill.decision]: Reject the incoming Skill; it requests broad writes, shell execution, network, credentials, and apply authority.
- admission/decision.json [incoming-server.decision]: Reject the incoming server request; do not admit a capability because it labels itself read-only.
- admission/decision.json [incoming-server.reasons]: Record the unpinned startup, broad filesystem/network/secret authority, and mutating tools mislabeled read-only.
- admission/decision.json [metadata.enforcement]: Treat Skill metadata, MCP annotations, and server identity as review inputs; enforce authority in the runner, operating system, and human approval boundary.
```

This failure is expected. The five findings concern procedure completeness and
admission.

## PART VI - Build the bounded capability pack

### Instructor path with Codex

The instructor demonstrates Codex once.

```bash
codex
```

[ sample output ]

```text
OpenAI Codex
```

The startup text depends on your installed version.

Give it this task:

```text
Read section-5/request.md and section-5/task.md. Work only in
section-5/starter/. Never run anything under section-5/incoming/. Build the
bounded Skill, runner, tests, trust record, and admission decision. Run the
course validator and stop before plan, apply, destroy, state, network, secrets,
or deployment. Show me the diff and evidence for review.
```

Review the proposed diff before accepting it. A compatible coding agent can use
the same text. The required files and validator do not depend on Codex.

### Manual editing path

If you work manually, complete these artifacts:

1. Add owner, version, compatibility, procedure, outputs, and stop conditions
   to `SKILL.md`.
2. Add the fixed command reference.
3. Add a runner with fixed arrays, no shell, a temporary directory, a timeout,
   output redaction, and a new evidence JSON file.
4. Add tests for rejection, redaction, both engines, hashes, and decisions.
5. Add a trust record with hashes, permissions, ownership, and revocation.
6. Admit only the bounded local capabilities and reject both incoming requests.

Do not type a long runner from a slide or video. If you need recovery after
trying the exercise, save your diff and restore only the reviewed starter from
the preserved candidate commit:

```bash
git diff -- section-5/starter
```

[ sample output ]

```text
diff --git a/section-5/starter/...
```

Save this output or commit your work if you want to return to it.

```bash
git fetch origin section5-tools-skills-mcp-candidate
```

[ sample output ]

```text
From https://github.com/schoolofdevops/309-agentic-iac-labs
 * branch            section5-tools-skills-mcp-candidate -> FETCH_HEAD
```

```bash
git restore --source=cd89867c8401fc1a7f6ddcef56f0aa410d0acbc8 -- section-5/starter
```

[ Expected output ]

```text
```

The recovery replaces only the `section-5/starter/` exercise workspace. It does
not run the incoming package.

## PART VII - Run the Skill and read its evidence

### Run the Skill tests

```bash
node --test section-5/starter/skills/terraform-review/tests/review-iac.test.mjs
```

[ sample output ]

```text
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

### Run the controlled review

```bash
node section-5/starter/skills/terraform-review/scripts/review-iac.mjs --engine terraform --evidence terraform-review.json
```

[ Expected output ]

```text
IaC review: PASS (terraform)
Evidence: section-5/starter/evidence/terraform-review.json
```

Read the evidence.

```bash
sed -n '1,260p' section-5/starter/evidence/terraform-review.json
```

[ sample output ]

```json
"engine": "terraform",
"executionWorkingDirectory": "isolated-temporary-copy",
"shell": false,
"timeoutMs": 30000,
```

Examine the exact argument arrays, duration, exit code, timeout state, and
separate standard output and standard error.

### Check trust and admission

```bash
sed -n '1,300p' section-5/starter/admission/trust.json
```

[ sample output ]

```text
"defaultDecision": "deny",
"networkAllowed": false,
```

```bash
sed -n '1,260p' section-5/starter/admission/decision.json
```

[ sample output ]

```text
"capability": "incoming-skill:repository-operator",
"decision": "reject",
```

The trust record pins what was reviewed. Operating-system permissions must
still enforce runtime access. A user or platform must still establish identity
and consent. A human must still approve any later infrastructure change.

### Run the final course gate

```bash
node section-5/scripts/check-capability-pack.mjs section-5/starter section-5/incoming
```

[ Expected output ]

```text
Capability pack: PASS (0 capability problems found)
CLI, Skill, MCP resource, admission, and enforcement boundaries are valid.
```

This PASS proves that the local artifacts meet this course contract. It does
not prove that a future package with similar metadata is safe.

## Checkpoint

You now have:

- one controlled CLI evidence record;
- a complete, tested `terraform-review` Skill;
- a resources-only MCP exchange pinned to revision `2026-07-28`;
- a trust record with artifact hashes and revocation conditions;
- an admission decision that rejects both broad incoming requests;
- human approval still required.

Continue with the [capability admission challenge](./operator-challenge.md).

## Teardown

Remove the temporary CLI directory.

```bash
rm -rf /tmp/agentic-iac-section-5
```

[ Expected output ]

```text
```

Remove the generated evidence file if you want to repeat the lab with the same
name.

```bash
rm section-5/starter/evidence/terraform-review.json
```

[ Expected output ]

```text
```

Do not remove or change anything under `section-5/incoming/`.

## Summary

You used the CLI for bounded execution, a Skill for a reusable procedure, and
MCP for one read-only context resource. You kept admission, runtime permissions,
identity, consent, human approval, and technical validation as separate
controls.
