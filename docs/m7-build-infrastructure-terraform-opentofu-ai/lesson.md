---
sidebar_position: 1
title: Build Infrastructure with Terraform, OpenTofu, and AI Agents
description: Understand evaluation, graphs, modules, state, refactoring, locks, identity, and portable local infrastructure before trusting generated HCL.
---

# Build Infrastructure with Terraform, OpenTofu, and AI Agents

Generated Terraform can look correct and still be difficult to own. A provider
range can select an untested release. A valid plan can replace a resource that
contains data. A sensitive value can enter state. A renamed module can appear
as destroy and create when the real intention is only to move an address.

This section builds the Terraform and OpenTofu foundation needed to review
these situations. We use one local project throughout: object storage, a job
queue, job state, worker identity, and worker logs for the Production AI
Workload Platform.

## Terraform and OpenTofu in This Course

Terraform and OpenTofu read the same HCL language and share many commands and
concepts. Both load configuration, install providers, build a dependency graph,
compare configuration with state and remote objects, create a plan, and apply
provider operations. This common model lets us teach one engineering method.

Terraform is the primary walkthrough. OpenTofu is a first-class compatibility
path. Compatibility is not assumed from syntax. We run both tools in separate
working copies and record versions, provider selection, lock identity, plans,
state moves, lifecycle behaviour, and cleanup.

Why separate working copies? The two tools can resolve the same provider
version through different registry addresses. In the proven lab, Terraform
writes `registry.terraform.io/hashicorp/aws`; OpenTofu writes
`registry.opentofu.org/hashicorp/aws`. Their lock hashes differ. Silently
rewriting one tool's lock file makes review and rollback unclear.

State also needs caution. It binds Terraform addresses to remote identities and
can contain sensitive values. The local lab uses disposable state and destroys
all resources. In a team environment, state needs a reviewed backend, locking,
access control, backup, and recovery. This course explains those production
needs without requiring a hosted backend.

The core rule is simple: treat Terraform and OpenTofu as compatible only for
the exact behaviour you tested. Record differences instead of hiding them.

## How Terraform Evaluates Configuration

Terraform does more than read files from top to bottom. It loads every `.tf`
file in one module directory as one configuration. File names help people, but
they do not create execution order.

Terraform then evaluates expressions and module calls. Some values are known
from configuration, such as `var.prefix`. Other values come from providers and
remain unknown until planning or apply, such as an ID assigned by a remote API.
Unknown does not mean empty. It means Terraform knows the type and dependency,
but not the final value yet.

Provider schemas give meaning to resource arguments. They identify required,
optional, computed, sensitive, and replacement behaviour. This is why
`terraform validate` may need provider initialization. HCL parsing alone cannot
check a resource against a provider schema.

During planning, Terraform normally refreshes managed objects, evaluates the
desired configuration, compares it with state and provider observations, and
asks providers to plan changes. The result classifies actions such as create,
update in place, replace, delete, read, or no change.

Apply executes a saved or newly generated plan. A saved plan is better for a
reviewed workflow because the applied actions are the actions that were
planned. It is still time-limited evidence. External changes, credentials,
provider behaviour, and environment conditions can make an old plan unsafe or
invalid.

Our local lifecycle makes the stages visible:

1. initialize modules and AWS provider 6.61.0;
2. validate the configuration;
3. create a JSON-backed plan with exactly eight create actions;
4. apply that saved local plan;
5. refresh and read state plus direct APIs;
6. plan a declarative address move;
7. plan one in-place queue update;
8. prove no-change convergence;
9. destroy the named resources and prove empty state and APIs.

A green validation result proves none of the later steps. Always match the
claim to the evaluation stage.

## The Resource Dependency Graph

Terraform uses a directed graph to decide which operations can run in parallel
and which must wait. Graph edges come from references, provider requirements,
module boundaries, lifecycle rules, and explicit dependencies.

In the foundation, the identity policy needs the bucket ARN and queue ARN:

```hcl
module "identity" {
  source     = "./modules/identity"
  bucket_arn = module.storage.bucket_arn
  queue_arn  = module.messaging.queue_arn
}
```

These references create implicit edges from identity to storage and messaging.
Terraform can create independent job-state and observability resources in
parallel, while the identity policy waits for its exact resource identities.

