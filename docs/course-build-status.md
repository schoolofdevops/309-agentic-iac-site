---
sidebar_position: 2
---

# Course Build Status

> **Release checkpoint:** Sections 1 and 2 are built and validated. Section 2 is ready for branch merge, deployment, and public-clone verification.

| Field | Current value |
|---|---|
| Course | *Agentic Infrastructure as Code: Terraform, Kubernetes & AI Agents* |
| Active phase | Section 2 release |
| Active learner section | Section 2 — *Build Your First IaC Change with an AI Coding Agent* |
| Current sequence | Merge and deploy Section 2, verify the public lab, then begin Section 3. |
| Current blocker | Public verification waits for the labs and site branch push. |
| Last checkpoint | 27 August 2026 — complete Section 2 bundle passed live lab proof, deck and narration audit, and context-free learner QA. |

## Completed checkpoints

- The commercial, 12-section, agent-neutral curriculum is approved.
- Coding-agent labs are portable across compatible agents. Codex is demonstrated; Hermes is the one named operational-agent hands-on section.
- The course is tested against a 7 GB learner-machine reference profile. Section 1 warns rather than rejects learners below it. Core labs use local tools only: no GPU, cloud account, or model API key.
- P0's governed Terraform repair works with both Terraform and OpenTofu.
- P1 has a local Terraform/OpenTofu lifecycle replay; P2 has a Kind/Helm smoke replay; P3 has a compact Argo CD synchronization replay.
- Section 1 has a live-tested preflight lab, learner lesson, operator challenge, 15-question quiz, embedded 61-slide technical deck, and a complete slide-aligned voiceover script.
- Section 2 has a deterministic one-file Terraform repair, Terraform/OpenTofu proof, learner lesson, lab, challenge, Deep Dive, 15-question quiz, embedded 43-slide technical deck, and a 38-minute slide-aligned voiceover draft.
- A fresh learner QA run completed Setup through Section 2. Codex changed one file by four lines, the host passed all six IaC checks, and no apply, state, credential, or destructive action ran.

## Important evidence note

P0–P4 are internal feasibility gates, not course sections. A fresh smoke replay proves only the exact path that ran. We will not label a learner-facing lab validated, complete, or published until that section's full learner run and learner QA pass.

## Next checkpoints

1. Merge and push the Section 2 source, labs, and site branches.
2. Verify GitHub Pages and rerun the exact public learner clone.
3. Build Section 3: *Plan Your IaC Change Before the Agent Writes Code*.
4. Complete later low-resource replay evidence where those sections make a support claim.

The canonical curriculum lives in the source repository at `planning/COURSE-OUTLINE.md`.
