---
sidebar_position: 1
title: 'Build, Test, and Optimize Reliable IaC Agent Workflows'
---

import Slides from '@site/src/components/Slides';

# Build, Test, and Optimize Reliable IaC Agent Workflows

A good prompt can produce one good answer. An engineering workflow must produce
a reviewable result again tomorrow, after a failure, with a different operator,
and with a different compatible agent. That requires more than prompt wording.
It requires a control system around the model.

In this section, you will build that control system. One local workflow repairs
a provider-free Terraform fixture. The first run looks successful because the
HCL is valid. It also writes outside scope and wastes commands and context. Four
independent gates expose the difference between "the change works" and "this run
is acceptable." The lab needs no model, cloud account, credential, provider,
plan, or apply.

<Slides src="decks/m6-build-test-optimize-reliable-iac-agent-workflows.html" title="Section 6: Build, Test, and Optimize Reliable IaC Agent Workflows" />

## 1. What Is an Agent Workflow Harness?

An agent workflow harness is the engineering system that surrounds a model. It
turns an open-ended request into a bounded sequence that can be inspected,
measured, stopped, and repeated.

Think about a normal build pipeline. We do not ask a compiler to "please build
carefully." We give it source files, flags, a working directory, and acceptance
checks. We keep logs. We fail the build when a required check fails. An agent
needs the same kind of structure, with extra controls for tool use and human
approval.

A useful IaC harness has six parts:

1. **Specification** defines the intent, allowed files, forbidden actions,
   acceptance criteria, and stop conditions.
2. **Plan** breaks the request into reviewable steps before broad edits begin.
3. **Isolation** gives the run a bounded branch, worktree, sandbox, or temporary
   copy.
4. **Execution** exposes exact tools and arguments instead of an open shell.
5. **Evaluation** checks function, safety, regression, and budget from observed
   artifacts.
6. **Recovery** preserves checkpoints and defines how to discard, restore, or
   resume work.

The model sits inside this system. It does not become the system.

The harness also owns the loop conditions. An agent often follows inspect,
act, observe, and revise. Without a boundary, the cycle can keep reading,
editing, retrying, or asking for more tools. The workflow defines maximum
attempts, time, command set, writable paths, and evidence required to continue.
A stop condition is a successful outcome when it prevents unsupported work.
"Required executable missing" should stop as an environment result; it should
not encourage the model to download an unapproved binary.

Separate control-plane files from candidate files. The task contract, harness,
evaluator, thresholds, and immutable fixtures should not normally be writable
by the same run they evaluate. If the agent can change
`allowed_changed_files` and then change another file, the scope gate can be made
green without improving safety.

The Section 6 harness uses a simple state flow:

```text
request -> contract -> isolated run -> observed evidence -> four gates
                                                        |
                                      rejected <--------+--------> ready for human review
```

Notice the final wording. A passing run is **ready for human review**. It is not
approved for deployment. Evaluation can support a decision. It cannot create
the operator's identity, consent, or production authority.

The harness is also agent neutral. Codex can propose the three JSON repairs in
the lab. Claude Code, Goose, Cursor, Copilot, VS Code, another compatible agent,
or a human editor can propose the same diff. The task contract, runner, and four
gates decide what is acceptable. A vendor transcript does not.

## 2. Superpowers-Style Workflow Patterns

Superpowers is one implementation of a skills-based software development
methodology. Its public workflow emphasizes design before implementation,
written plans, worktree isolation, test-first changes, review, and verification.
The specific plugin is useful, but the engineering pattern is more important
than the product name. The same sequence can be used with any agent that can
read files, edit a bounded workspace, run allowed commands, and show evidence.

An adapter may translate the workflow into a tool-specific command or UI. Codex
might receive a repository task and sandbox mode. Claude Code may load the same
task through a skill. Cursor or VS Code may show the diff in an editor. Goose
may map fixed tools into its extension system. The adapter can change how the
operator starts the run. It must not change allowed paths, forbidden operations,
the evaluation suite, or the approval boundary.

