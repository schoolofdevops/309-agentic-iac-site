---
sidebar_position: 3
title: 'Operator Challenge: Place Settings by Lifecycle'
---

# Operator Challenge: Place Settings by Lifecycle

The queue feature crosses several tools. Your task is to give every setting one primary lifecycle owner and explain why it belongs there.

Choose from these owners:

- Terraform
- Helm
- GitOps
- Application configuration
- Secret management

## Scenario

The asynchronous queue design is ready for review. The team must now decide where twelve settings belong before an agent writes implementation code.

Do not choose an owner by matching words in a setting name. Ask these questions:

- Who creates or changes it?
- What event starts the change?
- Who reviews it?
- What evidence shows the change is correct?
- Is it a resource, deploy-time input, promotion record, runtime behaviour, or secret value?

## Your task

Copy the following table into your course notes. For every setting, add:

1. one primary owner from the five choices;
2. a short lifecycle reason;
3. the event that starts a change;
4. one piece of review or validation evidence.

| # | Setting to place | Primary owner | Lifecycle reason | Change trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Create the queue and its dead-letter queue for each environment. |  |  |  |  |
| 2 | Set the queue message-retention period as part of the provisioned resource. |  |  |  |  |
| 3 | Create the access-policy resources that permit the API and worker to use the queue. |  |  |  |  |
| 4 | Set the worker replica count supplied to the deployed workload. |  |  |  |  |
| 5 | Supply the non-secret queue endpoint reference to the API and worker pods. |  |  |  |  |
| 6 | Promote an approved application chart and image revision from test to production. |  |  |  |  |
| 7 | Promote the reviewed production values revision after the test evidence passes. |  |  |  |  |
| 8 | Limit how many times application code retries a failed job. |  |  |  |  |
| 9 | Define allowed job-status transitions such as `queued` to `running`. |  |  |  |  |
| 10 | Define application idempotency behaviour for a repeated submission key. |  |  |  |  |
| 11 | Store and rotate the queue credential value used at runtime. |  |  |  |  |
| 12 | Store and rotate the encryption-key value used to protect queued data. |  |  |  |  |

## Review the boundaries

Use these questions after you complete the table:

- Which settings change when infrastructure is replaced?
- Which settings change when a workload is deployed?
- Which settings move between environments only after review?
- Which settings control runtime application behaviour?
- Which values must never appear in Terraform state or Git?
- Can a non-secret secret reference cross a repository boundary without moving the secret value?

The system that interprets a value is not always the system that controls its promotion lifecycle.
Also distinguish a secret reference, such as a secret name or path, from the secret value itself.

## Acceptance criteria

Your review is complete when:

- all twelve settings have exactly one primary owner;
- every choice includes lifecycle reasoning, not only a tool name;
- every row names a change trigger and useful evidence;
- secret values remain outside Terraform state, rendered manifests, Git, and command output;
- promotion and deploy-time configuration are treated as different lifecycles;
- human approval remains pending;
- no implementation code, apply, deployment, destroy, or state command is produced.

## Review rubric

| Dimension | Strong answer |
| --- | --- |
| Complete placement | Assigns one primary owner to every setting. |
| Lifecycle reasoning | Explains who creates, changes, reviews, or rotates the item. |
| Change trigger | Names a concrete event that starts each change. |
| Evidence | Chooses evidence that matches the claimed lifecycle. |
| Data safety | Separates non-secret references from reusable secret values. |
| Boundaries | Distinguishes resource, deployment, promotion, runtime, and secret lifecycles. |

## Checkpoint

Explain two of your placements to another learner or reviewer. For each one, state why a nearby alternative is weaker.

Keep your completed table as review evidence.
The answer key remains outside the learner site so you must defend the lifecycle decisions rather than copy labels.
This challenge ends at design review. Human approval is still required before implementation begins.
