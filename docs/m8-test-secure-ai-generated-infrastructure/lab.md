---
sidebar_position: 2
title: Lab - Test and Secure a Generated Terraform Change
description: Repair a false-green Terraform change and prove it with contract, lint, security, policy, FinOps, redaction, and adversarial evidence.
---

# Lab: Test and Secure a Generated Terraform Change

In this lab, you will review Terraform that looks healthy at first. It formats,
validates, and produces a plan. It still contains public access, wildcard IAM,
missing ownership, an unnecessary Elastic IP, missing queue encryption, and a
policy that reads the wrong plan field.

You will run one plan-only evidence pipeline, repair the smallest allowed set
of files, and compare Terraform with OpenTofu. The pipeline never applies or
destroys infrastructure. A passing result means ready for human plan review.
It does not mean ready to merge or apply.

Begin with the
[platform request](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-8/request.md)
and
[portable task](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-8/task.md).

## Objectives

You will:

- separate format, validation, tests, plan, lint, security, policy, cost,
  redaction, and agent-safety evidence;
- expose a policy false green with a Rego unit test;
- repair public access, encryption, IAM scope, ownership, and resource count;
- bind the decision to exact source, evaluator, plan, lock, and tool evidence;
- compare Terraform and OpenTofu without sharing their working directories;
- keep pipeline acceptance separate from human approval and environment work.

## Prerequisites

You need:

- the learner labs repository used in Section 7;
- Terraform 1.14, OpenTofu 1.12, TFLint 0.64, Trivy 0.72, OPA 1.19,
  Conftest 0.69, Node.js 20 or later, and Git;
- normal internet access when a provider, TFLint plugin, or Trivy check bundle
  is not already cached;
- about 15 minutes after the tools are installed;
- one coding agent only if you want the guided agent path.

The measured Terraform run peaked at 690.6 MiB. The measured OpenTofu run
peaked at 707.3 MiB. If your machine has less than the 7 GB reference profile,
continue unless a tool reports a real failure.

No Docker service, Kubernetes cluster, cloud account, real cloud credential,
model API key, GPU, remote backend, paid cost query, apply, or destroy is
required.

## PART I - Inspect the Change Before Running It

### Confirm your location

Begin at the root of your labs repository.

```bash
pwd
```

[ sample output ]

```text
/Users/learner/309-agentic-iac-labs
```

Your path will be different. It should be the root of the learner labs clone.

List the Section 8 files.

```bash
command ls -1 section-8
```

[ Expected output ]

```text
README.md
adversarial
challenge
fixtures
policy
request.md
scanner
scripts
starter
task.md
tests
```

### Read the request and task

```bash
sed -n '1,180p' section-8/request.md
```

[ Expected output ]

```text
# Request: prove a generated infrastructure change is safe to review

The platform team received a generated Terraform foundation change. Build one
repeatable validation pipeline that identifies configuration, contract, lint,
security, policy, cost, evidence-redaction, and agent-safety failures before a
person reviews the plan.

The final result must remain plan-only and must bind every finding to the exact
source and rendered plan.
```

```bash
sed -n '1,260p' section-8/task.md
```

[ sample output ]

```text
# Section 8 task contract

Repair the seeded foundation and its faulty plan policy until all ten evidence
gates pass:

1. format;
2. validation;
3. Terraform contract tests;
4. rendered-plan shape;
5. lint;
6. security scanning;
7. tested plan policy;
8. static cost and FinOps rules;
9. log and evidence redaction;
10. adversarial agent safety.
```

The task permits changes only to the learner-owned Terraform and policy files
named later in this lab. It permits no environment operation.

### Inspect the generated Terraform

```bash
sed -n '1,280p' section-8/starter/main.tf
```

[ sample output ]

```hcl
variable "unused_environment" {
  type    = string
  default = "dev"
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
```

Before running a tool, look for these signals:

- four S3 public-access controls are false;
- the S3 bucket and SQS queue have empty Owner tags;
- the queue does not enable managed encryption;
- the IAM actions and resources are wildcards;
- an Elastic IP is present but no workload uses it;
- one variable is declared but never used.

This prediction gives you a review baseline. A scanner result should confirm
or challenge your reading. It should not replace it.

### Inspect the policy and its test

```bash
sed -n '1,220p' section-8/policy/public_access.rego
```

[ Expected output ]

```rego
package main

import rego.v1

deny contains message if {
  some resource in input.resource_changes
  resource.type == "aws_s3_bucket_public_access_block"
  resource.change.after.acl == "public-read"
  message := sprintf("%s permits public access", [resource.address])
}
```

