---
sidebar_position: 2
title: 'Lab: Build Your First IaC Change with an AI Coding Agent'
---

# Lab: Build Your First IaC Change with an AI Coding Agent

In this lab, you will give Codex one bounded Terraform repair. You will inspect the proposed change, validate it independently with Terraform and OpenTofu, and stop before apply.

## Objectives

- Reproduce the current Terraform failure.
- Give a coding agent a portable task contract.
- Confirm that only the allowed file changed.
- Validate the repair with Terraform and OpenTofu.
- Record the lock-file boundary and stop without applying infrastructure.

## Prerequisites

- Complete Section 1 and keep the learner repository.
- Install Terraform, OpenTofu, Git, and one compatible coding agent.
- The instructor demonstrates Codex. Another compatible agent can receive the same `section-2/task.md` contract.
- Allow registry access for Terraform and OpenTofu provider initialization.

This lab starts no container and applies no infrastructure. The 7 GB course profile is tested guidance, not an admission check for this repair.

## PART I - Inspect the task and starting state

Continue in the learner repository from Section 1. Check your current directory.

```bash
pwd
```

[ Expected output ]

```text
/home/learner/309-agentic-iac-labs
```

Your path will be different. It should end with `309-agentic-iac-labs`.
If you opened a new terminal, change to the directory where you cloned the
learner repository, then run `pwd` again.

Check the current Git state before an agent changes anything.

```bash
git status
```

[ Expected output ]

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Read the complete repair contract.

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

Observe the exact boundary. The agent may edit only `section-2/starter/main.tf`.
It may format, initialize without a backend, and validate.
It must not apply, use state commands, request credentials, delete, destroy, or edit another file.

Read the broken Terraform file.

```bash
sed -n '1,120p' section-2/starter/main.tf
```

[ Expected output ]

```hcl
terraform {
  required_version = ">= 1.14.0"
}

output "platform_name" {
  value = random_id.platform.hex
}
```

The output reads `random_id.platform.hex`, but the resource is not declared.

## PART II - Reproduce the failure

Go to the starter and validate the current configuration before any initialization.

```bash
cd section-2/starter
terraform validate -no-color
```

[ Expected output ]

```text
Error: Reference to undeclared resource

  on main.tf line 6, in output "platform_name":
   6:   value = random_id.platform.hex

A managed resource "random_id" "platform" has not been declared in the root
module.
```

This failure is the starting evidence. No provider cache or lock file exists yet.
The error supports a missing-resource repair. It does not authorize changing the output or applying infrastructure.

Return to the repository root.

```bash
cd ../..
```

[ Expected output ]

```text
```

## PART III - Run the bounded Codex task

Run Codex against the repository and point it to the canonical task contract.

```bash
codex exec --ephemeral --sandbox workspace-write --cd "$(pwd)" --color never "Read and follow the canonical task contract at ./section-2/task.md exactly. Inspect the task contract and current files before any edit. Respect all scope, forbidden-action, validation, evidence, and stop conditions. Do not make edits outside the task's allowed file. Stop after the required validation; do not apply, use state commands, credentials, or destructive actions."
```

[ Captured output from the course validation run ]

```text
Implemented the smallest repair in main.tf:

+resource "random_id" "platform" {
+  byte_length = 4
+}

Validation status:

- terraform fmt -check passed.
- terraform init -backend=false -input=false failed because registry.terraform.io could not be resolved.
- Remaining Terraform and OpenTofu commands were not run due to the task's stop condition.
- No provider lock-file compatibility claim is being made.

Only the permitted file changed. No apply, state, credential, delete, or destructive command was used. Local validation needs an environment with Terraform Registry network access before it can be completed.
```

Your run may complete all six validations when the agent sandbox has registry access.
Agent wording also varies. It must explain the defect and change only the allowed file.
It must avoid apply. It must return the required evidence or stop honestly when its sandbox cannot complete a check.

:::warning[Codex reports a registry DNS error]

The committed course run observed `lookup registry.terraform.io: no such host` inside the Codex workspace sandbox.
The agent stopped instead of bypassing its boundary. It did not run the remaining Terraform or OpenTofu commands.
Continue with the host-side validation in PART V. Your terminal may have the registry access that the agent sandbox lacks.

:::

## PART IV - Review the proposed change

Inspect the exact Terraform diff.

```bash
git diff HEAD -- section-2/starter/main.tf
```

[ Expected output ]

```diff
diff --git a/section-2/starter/main.tf b/section-2/starter/main.tf
index b3a1f5b..e062253 100644
--- a/section-2/starter/main.tf
+++ b/section-2/starter/main.tf
@@ -2,6 +2,10 @@ terraform {
   required_version = ">= 1.14.0"
 }
 
+resource "random_id" "platform" {
+  byte_length = 4
+}
+
 output "platform_name" {
   value = random_id.platform.hex
 }
```

The resource uses the address already referenced by the output. The change does not replace the output or add unrelated infrastructure.

Check which tracked file changed.

```bash
git diff --name-only HEAD
```

[ Expected output ]

```text
section-2/starter/main.tf
```