Keep the portable contract in the repository. A prompt saved only in chat is
hard to review and version. A repository contract can be hashed, tested, and
used by multiple clients. Tool-specific instructions should be a thin layer
that points back to it.

The portable pattern is:

```text
brainstorm -> approve design -> write plan -> create isolation
          -> write failing check -> implement -> review -> verify -> integrate
```

Each arrow creates a checkpoint. This matters because agent work can fail in
many ways. The model can misunderstand the request. A tool can fail. The task
can be larger than expected. A later check can reveal that the first design was
wrong. Checkpoints let the engineer return to the last known good state without
discarding unrelated work.

Review is not one final event. Review the design before code, the plan before
execution, the diff before acceptance, and the evidence before integration.
Small reviews prevent a late "looks good" decision from carrying every kind of
risk at once. They also make model mistakes cheaper because the engineer can
correct direction before a wide patch exists.

For IaC, design approval must happen before a wide generated change. The design
should answer practical questions:

- Which lifecycle or ownership boundary changes?
- Which files may change?
- Which state, identity, network, or cost boundary may be affected?
- Which commands are allowed before human approval?
- Which evidence will prove the requested result?
- What must stop the run?
- How will the change be recovered or rolled back?

Test-first work is equally important. A failing check proves that the evaluator
can see the seeded defect. If the check is green before the repair, either the
fixture is not broken or the check is too weak. The Section 6 starter makes this
lesson visible: a functional-only evaluator is green even while safety and
budget are bad. The independent complete suite is the real red test.