```bash
sed -n '1,220p' section-8/policy/public_access_test.rego
```

[ Expected output ]

```rego
package main_test

import rego.v1
import data.main.deny

test_denies_public_access_controls if {
  result := deny with input as {
    "resource_changes": [{
      "address": "aws_s3_bucket_public_access_block.artifacts",
      "type": "aws_s3_bucket_public_access_block",
      "change": {"after": {"block_public_acls": false}}
    }]
  }
  count(result) == 1
}
```

The Terraform plan field is `block_public_acls`. The policy reads `acl`.
Conftest may report PASS because the rule never reaches the real value. The
unit test should expose this mismatch.

## PART II - Run the False-Green Baseline

### Check the tools

Run the version command for each required tool.

```bash
terraform version
```

[ sample output ]

```text
Terraform v1.14.8
```

```bash
tofu version
```

[ sample output ]

```text
OpenTofu v1.12.6
```

```bash
tflint --version
```

[ sample output ]

```text
TFLint version 0.64.0
```

```bash
trivy --version
```

[ sample output ]

```text
Version: 0.72.0
```

```bash
opa version
```

[ sample output ]

```text
Version: 1.19.0
```

```bash
conftest --version
```

[ sample output ]

```text
Conftest: dev
```

If a command is missing, install that tool before continuing. The Conftest
binary may print `Conftest: dev` even when the package manager reports 0.69.0.
The evidence keeps the literal command output.

### Read the execution boundary

```bash
sed -n '1,320p' section-8/scripts/run-evidence-pipeline.mjs
```

[ sample output ]

```javascript
const engine = process.argv[2];
if (!['terraform', 'tofu'].includes(engine)) {
  throw new Error('engine must be terraform or tofu');
}
// Continue reading the fixed command arrays and ten evidence gates.
```

Confirm these controls in plain language:

- only `terraform` or `tofu` is accepted;
- the source must be the Section 8 directory;
- the output must be a new directory with the Section 8 prefix;
- every tool receives a fixed argument array with no shell;
- planning uses `-refresh=false` and a local saved plan;
- the evaluator accepts only the starter or repaired plan shape;
- scanner ignores must match the reviewed suppression registry;
- logs are redacted before they enter the evidence report;
- no apply, destroy, remote backend, or cloud command exists.

### Run the baseline with Terraform

The command returns a non-zero exit because rejection is the correct result.

```bash
node section-8/scripts/run-evidence-pipeline.mjs terraform section-8 /tmp/agentic-iac-section-8-baseline
```

[ Expected output ]

```text
Section 8 evidence pipeline: REJECTED
PASS format: exit 0
PASS validation: init 0; validate 0
FAIL contract: exit 1
PASS plan: plan 0; show 0; shape starter
FAIL lint: exit 2
FAIL security: trivy findings 5; wildcard true; suppressions true; ignore registry true
FAIL policy: policy tests 2; conftest 0
FAIL cost: resource count 6 exceeds 5; unapproved elastic IP; aws_s3_bucket.artifacts missing Owner tag; aws_sqs_queue.jobs missing Owner tag
PASS redaction: 1 value redacted
PASS agent_safety: 6/6 attack classes rejected
Evidence: /tmp/agentic-iac-section-8-baseline/evidence-report.json
```

### Read the evidence report

```bash
sed -n '1,320p' /tmp/agentic-iac-section-8-baseline/evidence-report.json
```

[ sample output ]

```json
{
  "schema": "agentic-iac-section-8-evidence/v1",
  "engine": "terraform",
  "decision": "REJECTED",
  "gates": {
    "format": {"status": "PASS", "detail": "exit 0"},
    "contract": {"status": "FAIL", "detail": "exit 1"},
    "policy": {"status": "FAIL", "detail": "policy tests 2; conftest 0"}
  }
}
```

Examine these fields:

- `tool_versions` records the tools that actually ran;
- `source_sha256` binds the result to the evaluated Terraform, policy,
  scanner, adversarial, and fixture inputs;
- `evaluator_sha256` binds the result to the runner code;
- `plan_sha256` binds policy and review evidence to the rendered plan;
- `commands` records fixed arguments, exits, durations, and measured memory;
- `conftest_exit` is 0 while `policy_test_exit` is 2;
- `secret_values_stored` is 0;
- `human_boundary` still requires a person to decide what happens next.

The policy result is the key observation. Conftest alone is green. The tested
policy gate is red. A policy engine cannot prove a rule that looks at the wrong
field.

## PART III - Repair the Candidate

### Instructor path with Codex

The instructor demonstrates Codex once from the labs repository.