Stop here if another tracked file appears. Restore the task boundary before running more commands.

## PART V - Validate with Terraform

Go to the repaired module.

```bash
cd section-2/starter
```

[ Expected output ]

```text
```

Check Terraform formatting.

```bash
terraform fmt -check
```

[ Expected output ]

```text
```

A silent exit with status `0` means the file is formatted. It does not prove that references are valid.

Initialize the provider without connecting a backend.

```bash
terraform init -backend=false -input=false
```

[ Expected output ]

```text
Initializing provider plugins...
- Finding latest version of hashicorp/random...
- Installing hashicorp/random v3.9.0...
- Installed hashicorp/random v3.9.0 (signed by HashiCorp)
Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

Your compatible provider patch version may be newer. Backend initialization remains disabled.

Validate the repaired configuration.

```bash
terraform validate -no-color
```

[ Expected output ]

```text
Success! The configuration is valid.
```

Terraform can now resolve the resource reference. This is configuration validation, not approval to apply.

## PART VI - Validate with OpenTofu

Check the same file with OpenTofu formatting.

```bash
tofu fmt -check
```

[ Expected output ]

```text
```

Initialize OpenTofu without a backend.

```bash
tofu init -backend=false -input=false
```

[ Expected output ]

```text
Initializing provider plugins...
- Reusing previous version of hashicorp/random from the dependency lock file
- Installing hashicorp/random v3.9.0...
- Installed hashicorp/random v3.9.0 (signed, key ID 0C0AF313E5FD9F80)

Providers are signed by their developers.
If you'd like to know more about provider signing, you can read about it here:
https://opentofu.org/docs/cli/plugins/signing/

OpenTofu has made some changes to the provider dependency selections recorded
in the .terraform.lock.hcl file. Review those changes and commit them to your
version control system if they represent changes you intended to make.

Warning: Dependency lock file entries automatically updated
OpenTofu automatically rewrote some entries in your dependency lock file:
  - registry.terraform.io/hashicorp/random => registry.opentofu.org/hashicorp/random

The version selections were preserved, but the hashes were not because the
OpenTofu project's provider releases are not byte-for-byte identical.

OpenTofu has been successfully initialized!

You may now begin working with OpenTofu. Try running "tofu plan" to see
any changes that are required for your infrastructure. All OpenTofu commands
should now work.

If you ever set or change modules or backend configuration for OpenTofu,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

The provider version can differ. Record a source-rewrite warning if it appears.
The disposable fixture ignores its lock file. One shared lock does not prove Terraform/OpenTofu provider compatibility.

Validate with OpenTofu.

```bash
tofu validate -no-color
```

[ Expected output ]

```text
Success! The configuration is valid.
```

You now have independent success from both IaC engines.

## PART VII - Complete the evidence checkpoint

Return to the repository root.

```bash
cd ../..
```

[ Expected output ]

```text
```

Check the final working tree.

```bash
git status --short
```

[ Expected output ]

```text
 M section-2/starter/main.tf
```

The provider cache and disposable lock file are ignored, so the only tracked change is the repair.

Check the diff for whitespace errors.

```bash
git diff --check HEAD -- section-2/starter/main.tf
```

[ Expected output ]

```text
```

Your governed change record now contains the task contract and the one-file diff.
It also contains two format checks, two backend-disabled initializations, two successful validations, and any lock-source warning.
Stop here. Do not apply.

## Checkpoint

Confirm each statement before you continue:

- The defect was reproduced before the edit.
- Only `section-2/starter/main.tf` changed.
- Terraform formatting and validation passed.
- OpenTofu formatting and validation passed.
- Any lock-file rewrite warning was recorded.
- No apply, state, credential, delete, or destroy action ran.
- The repaired file remains available for review.

## Troubleshooting

:::warning[Terraform or OpenTofu is not installed]

Run the Section 1 preflight and install the missing CLI. You need both tools for the final checkpoint.
A missing optional coding agent does not block manual inspection. This lab requires one compatible coding agent for the repair run.

:::

:::warning[Provider initialization cannot reach the registry]

Check your host DNS and network access. Rerun the same backend-disabled initialization command.
Do not add credentials or change backend settings.
If only the agent sandbox is blocked, run the documented validation from your host terminal and record the boundary.

:::

:::warning[Another tracked file changed]

Stop the agent. Review `git diff --name-only HEAD` and preserve any pre-existing human work.
Remove only the agent's out-of-scope proposal. Resume from the last clean checkpoint with the one-file boundary repeated.

:::

:::warning[Validation still reports an undeclared resource]

Confirm that `main.tf` declares `resource "random_id" "platform"` and keeps the existing output reference. Do not change the output merely to silence the check.

:::

## Teardown

No infrastructure or container was created. Keep the repaired `main.tf` as your Section 2 checkpoint.
The local `.terraform` provider cache and `.terraform.lock.hcl` are ignored for this disposable exercise. They may remain until you finish the section.

## Summary

You gave Codex a bounded task and reviewed one proposed file change.
You validated it independently with Terraform and OpenTofu, recorded an honest sandbox limitation, and stopped without applying infrastructure.