Use Superpowers-style skills as reusable procedures, not as hidden authority.
A skill can remind an agent to create a worktree or verify before completion.
The operating system, repository permissions, fixed runner, CI policy, and
human workflow still enforce the boundary. The official
[Superpowers repository](https://github.com/obra/superpowers) also supports
multiple coding-agent environments, which reinforces the portable pattern.

## 3. Isolation, Checkpoints, and Recovery

Isolation answers one question: **where can this run make a mistake?**

A Git branch isolates history. A worktree gives that branch a separate working
directory. A container or operating-system sandbox can isolate processes,
filesystem paths, network access, and credentials. A temporary copy can isolate
a small deterministic fixture. These controls solve different problems; they
are not interchangeable.

The course uses two levels in Section 6:

- the successful solution is preserved on an isolated Git branch;
- each harness run copies only `main.tf` into a named temporary workspace.

The runner rejects path traversal and a non-empty output directory. It does not
follow an output symlink. It invokes Terraform or OpenTofu with an argument
array and `shell: false`. The child process receives a small environment. This
means a workflow operation can still be evaluated as unsafe without touching
the learner's canonical fixture.

A checkpoint is a known state plus evidence. A useful checkpoint names:

- the task contract hash;
- the fixture or source revision;
- the workflow plan hash;
- the evaluation suite hash;
- the observed changed files;
- the command results;
- the review decision;
- the recovery action.

Git provides history, but a commit message alone is not enough. "Agent fixed
Terraform" does not tell a reviewer which commands ran, whether another file
changed, or whether a gate was disabled. The Section 6 Run Card binds those
facts into one compact record.

Recovery must be specific. "Try again" is not a recovery plan. Good actions
include:

- discard the isolated run;
- restore the last accepted Git checkpoint;
- revert one reviewed commit;
- recreate a temporary workspace from immutable inputs;
- resume from a written plan after the blocking condition is removed.

Preserve user work during recovery. Do not reset a shared worktree because an
agent run failed. Inspect the current state, name the exact target, and use the
smallest reversible action. This is why the lab's recovery command restores
only three learner-owned JSON files from one pinned commit.

Record failure before cleanup. If the run directory disappears before command
exits and changed files are captured, the team loses the information needed to
repair the workflow. Cleanup should be scoped. The lab's cleanup tool validates
a Section 6 marker, temporary-root location, directory prefix, and symlink
boundary before removal. A generic recursive delete command would be shorter,
but it would teach the wrong recovery habit.

Isolation also needs a resource policy. A worktree protects Git content but not
CPU, memory, network, or cloud credentials. A temporary copy protects fixture
bytes but not the rest of the host. Match the isolation mechanism to the threat:
filesystem scope, process authority, network access, secret access, resource
limits, and infrastructure identity are separate controls.

## 4. Evaluation Design for Agentic IaC

An evaluation is a test of a claim. A strong evaluation states the claim,
fixture, observation, threshold, and failure result.

For example:

| Claim | Observation | Threshold | Failure |
| --- | --- | --- | --- |
| The requested repair works | CLI exits and observed queue summary | all fixed commands exit 0; exact summary matches | `functional.result` |
| The run stayed in scope | before/after file hashes | only `main.tf` changed | `safety.scope` |
| Existing behaviour remains | derived queue default | `course-jobs` remains unchanged | `regression.summary` |
| Work stayed bounded | context, output, commands, retries, estimate | every named budget is at or below limit | `budget.*` |

The fixture must contain a meaningful seeded failure. The Section 6 baseline
has four:

- extra context;
- an extra file write;
- repeated commands and retry allowance;
- a functional-only enabled suite.

The first evaluator intentionally misses three classes of problem. The complete
suite must reject the same run. This proves that the course is testing the
evaluation design, not only the Terraform file.

A rubric is useful when judgment cannot be fully deterministic. For example, a
human reviewer may score whether an architecture decision explains ownership
clearly. But use deterministic validators for exact scope, hashes, exit codes,
thresholds, and forbidden commands. Do not ask a model to judge a fact that the
machine can measure directly.

Set thresholds before looking at the candidate result. If the team increases a
budget after every failure, the budget is only decoration. A threshold may be
changed when requirements change, but that change needs its own reason, review,
and regression evidence.

Build an evaluation dataset, not only one example. Start with the happy path,
then add failures that matter: wrong resource lifecycle, forbidden file,
missing approval, replacement action, secret in output, tool timeout, provider
mismatch, and budget overrun. Give every fixture an owner and reason to exist.
Remove duplicates that test the same shallow property.

For a judgment rubric, define levels in observable language. A missing recovery
action scores differently from "retry," and both differ from "discard this
isolated run and restore checkpoint X." Do not ask a judge to assign "good"
without anchors. Calibrate the rubric with examples and examine disagreements.

Finally, evaluate the evaluator. Mutation tests change one important input and
prove that the right gate fails. The operator challenge asks whether a changed
queue default is caught. This is stronger than adding a second model reviewer,
because it tests the exact uncertainty with no new runtime authority.

## 5. Functional, Safety, and Regression Evals

These three gates answer different questions.

**Functional:** Did the requested behaviour work?

The lab requires the variable to become non-nullable, keeps the queue default,
and runs fixed format, backend-disabled initialization, and validation commands.
A functional pass is necessary. It is not sufficient.

**Safety:** Did the run stay inside the permitted operating boundary?

The evaluator derives changed files from before and after bytes. It rejects the
baseline's `notes/team-ownership.md` write even though the Terraform commands
pass. It also checks that the Run Card keeps deployment approval with a human
and names a recoverable action.

**Regression:** Did a behaviour that should remain stable stay stable?

Terraform validation proves syntax and configuration consistency. It does not
prove that `course-jobs` remained the default. The regression gate derives a
summary and compares it with a separate expected result. This makes a valid but
wrong default observable.

Keep gates independent. If functional and regression use the same unchecked
agent summary, one false statement can make both green. Prefer different
observations or independent fixtures. A gate should fail closed when required
evidence is missing.

Negative paths are part of the product. The harness tests unsupported engines,
path escape, non-empty output, redaction, command timeout, and both IaC engines.
These are not edge cases added after the happy path. They define how the system
behaves when an agent, user, or environment supplies an unsafe input.

Regression scope should follow risk. A variable repair needs a stable default
check. A module refactor may need resource-address comparison and `moved`
blocks. A delivery change may need rendered Kubernetes objects and rollout
health. "Regression tests passed" is useful only when the reviewer can see
which behaviours were protected.

Also distinguish evaluation from approval:

```text
validator PASS -> evidence is acceptable for this contract
human review    -> engineer understands the change and residual risk
approval        -> authorized person permits the next action
deployment      -> separate system changes the target environment
```

The arrows do not collapse. A human may reject a technically passing run. A
passing run may expire when policy, source bytes, tool versions, or intent
changes. The Run Card should make that residual decision visible.

## 6. Run Telemetry and Failure Classification

Telemetry is useful when it helps answer an operational question. Collect the
minimum evidence needed to explain the run, compare it, and recover it.

The Section 6 record captures:

- engine and exact command arrays;
- exit code, timeout state, duration, and output hashes for each command;
- files changed from byte comparison;
- context and output bytes plus estimated tokens;
- observed and configured retry counts;
- fixed price-card hash and estimated cost;
- fixture, task, plan, and evaluation-suite hashes;
- gate results, failure identifiers, and failure classes;
- approval and recovery boundaries.

It does not copy parent environment values into the Run Card. The runner passes
only named child keys and records the key names. Secret-shaped text is redacted
before command output is stored. Raw command records remain local; the compact
Run Card carries hashes and counts for normal review.

Telemetry needs an event model when workflows become longer. Useful events
include task accepted, context selected, tool requested, command started,
command completed, file changed, gate evaluated, approval requested, approval
granted or denied, checkpoint created, and recovery completed. Every event
should have a run identifier, timestamp, actor or process, artifact link, and
outcome. Do not store a free-form model narrative as the only event record.

Link evidence without overstating it. A command record **supports** the claim
that a fixed invocation exited zero. A changed-file observation **evaluates** a
scope rule. A Run Card is **derived from** the raw record. Typed links help
reviewers navigate provenance, but current policy and direct runtime evidence
still win over a stale graph entry.

Failure classes make recovery practical:

| Class | Meaning | Typical response |
| --- | --- | --- |
| functional | requested result or required command failed | repair code or fixture understanding |
| safety | scope, authority, approval, or recovery boundary failed | stop; narrow the run |
| regression | a protected behaviour changed | inspect diff; restore or update approved expectation |
| budget | context, output, command, retry, time, or cost limit failed | remove waste without weakening other gates |
| environment | required executable or supported host condition is absent | repair setup; do not label product logic failed |
| evaluator | evidence is missing, corrupt, or the validator failed | repair the evaluation system first |

Do not store complete prompts, credentials, or private repository content just
because they might help later. Trace privacy is a design requirement. Define
retention, access, redaction, and deletion rules for raw logs.

## 7. Token and Cost Engineering

Token optimization starts with useful work, not shorter text. A tiny context
that omits a required policy is not efficient. A larger context that repeats
unrelated documents is not safer.

Measure at the run and workflow level. A single response can be small while the
agent repeats the same search ten times. Cached input may have a different price
but still consumes context capacity. Parallel agents can reduce wall time while
increasing total tokens and review load. Report enough dimensions to see these
trade-offs instead of compressing everything into one cost score.

Manage five budgets:

1. **Context:** selected source text sent to the model.
2. **Output:** model responses and tool output returned to context.
3. **Retries:** repeated reasoning or commands after failure.
4. **Time and concurrency:** wall time and parallel work using shared capacity.
5. **Money:** provider tokens, hosted tools, cloud resources, and operator time.

The baseline loads 416 estimated context tokens and runs 12 commands. The
accepted run loads 90 estimated context tokens and runs 3 commands. It does not
remove any required evidence. It passes the same function and regression gates,
then also passes safety and budget.

The lab's token method is intentionally simple: UTF-8 bytes divided by four,
rounded up. The price card is fixed for comparison. The Run Card labels the
result as an estimate and states that it is not provider billing. Production
systems should prefer the actual usage values from the selected provider and a
versioned current price source. Different models tokenize the same text
differently.

Cost engineering also includes infrastructure. An agent that creates a large
cluster, repeats plans against paid services, or leaves a preview environment
running can create more cost than its model tokens. Later sections connect Run
Cards to IaC plan cost, runtime ownership, and FinOps controls.

Use budgets as stop and escalation controls. A run near the context limit can
ask for human selection instead of silently truncating policy. A retry limit can
stop after the same failure repeats. A cost threshold can require approval
before a paid model or cloud preview is used. The correct outcome may be
`blocked_for_decision`, not an invented success.

Never optimize by hiding evidence. Compact summaries should point to retained
raw records. If a filter drops the one error that explains a failure, it is not
an optimization.

## 8. RTK, Caveman, and Evaluation-Driven Optimization

[RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) is a CLI proxy that
filters noisy command output before it enters agent context. The local lab uses
it only as an optional comparison. The core harness works with ordinary Node,
Terraform/OpenTofu, and JSON.

The right pattern is:

```text
command -> raw local record -> compact agent-facing result -> evaluation
```

RTK can reduce repeated passing-test lines or verbose Git output. It does not
change the underlying exit code, create missing tests, enforce filesystem
scope, or approve a change. Run `rtk --version`, `rtk gain`, and `which rtk` to
confirm that the token-optimized Rust project is installed; another project also
uses the `rtk` name.

[Caveman](https://github.com/JuliusBrussee/caveman) provides optional compressed
communication and evaluation-oriented workflow tools. Its repository includes
offline eval and benchmark practices. The course uses the general experiment
discipline: compare a baseline and candidate, keep exact evidence, and retain a
change only when evaluations show improvement. Caveman is not a core lab
dependency.

An evaluation-driven optimization loop is simple:

1. Name the observed failure or cost.
2. Choose the smallest change that could improve it.
3. Run the same fixtures and all existing gates.
4. Compare function, safety, regression, budget, time, and failure classes.
5. Retain the change only if the target improves and no required gate regresses.
6. Record why it was retained or discarded.

This protects the team from attractive but irrelevant changes. Adding another
agent, larger context, or a powerful Skill can increase cost and authority
without improving the failed evaluation. A better deterministic validator may
be the smaller and stronger choice.

Treat compression tools as candidates in the same loop. Select representative
commands, keep raw outputs, and test whether the compact form preserves exit
status, error identity, file names, and the lines required for diagnosis.
Measure token reduction and failure-detection quality. Reject a filter that
saves tokens by hiding the only actionable error.

Experiment records should contain the baseline revision, candidate revision,
fixed fixture, evaluator version, observed metrics, decision, and reason. Do not
retain a change because it felt faster during one interactive session. Repeat
where variance matters, and keep the result honest when there is no improvement.

The accepted Section 6 run is not "better" because it uses fewer tokens. It is
better because it passes function, safety, regression, and budget together,
produces reviewable evidence, preserves recovery, and stops at a human boundary.

## Section checkpoint

You now have a repeatable pattern for later IaC work:

- an approved request and portable task contract;
- a written workflow plan;
- an isolated execution workspace;
- fixed CLI authority;
- observed changed-file and command evidence;
- functional, safety, regression, and budget gates;
- raw local telemetry plus a compact Run Card;
- labelled token and cost estimates;
- an evaluation-driven optimization loop;
- human approval and recovery kept outside the model.

The next sections apply this harness to larger Terraform, security, Kubernetes,
delivery, and operations work. The workload grows. The control pattern stays.
