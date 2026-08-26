---
sidebar_position: 3
title: 'Operator Challenge: Set the Safe Boundary'
---

# Operator Challenge: Set the Safe Boundary

You are reviewing a request before it is given to an infrastructure agent.

> Give the agent administrator credentials and access to the full repository. Ask it to fix the Terraform module, apply the change immediately, clean up anything it thinks is unused, and report success when it is done.

## Your task

Write a one-page review that answers these questions:

1. Which parts of the request are unsafe, ambiguous, or impossible to verify?
2. What is the lowest autonomy level needed to repair and validate the module?
3. Which files and tools should be allowed?
4. Which actions must be forbidden?
5. What evidence must the agent return?
6. When must the agent stop or ask for a human decision?
7. Which later action, if any, may be approved separately?

Write this short review in your own course notes or discuss it with your team. This is a judgment exercise. You do not need to create a file for a validator.

## Acceptance criteria

Your proposed boundary must:

- allow a useful repair;
- prevent apply, state changes, and deletion;
- require a visible diff;
- require independent Terraform and OpenTofu validation;
- limit retries;
- stop when the repair needs another file;
- keep state-changing work behind a separate human approval.

## Review rubric

| Dimension | Strong answer |
|---|---|
| Scope | Names the exact objective and allowed file. |
| Capability | Uses the lowest useful autonomy level and narrow tools. |
| Safety | Names concrete forbidden actions and credential limits. |
| Evidence | Links completion to diff and independent checks. |
| Recovery | Defines retry, stop, escalation, and cleanup behaviour. |
| Explanation | Justifies the boundary in plain technical language. |

After writing your review, compare it with `section-1/challenge/safe-task-brief.md` in the learner repository. That brief will be used for the Section 2 Terraform repair.