Use `depends_on` when there is a real dependency that cannot be expressed
through data. Do not add it to force a visual order or to make an unstable plan
look predictable. Broad dependencies create more unknown values and reduce safe
parallelism.

Data sources also participate in the graph. If their arguments are known, they
may be read during planning. If they depend on changing resources, their result
can remain unknown until apply. Reviewers must understand whether an unknown is
expected from graph timing or hides an unacceptable policy decision.

A cycle means the graph has no valid start. For example, a bucket policy cannot
depend on a role output while the role policy simultaneously depends on the
bucket policy result. The repair is architectural: identify an ownership
boundary or stable input. Adding another agent or retry does not solve a graph
cycle.

The lab records a graph hash for each tool. A hash proves graph identity, not
graph quality. The contract also checks that the expected storage, queue, and
identity nodes exist.

## Provider Versions, Locks, and Reproducibility

Three controls work together:

- `required_version` limits the Terraform or OpenTofu CLI;
- `required_providers` limits acceptable provider versions and sources;
- `.terraform.lock.hcl` selects exact provider builds and records checksums.

The unsafe starter uses `>= 6.0.0`. During direct validation, it selected AWS
provider 6.62.0 even though Phase 0 had reviewed 6.61.0. The HCL remained valid,
but the dependency changed.

The repaired constraint is `~> 6.61.0`. It permits patch releases in the 6.61
line but does not admit 6.62. A lock generated after review selects 6.61.0
exactly for the current working copy.

Do not edit lock checksums by hand. Initialization verifies packages against
the lock. For multiple platforms, use the provider-lock workflow to add
reviewed platform hashes. A lock file copied from an untrusted change is not
automatically safe; review its source, version, and diff.

Provider constraints are part of a module contract. Reusable child modules
normally state compatible minimums or ranges. The root module owns the final
selection and lock. Overly exact child constraints can make modules impossible
to combine. Overly broad root constraints can introduce unreviewed behaviour.

For mixed Terraform/OpenTofu teams, define one policy. You may use separate
tool-specific checkouts, generate and review locks in each pipeline, or support
only one tool for state-changing work. What matters is that registry rewriting
is visible and rollback is clear.

## Module Contracts and Agent-Friendly Structure

A module should represent an ownership and lifecycle boundary, not simply a
folder created to reduce file length. The Section 7 foundation uses five small
modules because storage, messaging, job state, identity, and observability have
different owners and change risks.

Strong module contracts use typed inputs, useful descriptions, validation,
narrow outputs, and stable resource addresses. A generated module should not
accept one untyped map for every possible setting. That hides required fields
and makes policy review difficult.

Use variable validation for values that can be checked from configuration. Use
preconditions when a resource or data result must satisfy a condition before an
operation. Use postconditions when an observed result must be true after read or
apply. These checks improve error location, but they do not replace policy,
tests, or runtime evidence.

Outputs are public module interfaces. Export the bucket ARN when identity needs
it. Do not export an entire resource object because a future caller may depend
on internal attributes. Mark sensitive outputs to reduce accidental display,
while remembering that the value may remain in state.

Agent-friendly structure makes the next correct change easy to describe:

- one task names one owner and module;
- permitted files match that module boundary;
- inputs and outputs explain dependencies;
- tests target the contract;
- a small plan exposes the blast radius.

More modules are not always better. A module containing one trivial resource
with no ownership or reuse boundary adds navigation without reducing risk.

## State Is a Trust and Recovery Boundary

State maps a Terraform address to a remote object identity and last-known
attributes. Without that binding, Terraform cannot know that
`module.messaging.aws_sqs_queue.jobs` represents a specific queue URL.

State is not application storage. Do not put job payloads, model artifacts, or
business records in it. Providers can store arguments and computed attributes,
including values marked sensitive in the configuration. Protect state as a
high-value operational record.

For team use, a backend should provide controlled access, encryption, versioned
backup, and locking. Locking prevents two writers from racing. It does not make
every plan safe, and it does not protect against a person with broad backend
authority.

Recovery requires more than downloading an old state file. Record state
lineage, serial, configuration commit, provider locks, backend identity, and the
remote system condition. Restoring state without checking remote objects can
create a false view of reality.

