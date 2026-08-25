---
sidebar_position: 2
title: 'Lab: Make Your First Governed Agentic IaC Change'
---

# Lab — Make Your First Governed Agentic IaC Change

Repair one local Terraform configuration and prove the result. You will not create cloud resources.

## Objectives

- Inspect a bounded task contract.
- Repair the missing Terraform declaration.
- Validate with Terraform and OpenTofu.
- Review the diff and stop.

## PART I - Inspect the task

```bash
git clone https://github.com/schoolofdevops/309-agentic-iac-labs.git
cd 309-agentic-iac-labs/phase-0/p0-agent-terraform
cat task.md
```

[ Expected output ]

```text
Repair the Terraform configuration so terraform fmt -check and terraform validate pass.
Keep output.platform_name backed by random_id.platform.hex.
Do not run terraform apply.
```

## PART II - Repair the module

Open `fixtures/broken-module/main.tf`. Keep the output unchanged. Add the `hashicorp/random` provider and this resource.

```hcl
resource "random_id" "platform" {
  byte_length = 4
}
```

## PART III - Validate the repair

```bash
cd fixtures/broken-module
terraform fmt -check -no-color
terraform init -backend=false -input=false -no-color
terraform validate -no-color
tofu init -backend=false -input=false -no-color
tofu validate -no-color
```

[ Expected output ]

```text
Terraform has been successfully initialized!
Success! The configuration is valid.
OpenTofu has been successfully initialized!
Success! The configuration is valid.
```

`validate` checks local configuration. It does not run an apply.

## PART IV - Review the change

```bash
cd ../..
git diff -- fixtures/broken-module/main.tf
```

[ Expected output ]

```text
+resource "random_id" "platform" {
+  byte_length = 4
+}
```

Check that the output still uses `random_id.platform.hex`.

## Troubleshooting

If validation reports an undeclared `random_id`, check the provider and resource blocks in `main.tf`. If OpenTofu rewrites the lock file, record that compatibility result and do not copy it into the Terraform path without review.

## Teardown

No infrastructure was created. Remove only generated local files for a fresh rerun.

```bash
rm -rf fixtures/broken-module/.terraform
```