```bash
codex
```

[ sample output ]

```text
Codex opens an interactive session in the current repository.
```

Give Codex this task:

```text
Read section-8/request.md and section-8/task.md. Inspect the current Terraform,
policy, tests, scanner configuration, and adversarial fixture. Run the Section
8 evidence pipeline with Terraform in a new named /tmp directory. Edit only
section-8/starter/main.tf, section-8/policy/public_access.rego, and
section-8/policy/public_access_test.rego. Remove the unused variable and
unneeded Elastic IP. Add non-empty Owner tags, enable every S3 public-access
control and SQS managed encryption, and replace wildcard IAM access with only
the required S3 object and SQS message actions on exact resources. Repair and
unit-test the policy against the real four rendered-plan fields. Preserve the
runner, task, scanner records, fixtures, and adversarial evidence. Do not run
apply, destroy, state, remote backend, cloud API, download, or approval action.
Show the diff, run the pipeline in a new output directory, and stop when it is
ready for my review.
```

Review the proposed diff before accepting it. Claude Code, Goose, Cursor,
Copilot, VS Code, or another compatible coding agent can use the same task.
Manual editing is also supported.

### Manual editing path

If you edit manually, make these changes:

1. Remove `unused_environment` and `aws_eip.unused`.
2. Set both Owner tags to `course-platform-team`.
3. Set all four S3 public-access controls to true.
4. Set `sqs_managed_sse_enabled = true`.
5. Permit only `s3:GetObject`, `s3:PutObject`, `sqs:DeleteMessage`,
   `sqs:ReceiveMessage`, and `sqs:SendMessage`.
6. Scope resources to the bucket ARN, bucket object ARN, and queue ARN.
7. Test all four real public-access fields in Rego.

Inspect only the learner-owned diff.

```bash
git diff -- section-8/starter/main.tf section-8/policy/public_access.rego section-8/policy/public_access_test.rego
```

[ sample output ]

```diff
diff --git a/section-8/starter/main.tf b/section-8/starter/main.tf
-  block_public_acls = false
+  block_public_acls = true
```

### Optional recovery copy

Try the repair first. If you need the reviewed candidate, save your work, then
fetch the pinned recovery branch.

```bash
git fetch origin section8-test-secure-iac-candidate
```

[ sample output ]

```text
From https://github.com/schoolofdevops/309-agentic-iac-labs
 * branch            section8-test-secure-iac-candidate -> FETCH_HEAD
```

Restore only the three learner-owned files.

```bash
git restore --source=16f5ecd41fe1804070e3b4c70e4969b004add02b -- section-8/starter/main.tf section-8/policy/public_access.rego section-8/policy/public_access_test.rego
```

[ Expected output ]

```text
(no output)
```

Review the recovered changes before running the evaluator.

```bash
git diff -- section-8/starter/main.tf section-8/policy/public_access.rego section-8/policy/public_access_test.rego
```

[ sample output ]

```diff
diff --git a/section-8/starter/main.tf b/section-8/starter/main.tf
-  block_public_acls = false
+  block_public_acls = true
```

### Run the repaired pipeline

Use a new output directory. The baseline evidence remains unchanged for your
comparison.

```bash
node section-8/scripts/run-evidence-pipeline.mjs terraform section-8 /tmp/agentic-iac-section-8-repaired
```

[ Expected output ]

```text
Section 8 evidence pipeline: READY_FOR_HUMAN_REVIEW
PASS format: exit 0
PASS validation: init 0; validate 0
PASS contract: exit 0
PASS plan: plan 0; show 0; shape repaired
PASS lint: exit 0
PASS security: trivy findings 0; wildcard false; suppressions true; ignore registry true
PASS policy: policy tests 0; conftest 0
PASS cost: static limits pass
PASS redaction: 1 value redacted
PASS agent_safety: 6/6 attack classes rejected
Evidence: /tmp/agentic-iac-section-8-repaired/evidence-report.json
```

Read the repaired evidence.

```bash
sed -n '1,320p' /tmp/agentic-iac-section-8-repaired/evidence-report.json
```

[ sample output ]

```json
{
  "engine": "terraform",
  "decision": "READY_FOR_HUMAN_REVIEW",
  "observations": {
    "plan_resource_count": 5,
    "plan_shape": "repaired",
    "trivy_findings": 0,
    "wildcard_policy": false,
    "ignore_registry_consistent": true
  }
}
```

The plan should contain exactly five managed addresses and no replacement. The
security report should contain zero unsuppressed findings and no wildcard IAM.
Both the Rego test and Conftest should exit 0.

## PART IV - Review Suppressions as Code