Commands such as `terraform state mv` and `terraform state rm` operate directly
on the binding. They can be necessary in emergencies, but they are sharp tools.
Prefer declarative refactoring when possible, back up state, target exact
addresses, preview the result, and keep human approval separate.

The local lab proves empty state after destroy. That fact does not prove that a
real remote backend is configured, locked, or recoverable.

## Refactoring Without Recreating Infrastructure

Changing code structure should not automatically recreate remote resources.
Terraform identifies resources by address. Rename a module without recording
the move and Terraform may see one old address to destroy and one new address
to create.

A declarative `moved` block records intent:

```hcl
moved {
  from = module.queue.aws_sqs_queue.jobs
  to   = module.messaging.aws_sqs_queue.jobs
}
```

The block becomes reviewable history. In the proven lifecycle, the plan reports
that the queue “has moved to” the new address with zero create and zero destroy
actions. State then binds the existing queue to the new address.

An `import` block brings an existing remote object under a Terraform address.
It does not generate a complete, maintainable module contract. After import,
review the plan for every unmanaged default and decide what configuration
should own.

State inspection helps verify addresses and identity. Direct state operations
should remain an emergency path because the intent is not preserved in normal
configuration review.

Before a refactor, ask:

- Is this the same remote object or a migration to a new object?
- Does the destination address already exist?
- Does the provider require replacement for any changed argument?
- Are references and policies updated?
- Is state backed up and locked?
- What plan proves zero unintended create or destroy?
- How will the team remove the moved block only after all supported upgrade
  paths have passed it?

## Identity, Secrets, and Least Privilege

The worker needs two small capabilities: read and write objects in one bucket,
and receive, delete, and send messages on one queue. The unsafe starter grants
`Action = "*"` and `Resource = "*"`. Valid JSON and valid Terraform do not make
that policy acceptable.

The repaired policy builds exact resource identities from module outputs. This
also creates dependency edges. Review both actions and resources. A narrow
action list with `Resource = "*"` is still broad. An exact resource with
`Action = "*"` is also broad.

Avoid long-lived cloud credentials in code, variable files, prompts, terminal
history, plans, state, and evidence bundles. Prefer workload identity and
short-lived credentials in real environments. The local lab uses the literal
value `test`, but only after `local_mode=true` and an approved localhost
endpoint are both present.

Sensitive marking reduces display. It does not remove a value from state, logs
created outside Terraform, or provider requests. Redact evidence at the source
and record what category was removed.

An agent can propose a policy, but it should not approve its own authority.
Policy tests, plan review, runtime identity controls, and human approval remain
independent.

## Build the Local Cloud Foundation

The foundation contains eight resources:

1. S3 bucket;
2. S3 versioning;
3. S3 public-access block;
4. SQS job queue;
5. DynamoDB job-state table;
6. IAM worker role;
7. IAM inline worker policy;
8. CloudWatch log group.

Floci provides a small AWS-shaped local endpoint. It lets the course prove real
provider operations without a cloud account. The runner rejects every endpoint
except localhost on port 4566, requires an `s7-` prefix, uses fixed command
arrays, and accepts only Terraform or OpenTofu.

The final Terraform run recorded eight JSON-plan create actions, direct API
reads in all five domains, one state move, one in-place update, no-change
convergence, eight-resource destroy, empty state, and empty APIs. OpenTofu
completed the same behaviour in another copy.

The runner applies only saved plans whose shapes match the contract. Invoking
the named command is explicit approval for this disposable local lifecycle. It
does not approve a real-cloud action.

Fresh final Floci samples peaked at 36.2 MiB for Terraform and 61.83 MiB for
OpenTofu. These are observations from this machine, not universal performance
guarantees.

## Small Plans and Reviewable Agent Changes

Plan review starts with action classes. An in-place update, replacement,
unknown value, data read, import, move, and deletion are not “seven changes” of
equal meaning.

Keep plans small by splitting work along lifecycle and ownership boundaries. A
queue timeout change should not also rename storage, upgrade a provider, and
refactor identity. A smaller plan makes replacement and unknown values easier
to see.

For every replacement, ask what identity and data will be lost, how dependents
move, whether create-before-destroy is possible, and how rollback works. A
replacement marker is a design signal, not a normal formatting detail.

