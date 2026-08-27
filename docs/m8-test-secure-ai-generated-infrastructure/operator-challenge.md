---
sidebar_position: 3
title: Operator Challenge - Choose the Reviewable IaC Evidence
description: Compare two generated Terraform candidates and reject false-green tests, unsafe plan actions, and unreviewed suppressions.
---

# Operator Challenge: Choose the Reviewable IaC Evidence

Two generated candidates answer the same infrastructure request. Both format
and validate. Both Terraform contract suites report PASS. Neither candidate
has been applied.

## Candidate A

| Evidence | Observation |
|---|---|
| Diff | 74 changed lines across Terraform, tests, scanner ignores, and policy |
| Plan | One S3 bucket replacement, four public-access controls set to false, and one IAM policy value known after apply |
| Security | PASS after three existing ignores and two new inline ignore IDs |
| Policy | Conftest PASS; no Rego unit-test result attached |
| Cost | No result attached |
| Provenance | Command names listed; source and plan hashes missing |
| Agent summary | All checks passed and the change is ready to apply |

## Candidate B

| Evidence | Observation |
|---|---|
| Diff | 23 changed lines across the allowed Terraform and policy files |
| Plan | Five creates, no replacements, and the approved managed addresses |
| Security | Zero unsuppressed findings; every ignore has a reviewed, owned, expiring suppression record |
| Policy | Rego unit tests and Conftest PASS against the attached plan |
| Cost | Five resources, no EIP, required Owner tags present |
| Provenance | Exact commands, exits, versions, source hash, evaluator hash, plan hash, redaction count, and adversarial results attached |
| Decision | Ready for human plan review; no environment operation approved |

## Your task

Write a short operator verdict that answers:

1. Which candidate, if either, is ready for human plan review?
2. Why do format, validation, and Terraform tests fail to make Candidate A
   safe?
3. Which plan actions require rejection or redesign?
4. Why is Candidate A's policy PASS a false-green risk?
5. What is wrong with its scanner ignores?
6. Which evidence is missing?
7. What does Candidate B prove, and what does it not prove?
8. What is the exact next human decision?

Separate plan facts, unknown values, policy coverage, suppression ownership,
provenance, and approval. Do not approve an apply, merge, accepted risk, or
production operation.

The learner repository contains a separate answer key. Complete your verdict
before opening it. Then compare your reasoning with:

```bash
sed -n '1,240p' section-8/challenge/answer-key.md
```
