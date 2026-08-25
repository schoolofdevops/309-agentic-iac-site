---
sidebar_position: 2
---

# Course Build Status

> **In progress:** Section 1 production is active. This page is updated at material checkpoints; it is not a real-time job monitor.

| Field | Current value |
|---|---|
| Course | *Agentic Infrastructure as Code: Terraform, Kubernetes & AI Agents* |
| Active phase | Phase 0 low-resource viability evidence, followed by Section 1 end-to-end production |
| Active learner section | Section 1 — *Welcome to Agentic Infrastructure as Code* |
| Current sequence | Validated lab → lesson and lab guide → technical deck → slide-aligned voiceover → quiz → learner QA |
| Current blocker | None |
| Last checkpoint | 25 August 2026 — P0 repair passed; fresh local P1, P2, and P3 replays were completed and cleaned up. |

## Completed checkpoints

- The commercial, 12-section, agent-neutral curriculum is approved.
- Coding-agent labs are portable across compatible agents. Codex is demonstrated; Hermes is the one named operational-agent hands-on section.
- The 7 GB learner-machine baseline is the course constraint. Core labs use local tools only: no GPU, cloud account, or model API key.
- P0's governed Terraform repair works with both Terraform and OpenTofu.
- P1 has a local Terraform/OpenTofu lifecycle replay; P2 has a Kind/Helm smoke replay; P3 has a compact Argo CD synchronization replay.

## Important evidence note

P0–P4 are internal feasibility gates, not course sections. A fresh smoke replay proves only the exact path that ran. We will not label a learner-facing lab validated, complete, or published until that section's full learner run and learner QA pass.

## Next checkpoints

1. Reconcile the old site navigation to the approved 12-section course structure.
2. Complete the remaining Phase 0 clean/warm evidence, including a full P4 sequential run.
3. Build Section 1 in production order: lab proof, learner guide, lesson, deck, voiceover, quiz, and learner QA.

The canonical record lives in the source repository at `planning/COURSE-BUILD-STATUS.md`.
