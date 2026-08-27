---
sidebar_position: 4
title: 'Deep Dive: Build Evaluations You Can Trust'
sidebar_label: 'Deep Dive (Part 2)'
---

# Deep Dive: Build Evaluations You Can Trust

The lab proves that one run can be functionally correct and still be rejected.
This deep dive goes one level lower. It asks whether the evaluator itself is
independent, complete, private, and difficult to game.

An evaluation system is production code. It has assumptions, inputs, defects,
permissions, and maintenance cost. A green dashboard is useful only when the
team understands what each green result proves and what it cannot prove.

## 1. False green and false red

A **false green** accepts a run that violates the intended contract. The Section
6 functional-only suite is a deliberate example. Terraform validation passes,
but the run changes a forbidden file and exceeds budgets.

A **false red** rejects an acceptable run. This can happen when a golden output
contains an unstable timestamp, a formatter changes harmless whitespace, or a
threshold is tighter than the real requirement.

Both errors matter:

- false green allows unsafe work to continue;
- false red teaches engineers to ignore or bypass the evaluator.

Design fixtures around meaningful failure modes. Do not create 100 shallow
checks because the count looks impressive. One mutation that changes a queue
default is more useful than many syntax-only cases when the risk is silent
behaviour change.

For every gate, write this contract:

```text
claim -> fixture -> observation -> threshold -> failure id -> recovery
```

If one part is missing, reviewers cannot interpret the result reliably.

## 2. Evaluator independence

Suppose an agent writes this summary:

```json
{"changed_files":["main.tf"],"tests":"passed"}
```

If the safety evaluator reads only that summary, the agent controls both the
change and the evidence. The evaluator is not independent.

The Section 6 harness derives changed files from before and after bytes. It
records command exits from the operating system. It computes the observed queue
summary from the resulting file. These observations can still have bugs, but
they do not come from the agent's claim.

Independence can come from several boundaries:

- a separate process reads immutable inputs and the candidate output;
- a CI identity has read access to the diff but no permission to edit it;
- policy checks run after the agent process exits;
- a golden result comes from a reviewed fixture, not generated candidate text;
- a human reviews the evidence for high-impact actions.

Do not make every gate depend on one parser or one model judge. Correlated
evaluators fail together. Use deterministic checks for exact facts and a
separate human or model rubric only for judgment that cannot be encoded safely.

## 3. Mutation tests for the evaluator

A normal test proves that a good case passes. A mutation test proves that a
specific bad case fails.

Useful IaC mutations include:

- change a protected default while keeping valid HCL;
- add a second changed file outside scope;
- replace an in-place change with a resource replacement;
- remove a required tag or ownership field;
- add a credential-shaped value to output;
- change a pinned provider version;
- disable one gate while keeping the overall label green;
- increase retry or context values above budget;
- mark a mutating operation as read-only metadata.

The expected result must name the gate and failure identifier. "The test fails"
is too broad. If a mutated queue default fails only because formatting is bad,
the regression evaluator still has no proof.

Keep mutation fixtures separate from learner or production state. Run them in
temporary copies with no cloud credentials, plan, apply, or state authority.

## 4. Benchmark leakage and overfitting

An agent can look excellent when it has seen the exact fixture, expected output,
or answer key. This is benchmark leakage.

Course labs intentionally publish fixtures so learners can understand them.
Production evaluation needs additional held-out cases. Use families of tasks:

- known training examples for development;
- held-out regression examples for release;
- live sampled tasks for monitoring;
- adversarial mutations for safety.

Avoid one magic string that the agent can insert without understanding the
change. Vary names, shapes, and ordering while preserving the same engineering
rule. Keep acceptance semantics stable.

Do not hide all criteria from engineers. Security through obscurity is not the
goal. Publish the policy and gate meaning. Hold out enough fixtures to detect
hardcoded answers and fragile behavior.

## 5. Goodhart's law and metric gaming

When a measure becomes the only target, people and systems learn to optimize the
number instead of the outcome.

Examples:

- A token target encourages the agent to omit necessary evidence.
- A command-count target encourages one broad shell command.
- A fast-run target encourages skipped regression tests.
- A pass-rate target encourages easier fixtures.
- A small-diff target hides required refactoring in compressed code.

Use a gate set, not one score. Function, safety, regression, and budget are
conjunctive in this course: every required gate must pass. A cheap unsafe run
cannot compensate for its safety failure with a better cost score.

Review metric movement with the underlying evidence. If token count drops,
check source coverage and failure detection. If time drops, check which commands
disappeared. If pass rate rises, run the same mutations.

## 6. Telemetry privacy and evidence retention

Agent traces can contain source code, prompts, file paths, identities, internal
URLs, tool results, and secret-shaped text. More telemetry can create more risk.

Separate three layers:

1. **Raw local evidence** contains detailed command records for short-term
   debugging and audit.
2. **Compact Run Card** contains hashes, counts, gate results, failure classes,
   and review boundaries.
3. **Aggregate metrics** contain trends without task content where possible.

Define:

