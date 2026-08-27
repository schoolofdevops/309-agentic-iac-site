---
sidebar_position: 2
---

# Course Build Status

> **Published checkpoint:** Sections 1 through 3 are built, validated, deployed, and verified from the public learner path. Section 4 has passed strict learner QA and is at the deployment gate.

| Field | Current value |
|---|---|
| Course | *Agentic Infrastructure as Code: Terraform, Kubernetes & AI Agents* |
| Active phase | Section 4 release and live verification |
| Active learner section | Section 4 — *Give Your IaC Agent the Right Context* |
| Current sequence | Merge the proven Section 4 slice, deploy it, and verify the exact live artifacts. |
| Current blocker | None. |
| Last checkpoint | 27 August 2026 — Section 4 passed strict context-free learner QA with zero findings. |

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
- Section 3 is live. Its lesson, lab, challenge, deep dive, quiz, deck, and public learner artifacts returned HTTP 200; the deployed deck hash matches the committed artifact.
- Section 4 has a human-first six-artifact context lab, three-way conflict challenge, nine-lecture lesson, deterministic context-evaluation deep dive, 15-question quiz, 64-slide technical deck, and 8,931-word voiceover.
- The Section 4 canonical starter reports exactly five intended trust, freshness, precedence, and retrieval problems. The isolated candidate passes with a 293-word, 2,136-byte pack while every raw-source hash remains unchanged.
- The Section 4 deck passes all 28 deck tests with 193 semantic nodes, 136 geometry-validated connectors, and 99 staged reveals. A complete 1280 by 720 render review passed.
- A context-free learner completed the Section 3 to Section 4 seam with zero findings. The final context pack, exact six-file scope, challenge, navigation, site build, locally served routes, and committed/built/served deck hash all matched.

## Important evidence note

P0–P4 are internal feasibility gates, not course sections. A fresh smoke replay proves only the exact path that ran. We will not label a learner-facing lab validated, complete, or published until that section's full learner run and learner QA pass.

## Next checkpoints

1. Deploy and live-verify Section 4: *Give Your IaC Agent the Right Context*.
2. Build Section 5 completely, beginning with its live lab proof.
3. Complete later low-resource replay evidence where those sections make a support claim.

The canonical curriculum lives in the source repository at `planning/COURSE-OUTLINE.md`.
