---
sidebar_position: 2
---

# Course Build Status

> **Published checkpoint:** Sections 1 and 2 are live. Section 3 is a learner-QA-passed release candidate awaiting deployment.

| Field | Current value |
|---|---|
| Course | *Agentic Infrastructure as Code: Terraform, Kubernetes & AI Agents* |
| Active phase | Section 3 publication |
| Active learner section | Section 3 — *Plan Your IaC Change Before the Agent Writes Code* |
| Current sequence | Merge, push, deploy, and live-verify the complete Section 3 bundle. |
| Current blocker | None. |
| Last checkpoint | 27 August 2026 — Section 3 passed strict learner QA after its one confusing CALM example was fixed and independently rechecked. |

## Completed checkpoints

- The commercial, 12-section, agent-neutral curriculum is approved.
- Coding-agent labs are portable across compatible agents. Codex is demonstrated; Hermes is the one named operational-agent hands-on section.
- The course is tested against a 7 GB learner-machine reference profile. Section 1 warns rather than rejects learners below it. Core labs use local tools only: no GPU, cloud account, or model API key.
- P0's governed Terraform repair works with both Terraform and OpenTofu.
- P1 has a local Terraform/OpenTofu lifecycle replay; P2 has a Kind/Helm smoke replay; P3 has a compact Argo CD synchronization replay.
- Section 1 has a live-tested preflight lab, learner lesson, operator challenge, 15-question quiz, embedded 61-slide technical deck, and a complete slide-aligned voiceover script.
- Section 2 has a deterministic one-file Terraform repair, Terraform/OpenTofu proof, learner lesson, lab, challenge, Deep Dive, 15-question quiz, embedded 43-slide technical deck, and a 38-minute slide-aligned voiceover draft.
- A fresh learner QA run completed Setup through Section 2. Codex changed one file by four lines, the host passed all six IaC checks, and no apply, state, credential, or destructive action ran.
- Section 3 has a human-first four-artifact design lab, twelve-setting ownership challenge, eight-lecture lesson, CALM deep dive, 15-question quiz, 52-slide technical deck, and 6,896-word voiceover.
- A context-free learner completed the Section 2 to Section 3 seam. The unsafe starter reported exactly two design problems, the completed four-file design pack passed the local and CALM validators, and human approval remained pending.
- Section 3's deck passes 21 tests with 151 semantic nodes and 120 geometry-validated connectors. The site passes TypeScript and production-build gates.

## Important evidence note

P0–P4 are internal feasibility gates, not course sections. A fresh smoke replay proves only the exact path that ran. We will not label a learner-facing lab validated, complete, or published until that section's full learner run and learner QA pass.

## Next checkpoints

1. Deploy and live-verify Section 3: *Plan Your IaC Change Before the Agent Writes Code*.
2. Begin Section 4 lab-first production: *Give Your IaC Agent the Right Context*.
3. Complete later low-resource replay evidence where those sections make a support claim.

The canonical curriculum lives in the source repository at `planning/COURSE-OUTLINE.md`.