Read the scanner ignore file.

```bash
sed -n '1,120p' section-8/scanner/trivy.ignore
```

[ Expected output ]

```text
AWS-0089
AWS-0090
AWS-0132
```

Now read the reviewed suppression registry.

```bash
sed -n '1,260p' section-8/scanner/suppressions.json
```

[ sample output ]

```json
{
  "suppressions": [
    {
      "rule_id": "AWS-0089",
      "scope": "course plan-only artifact bucket",
      "owner": "course-platform-team",
      "expires": "2027-08-28"
    }
  ]
}
```

Each ignored rule needs the same rule ID in both files. The registry also
requires scope, owner, reason, future expiry, and compensating evidence. Adding
an ignore line alone makes the security gate fail.

The three existing suppressions cover access logging, versioning, and a
customer-managed KMS key in this disposable plan-only fixture. Public access,
wildcard IAM, and queue encryption are not suppressed.

## PART V - Compare the OpenTofu Evidence

Run the same repaired source with OpenTofu in another working directory.

```bash
node section-8/scripts/run-evidence-pipeline.mjs tofu section-8 /tmp/agentic-iac-section-8-tofu
```

[ Expected output ]

```text
Section 8 evidence pipeline: READY_FOR_HUMAN_REVIEW
PASS format: exit 0
PASS validation: init 0; validate 0
PASS contract: exit 0
PASS plan: plan 0; show 0; shape repaired
PASS lint: exit 0
PASS security: trivy findings 0; wildcard false; suppressions true; ignore registry true
PASS policy: policy tests 0; conftest 0
PASS cost: static limits pass
PASS redaction: 1 value redacted
PASS agent_safety: 6/6 attack classes rejected
Evidence: /tmp/agentic-iac-section-8-tofu/evidence-report.json
```

Read the OpenTofu evidence.

```bash
sed -n '1,320p' /tmp/agentic-iac-section-8-tofu/evidence-report.json
```

[ sample output ]

```json
{
  "engine": "tofu",
  "decision": "READY_FOR_HUMAN_REVIEW",
  "lockfile": {
    "rewritten": true
  },
  "observations": {
    "plan_resource_count": 5,
    "plan_shape": "repaired"
  }
}
```

Terraform keeps the committed Terraform lock entry. OpenTofu rewrites the
provider source and hashes inside its disposable copy because the OpenTofu
provider build is not byte-for-byte identical. The two rendered plan hashes
also differ because engine metadata and timestamps differ. Compare the five
managed addresses and gate results instead of expecting identical JSON bytes.

## Checkpoint

Your Section 8 checkpoint contains:

- one preserved rejected baseline;
- one five-resource repaired Terraform plan;
- ten green, independent evidence gates;
- a tested plan policy with no false green;
- zero unsuppressed scanner findings and no wildcard IAM;
- reviewed suppression records that match the ignore file;
- a redacted evidence log with source, evaluator, plan, lock, and tool identity;
- a Terraform and OpenTofu compatibility observation;
- a decision that stops at human plan review.

Continue with the [independent evidence review challenge](./operator-challenge).

## Teardown

Remove only the three marked Section 8 evidence directories.

```bash
node section-8/scripts/cleanup-run.mjs /tmp/agentic-iac-section-8-baseline
```

[ Expected output ]

```text
Removed Section 8 run: /tmp/agentic-iac-section-8-baseline
```

```bash
node section-8/scripts/cleanup-run.mjs /tmp/agentic-iac-section-8-repaired
```

[ Expected output ]

```text
Removed Section 8 run: /tmp/agentic-iac-section-8-repaired
```

```bash
node section-8/scripts/cleanup-run.mjs /tmp/agentic-iac-section-8-tofu
```

[ Expected output ]

```text
Removed Section 8 run: /tmp/agentic-iac-section-8-tofu
```

The cleanup script rejects broad paths, unmarked directories, and symbolic
links. No local service, state, plan process, or background resource remains.

## Troubleshooting

### The output directory already exists

The runner never overwrites evidence. Use the cleanup script for that exact
marked directory, or choose a new Section 8 output name.

### Provider initialization cannot reach the registry

Normal dependency access is required even when the provider binary is cached.
Restore network access and rerun with a new output directory. Do not replace
the fixture with a real cloud endpoint.

### TFLint cannot initialize its plugin

Run `tflint --init` from `section-8/starter`, then return to the repository root
and use a new output directory.

### Conftest is green but the policy gate is red

This is the intended starter failure. Read the OPA unit-test exit in the
evidence report. Repair the policy field and its unit test before trusting the
Conftest result.
