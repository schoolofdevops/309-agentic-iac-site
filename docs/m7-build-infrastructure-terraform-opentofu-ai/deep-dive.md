---
sidebar_position: 4
title: Deep Dive - Plans, State, Locks, and Refactoring Failure Modes
description: Examine the difficult boundaries behind unknown values, provider planning, graph cycles, state lineage, lock checksums, imports, moves, and mixed Terraform/OpenTofu operation.
---

# Deep Dive: Plans, State, Locks, and Refactoring Failure Modes

This deep dive audits the parts of Terraform that a generated HCL diff can
hide. The goal is not to memorize internal implementation. The goal is to know
which evidence to request before trusting a plan or refactor.

## Unknown is a value state, not a wildcard approval

Terraform can know a value's type and dependency before it knows the final
value. A new queue ARN is a common example. The provider will assign the value
during apply.

Unknowns become risky when they cross a review boundary. If an IAM resource is
unknown, a reviewer may be unable to prove least privilege. If a replacement
name is unknown, the team may be unable to verify naming, routing, retention,
or migration.

Classify each important unknown:

- expected computed identity with a narrow typed destination;
- delayed data-source result caused by graph timing;
- value hidden because a provider cannot plan it;
- sensitive value deliberately concealed from display;
- unacceptable missing evidence needed for approval.

Do not replace the unknown with a model guess. Change the design, add a
deterministic assertion, or stop until the evidence is available.

## Provider planning is executable behaviour

HCL describes intent, but provider code interprets resource schemas, reads
remote APIs, calculates diffs, and executes operations. A provider upgrade can
change defaults, validation, computed fields, replacement behaviour, retries,
or API handling without changing your HCL.

This is why an open provider range is not merely a dependency-management style
issue. Section 7's unsafe range selected 6.62.0; the reviewed Phase 0 lifecycle
used 6.61.0. Both configurations were valid.

Review provider upgrades as code changes:

1. read the release notes and upgrade guide;
2. inspect constraint and lock diffs;
3. run initialization in a clean working copy;
4. validate and run module tests;
5. compare JSON plans on controlled fixtures;
6. test state refresh and important replacement paths;
7. record rollback to the previous binary and lock.

An agent may help summarize release notes. The observed plan and tests remain
the acceptance evidence.

## Graph cycles reveal confused ownership

Terraform builds edges from references before it schedules operations. A cycle
means no node can start without a result from another node that eventually
depends on the first.

Agents sometimes respond to cycles by adding `depends_on`, splitting an
expression, or retrying planning. These actions do not remove the circular
information need.

Draw the ownership graph. Find the value that both sides are trying to produce.
Move stable identity into an input, separate creation from attachment, or give
one component clear ownership.

Broad module-level `depends_on` can also turn many values unknown. If module B
depends on all of module A, Terraform may delay reads that only needed one
stable output. Prefer references to the exact outputs that create real edges.

## State lineage and serial matter during recovery

State is not only a JSON list of resources. Terraform tracks lineage and serial
information to identify a state history. Remote backends can add locking and
version retention.

Restoring an old state file without checking lineage and remote objects can
cause Terraform to propose duplicate creation or destructive reconciliation.
Before recovery, preserve:

- current and candidate state versions;
- lineage and serial;
- backend and workspace identity;
- configuration commit;
- CLI and provider locks;
- active lock owner;
- remote object inventory;
- reason for recovery and approving person.

After restore, run refresh and plan under controlled credentials. Do not apply
until the plan matches the intended remote reality.

## Lock checksums are identity evidence

The dependency lock records provider source, version, constraints, and package
hashes. Hash schemes and available platform packages can affect the entries.

A checksum proves that a downloaded package matches a recorded package. It
does not prove the provider is safe, compatible, or free of defects. Review the
source and version first.

Terraform and OpenTofu may use different registry sources for the same provider
version. Section 7 records two different lock hashes. Treat that difference as
an owned compatibility decision. Do not normalize it away with a text rewrite.