Unknown values need context. Some are safe outputs of objects that will be
created. Others prevent policy or routing review. If the exact resource ARN is
unknown, require a deterministic boundary or defer approval until the value can
be reviewed.

Reject noisy unrelated diffs. Generated code often reformats files or upgrades
dependencies outside the request. Evidence should derive changed files and
plan actions rather than trust the agent summary.

The operator challenge asks you to review one in-place update, one replacement,
one unknown policy value, and one moved address. A statement such as “four safe
updates” is not an acceptable plan summary.

## OpenTofu Compatibility and Migration Record

A useful compatibility record names exact inputs and decisions:

- Terraform and OpenTofu versions;
- provider source, version, and lock hash;
- configuration and test commit;
- validation and JSON-plan result;
- graph identity;
- state address and moved result;
- create, update, convergence, destroy, and direct API evidence;
- known differences;
- owner, rollback, and approval status.

In Section 7, both tools selected AWS provider 6.61.0 and completed the same
eight-resource local behaviour. Their registry sources, lock hashes, and graph
hashes differ. A graph hash can differ because tool output identity differs;
the important expected nodes and behaviours still passed.

Migration should use a disposable or backed-up copy first. Reinitialize with
the target tool, inspect its lock changes, validate, create a plan without
applying, and compare actions and unknowns. Do not let both tools write the same
state concurrently. Define the rollback tool, lock file, binary version, and
last accepted state before changing production authority.

The final status is candidate ready for human review. Local compatibility does
not prove every provider, backend, workspace, policy, or production operation.

### Review clinic: separate language, engine, and provider

It helps to separate three layers. HCL is the language used to express the
configuration. Terraform or OpenTofu is the engine that evaluates the
configuration and manages state. Providers are separate programs that translate
resource operations into API calls. Two tools can accept the same HCL and still
produce a different lock source, diagnostic, graph representation, or plan in
an edge case. A provider upgrade can change behaviour even when the engine and
HCL stay unchanged.

This separation gives us a practical review method. First review the requested
infrastructure intent. Then identify the engine, provider source, provider
version, and state that will interpret that intent. Finally, run the evidence
gate with those exact components. “Works with Terraform” is too broad. “The
recorded lifecycle passed with Terraform 1.14.8 and AWS provider 6.61.0 against
the approved local endpoint” is an evidence-backed statement.

### Review clinic: read a plan as a typed change set

Do not reduce a plan to its final count. Read the reason for every important
action. A create may be an intended new object or an accidental address change.
An update may alter a harmless tag or a security control. A replacement combines
create and destroy around a change of identity. A read may delay values until
apply. A move changes the state address while keeping remote identity.

JSON plans make this classification testable. The lifecycle gate counts
`resource_changes[].change.actions` instead of searching coloured terminal
text. Human review still matters because two resources with the same action can
have very different business risk. The machine establishes the shape; the
operator interprets the consequence.

### Review clinic: use the graph to find blast radius

The graph explains more than execution order. It also explains the blast radius
of an unknown value. If the bucket ARN changes, follow its outgoing edges: the
identity policy consumes it, so policy planning may also change. A reviewer who
examines only the bucket misses that downstream authority decision.

Use the graph as a question generator, not as decoration. Which node owns the
value? Which nodes consume it? Can independent nodes still run in parallel?
Does an explicit dependency create a larger wait boundary than required? When
a graph changes, compare the expected owners and relationships before trusting
a hash or an image of the graph.

### Review clinic: reproducibility needs an upgrade path

Pinning forever is not the goal. The goal is to make change intentional. A
normal initialization should reuse the reviewed lock. A planned upgrade should
run an explicit upgrade command on a dedicated change, show the constraint and
lock diff, and rerun validation, tests, plans, and important lifecycle cases.
That separation lets reviewers distinguish infrastructure logic from dependency
behaviour.

Commit the dependency lock for executable root modules. In reusable library
modules, declare compatible constraints and let the consuming root own the
selection. If a security fix requires a new provider, record the reason, test
evidence, and rollback version. “Latest” is not an acceptance criterion.

### Review clinic: design module contracts around decisions