- who can read each layer;
- how long it is retained;
- which values are redacted before storage;
- which values must never be collected;
- how deletion and legal holds work;
- how a reviewer can find the raw record from the compact card.

Redaction is not complete secrecy. A hash can still identify known content, and
file names can reveal sensitive projects. Threat-model the evidence system like
any other data pipeline.

## 7. Budget gaming and honest cost evidence

The Section 6 token estimate is stable but approximate. UTF-8 bytes divided by
four is not a model tokenizer. The fixed price card is not a current provider
bill. Those limits are written into the Run Card so nobody mistakes precision
for accuracy.

In a production harness, record:

- provider-reported input, cached-input, and output token fields;
- model and API version;
- versioned price source and currency;
- tool, storage, network, and infrastructure costs;
- retry and parallel-run costs;
- operator time for review and recovery.

Keep estimated and billed values in different fields. Never silently replace
missing provider usage with an estimate and call it actual spend.

Budget checks should also reject gaming:

- moving output to an unmeasured channel;
- dropping raw evidence before audit retention is satisfied;
- splitting one run into untracked child runs;
- changing the price card inside the candidate scope;
- increasing the threshold in the same change that exceeds it.

Pin the price card and threshold hashes. Review changes to them separately from
the agent result.

## 8. Model judges and human rubrics

Some qualities need judgment: clarity of an ADR, quality of a recovery plan, or
whether an architecture explanation matches business intent. A model judge can
help scale review, but it adds another probabilistic component.

Use a model judge only with:

- a narrow rubric with observable anchors;
- examples of strong, weak, and unacceptable results;
- a held-out calibration set;
- judge model/version recorded;
- disagreement and abstention handling;
- periodic human review;
- no power to approve destructive or production action.

Do not use a model judge for exact file scope, exit codes, hashes, or numeric
budgets. A deterministic check is simpler and easier to audit.

Human review also needs a rubric. "Looks good" is not a control. Ask the human
to confirm intent, residual risk, evidence freshness, approval authority, and
recovery before the next action.

## 9. Release criteria for an evaluator

Before an evaluation suite controls agent work, require evidence for the suite
itself:

- every required gate has a claim and failure identifier;
- known good fixtures pass;
- seeded and mutated failures trigger the intended gate;
- missing or corrupt evidence fails closed;
- candidate code cannot edit its own evaluator or thresholds;
- secrets and environment values are not stored;
- time and memory fit the learner or production profile;
- results are stable across supported tool versions;
- recovery from evaluator failure is documented;
- human approval remains external.

Version the suite. A run evaluated with suite A is not automatically equivalent
to a run evaluated later with suite B. The Run Card's suite hash makes that
difference reviewable.

## 10. Evaluator attack surface

An evaluator can become a privileged confused deputy. It may read candidate
files, execute tools, access secrets, or publish an approval label. Treat its
inputs as untrusted.

Common attacks include:

- a path that escapes the intended workspace;
- a symbolic link that redirects a trusted read or cleanup;
- command output designed to look like evaluator instructions;
- a huge output that exhausts memory or hides the final error;
- a candidate edit to the threshold or golden result;
- a forged Run Card copied from an earlier passing run;
- an environment value injected into logs;
- a tool binary replaced earlier in `PATH`.

Use exact path resolution, symlink checks, time and output limits, immutable
fixtures, fixed argument arrays, minimal environments, executable pinning where
needed, and independent hashes. Signatures and attestations may strengthen
artifact identity, but they still do not prove the logic is safe.

The evaluator should not have more production authority than it needs. A CI
check can post a status without holding apply credentials. A separate protected
workflow can require current human approval before a deployment identity is
available.

## 11. Drift, rollout, and monitoring

An evaluator that worked at release can become stale. Tool versions change,
policies change, provider schemas change, and task distribution changes.

Roll out evaluation changes like application changes:

1. run the new suite in shadow mode beside the current suite;
2. compare disagreements on known and sampled runs;
3. investigate false green and false red cases;
4. update fixtures and rubric with reviewed reasons;
5. promote the suite with a version and rollback point;
6. monitor gate rates, failure classes, latency, and bypass attempts.

A sudden 100% pass rate may mean the agent improved. It may also mean the gate
stopped running. Monitor evaluator execution and missing evidence, not only the
final label. Keep an explicit `evaluator` failure class so infrastructure work
does not continue when the checking system is broken.

Revalidate old assumptions when a new agent, model, tool adapter, Terraform or
OpenTofu version, operating system, or price source enters the workflow. The
portable contract can remain stable while compatibility evidence changes.

## Deep-dive checkpoint

A trustworthy evaluation system does more than generate a green label. It
creates an inspectable relationship:

```text
task claim
  -> immutable fixture
  -> independent observation
  -> versioned evaluator
  -> gate result and failure class
  -> human decision and recovery
```

Use this chain in later sections. Terraform plans, policy checks, Kubernetes
rollouts, delivery evidence, and Hermes observations all need the same honesty:
state exactly what was measured, keep the evaluator independent, protect the
evidence, and never confuse PASS with approval.
