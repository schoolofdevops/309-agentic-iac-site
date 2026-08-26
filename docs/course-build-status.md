---
sidebar_position: 2
---

# Course Build Status

> **Review checkpoint:** Section 1 is built and validated locally. It is waiting for instructor review before Section 2 production begins.

| Field | Current value |
|---|---|
| Course | *Agentic Infrastructure as Code: Terraform, Kubernetes & AI Agents* |
| Active phase | Section 1 instructor review |
| Active learner section | Section 1 — *Agentic Infrastructure as Code Fundamentals* |
| Current sequence | Hold before Section 2 until the instructor accepts Section 1. |
| Current blocker | Instructor review only |
| Last checkpoint | 26 August 2026 — lesson, lab, challenge, quiz, 61-slide deck, and full voiceover script passed local production checks. |

## Completed checkpoints

- The commercial, 12-section, agent-neutral curriculum is approved.
- Coding-agent labs are portable across compatible agents. Codex is demonstrated; Hermes is the one named operational-agent hands-on section.
- The course is tested against a 7 GB learner-machine reference profile. Section 1 warns rather than rejects learners below it. Core labs use local tools only: no GPU, cloud account, or model API key.
- P0's governed Terraform repair works with both Terraform and OpenTofu.
- P1 has a local Terraform/OpenTofu lifecycle replay; P2 has a Kind/Helm smoke replay; P3 has a compact Argo CD synchronization replay.
- Section 1 has a live-tested preflight lab, learner lesson, operator challenge, 15-question quiz, embedded 61-slide technical deck, and a complete slide-aligned voiceover script.

## Important evidence note

P0–P4 are internal feasibility gates, not course sections. A fresh smoke replay proves only the exact path that ran. We will not label a learner-facing lab validated, complete, or published until that section's full learner run and learner QA pass.

## Next checkpoints

1. Instructor tests and accepts Section 1.
2. Build and validate the Section 2 governed Terraform-repair path.
3. Complete the remaining low-resource replay evidence where the course makes a support claim.

The canonical curriculum lives in the source repository at `planning/COURSE-OUTLINE.md`.