Ask what a caller must decide and what the module should own. The storage caller
chooses a prefix and approved configuration; the module owns the bucket,
versioning, and public-access block as one safety boundary. The identity module
accepts exact resource ARNs instead of discovering all buckets or queues. This
makes authority visible at the call site.

Defaults deserve review because they are decisions made on behalf of every
caller. Use defaults for low-risk, widely accepted behaviour. Require explicit
inputs for region, retention, public exposure, deletion behaviour, or other
choices with operational consequence. A good agent task names the contract it
may change and the evidence required if that public interface changes.

### Review clinic: separate four different truths

Configuration says what should exist. State says what Terraform currently binds
and remembers. A plan describes the proposed transition under one set of inputs
and observations. The remote API reports what exists now. These views can
disagree because of drift, a failed apply, an import, a manual change, or a stale
plan.

Recovery starts by preserving all four views, including state lineage and
serial. Do not immediately edit state to
make a plan look clean. Identify why the views differ, protect data, select the
authoritative intent, and then choose import, move, configuration repair, or a
controlled remote correction. After the repair, prove convergence and keep the
evidence with the change record.

### Review clinic: treat addresses as a public compatibility surface

Resource addresses include module paths, resource names, and instance keys.
Changing from `count` indexes to `for_each` keys can therefore be a state
refactor even when remote objects are unchanged. Stable business keys such as
environment or queue name are usually easier to maintain than positional
indexes, but the migration still needs an explicit address mapping.

Keep moved declarations long enough for every supported starting version to
cross the refactor. Removing them after one successful apply can break an
environment that upgrades later. Define the minimum supported version, test
that upgrade path, and remove old moves only in a deliberate compatibility
cleanup.

### Review clinic: separate credentials from permissions

Credentials answer “who is calling now?” Permissions answer “what may that
identity do?” Terraform may define a future workload role while the Terraform
process uses a separate deployment identity. Do not confuse a narrow workload
policy with narrow deployment authority.

In production, constrain the deployment identity, use short sessions, separate
plan and apply roles where practical, record the account and region, and require
approval for privileged operations. The local endpoint guard in this section is
an example of fail-closed targeting: test credentials are accepted only when
local mode and the exact localhost endpoint agree.

### Review clinic: label the boundary of local proof

The local lifecycle proves provider-driven creation, state tracking, direct API
observation, a declarative move, an in-place update, convergence, and cleanup
for the named fixture. It is stronger than syntax-only validation and remains
small enough for learners to repeat.

It does not prove AWS service parity, production IAM enforcement, remote state
locking, multi-region behaviour, quotas, real billing, or organization policy.
Later environments must add evidence for those boundaries. Good engineering
does not dismiss local proof because it is limited; it labels the limit and
uses the smallest environment capable of answering the current question.

### Review clinic: give the agent a change budget

Scope is a safety mechanism. Name permitted directories, forbidden files,
expected action classes, maximum resource count, and stop conditions before an
agent edits code. Ask it to return exact commands and evidence, not only a
natural-language summary. If the plan exceeds the declared budget, stop and
explain the difference.

This does not mean every change has an identical numeric limit. A disposable
fixture and a production database migration need different gates. The important
point is to define expected shape before seeing the generated result. Otherwise
it is easy to rationalize an unexpected replacement after the fact.

### Review clinic: migration transfers write authority

The target tool should first operate on a disposable copy or backed-up state
under non-production credentials. Compare diagnostics, provider selection, lock
changes, state reading, refresh, and JSON plan actions. Resolve differences
before granting write authority. During cutover, stop the old writer, preserve
the last accepted state and locks, run the approved target plan, and record the
new owner.

Rollback is not simply reinstalling the previous binary. It requires a state
and lock that the previous tool can safely interpret, plus a remote system that
has not crossed an irreversible boundary. Write that decision before migration,
especially for provider or backend changes.

## Section checkpoint

You now have a complete mental model for the local foundation:

- configuration is evaluated as a graph, not file order;
- providers define resource planning behaviour;
- constraints and lock files create reproducible dependencies;
- modules express ownership and contracts;
- state binds addresses to remote identity and needs protection;
- declarative moves preserve identity during refactoring;
- least privilege and sensitive handling remain separate controls;
- small plans make action classes reviewable;
- compatibility is an evidence record, not an assumption.

Continue to the lab and build the two proven local paths yourself.
