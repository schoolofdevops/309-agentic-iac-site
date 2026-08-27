---
sidebar_position: 3
title: 'Operator Challenge: Choose the Reviewable Agent Run'
---

# Operator Challenge: Choose the Reviewable Agent Run

Two agents received the same Section 2 task contract. Both report that the Terraform repair is complete. You are the reviewer. Decide which run, if either, is acceptable.

## Candidate run A

```text
Summary: Removed the invalid reference with the smallest possible edit.

Changed files:
  section-2/starter/main.tf

Diff:
  - value = random_id.platform.hex
  + value = "platform-fixed"

Checks:
  terraform fmt -check
  exit 0

OpenTofu was not run because the diff is only one line.

Next action proposed:
  terraform apply -auto-approve
```

## Candidate run B

```text
Summary: Restored the missing resource and kept the required generated output.

Changed files:
  section-2/starter/main.tf

Diff:
  + resource "random_id" "platform" {
  +   byte_length = 4
  + }

Checks:
  terraform fmt -check
  exit 0
  terraform init -backend=false -input=false
  exit 0
  terraform validate -no-color
  Success! The configuration is valid.
  tofu fmt -check
  exit 0
  tofu init -backend=false -input=false
  exit 0; provider source rewrite warning recorded
  tofu validate -no-color
  Success! The configuration is valid.
  git diff --name-only
  section-2/starter/main.tf
  git diff --check
  exit 0

Stop: No apply, state, credential, delete, or destroy action ran.
```

## Your task

Write a short review that answers these questions:

1. Which evidence in each run is useful?
2. Which required evidence is missing?
3. Did either run satisfy the objective and work boundary?
4. Which claims are stronger than the evidence supports?
5. Which action must be rejected immediately?
6. What is the smallest safe next step for each candidate?
7. Can either run be approved as complete?

Do not create a file only for an automated validator. Write the review in your course notes or discuss it with your team.

## Acceptance criteria

Your review must distinguish all of these points:

- Candidate A changes fewer lines, but removes the required generated behaviour and uses formatting as if it proved semantics.
- Candidate A's proposed apply is outside the task and must be rejected.
- Candidate B preserves the required output, changes only the allowed file, and supplies every required check.
- Candidate B records the lock-source warning rather than treating a shared lock as compatibility proof.
- Candidate B is the acceptable run. It must stop at this checkpoint without apply.
- Candidate A must return to the last clean checkpoint before a new repair attempt.

## Review rubric

| Dimension | Strong answer |
|---|---|
| Objective | Checks the required resource behaviour, not only the absence of an error. |
| Scope | Compares the changed-file list with the one-file boundary. |
| Evidence | Separates format, initialization, validation, diff, and summary claims. |
| Cross-tool proof | Requires independent Terraform and OpenTofu results. |
| Safety | Rejects apply and preserves the no-credential, no-state boundary. |
| Recovery | Names the last trusted checkpoint and the smallest next action. |

<details>
<summary>Review the decision</summary>

Reject Candidate A. Its smaller diff removes required behaviour, its evidence is incomplete, and its apply proposal crosses the task boundary. Accept Candidate B as the repair candidate. Its diff and independent checks satisfy the contract, and it stops before apply.

</details>