For multi-platform teams, generate reviewed hashes through the tool's provider
lock workflow. Avoid allowing each developer machine to create an unexplained
lock diff during ordinary work.

## Moves, imports, and direct state commands solve different problems

A `moved` block says one address is now another address. It is declarative and
reviewable. It should produce a plan with a move and no remote recreate.

An `import` block says an existing remote object should bind to an address. The
configuration must still describe the object. The first post-import plan can
show defaults or attributes that the generated configuration missed.

`terraform state mv` changes the binding directly. It can repair an urgent
state mismatch, but the intent is not preserved as normal configuration. It
requires exact backups, addresses, owner, and follow-up plan evidence.

Common failure modes include:

- moving to an address that already owns another object;
- moving only one resource while references still use the old module;
- forgetting nested or indexed addresses;
- importing the wrong regional or account identity;
- removing state and assuming the remote object was deleted;
- deleting a moved block before every supported upgrade path has passed it;
- applying with a different provider lock after the move plan was reviewed.

## Replacement is a migration decision

A replacement marker means remote identity changes. For data-bearing resources,
that is a migration, not an ordinary update.

Review data inventory, backup, copy, drain, consumers, identity policies,
network paths, DNS or routing, downtime, rollback, and final deletion approval.
Lifecycle settings such as `create_before_destroy` can change order, but they do
not solve naming conflicts, data copy, cost, or application cutover.

If an agent summary says “safe update” while the plan contains `-/+`, the plan
outranks the summary.

## Mixed-tool operation needs one writer policy

Terraform and OpenTofu can both read much of the same configuration, but a team
still needs an operating policy:

- Which tool is allowed to write each state?
- Where are tool-specific locks generated and reviewed?
- Which CI runner and binary versions are authoritative?
- How are plans compared during migration?
- What provider and backend differences are supported?
- How is rollback performed?

Do not run the two tools concurrently against one state. Backend locking may
serialize writes, but it does not make their dependency resolution and
behaviour identical.

Section 7 uses separate disposable working copies and prefixes. It proves the
same local lifecycle while keeping lock identity distinct.

## Evaluation checklist

Before accepting agent-generated Terraform or OpenTofu work, ask:

1. Which claims are supported by format, validation, test, plan, state, direct
   API, or runtime evidence?
2. Which unknowns cross an approval boundary?
3. Which graph edges and owners explain execution order?
4. Which provider source, version, and checksums were evaluated?
5. Which plan actions update, replace, delete, move, import, or read?
6. Which state lineage, lock, backup, and recovery facts exist?
7. Which identities and sensitive values can enter state or logs?
8. Which tool may write, and which person approves the next action?

If the evidence cannot answer an important question, the correct result is a
safe stop, not a more confident agent summary.

## Failure rehearsal: prove the stop path too

A mature Terraform evaluation does not test only the successful path. Create
controlled negative fixtures that prove the workflow rejects an unapproved
endpoint, an open provider range, a wildcard policy, an unexpected replacement,
or a plan larger than the stated budget. The failure message should tell the
operator which contract was violated and what evidence is missing.

Keep negative tests harmless. They should fail before a real apply and should
not depend on damaging a shared environment. In Section 7, endpoint and prefix
guards are checked before the lifecycle runner can invoke a tool. Contract tests
inspect plan shape and source structure. This creates a layered boundary: the
task contract limits intent, the runner limits execution, and the evidence gate
limits acceptance.

Also rehearse interruption and recovery. Ask what remains if initialization,
planning, apply, refactoring, or destroy stops halfway. Preserve the working
directory and state until the operator has inspected them. A cleanup script
should target only named course resources and report what it removed. The happy
path proves feasibility; controlled stop and recovery make it operable.

Record who ran the rehearsal, which fixture and versions were used, which guard
stopped the operation, and whether cleanup completed. This turns a negative test
into evidence another operator can review instead of a one-time terminal event.
