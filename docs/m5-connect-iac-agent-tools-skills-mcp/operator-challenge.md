---
sidebar_position: 3
title: 'Operator Challenge: Review a Capability Update'
---

# Operator Challenge: Review a Capability Update

Your platform team has received an updated Skill and MCP server request. Review
the request as a new admission case. Do not install or run either capability.

## Updated Skill request

```yaml
name: terraform-review
version: 1.1.0
owner: platform-automation
artifact_sha256: 9f4c-new-unverified-hash
requested_executables: [terraform]
requested_operations: [fmt, validate]
requested_filesystem:
  read: [modules/queue/**]
  write: [evidence/**]
requested_network: [registry.terraform.io]
tests:
  status: not-run-for-this-hash
revocation:
  owner: platform-automation
  action: remove the admitted hash
```

The maintainer says network access is needed to download provider schemas. The
current course workflow is provider-free and does not use the network.

## Updated server request

```json
{
  "name": "queue-operations",
  "version": "2.3.1",
  "owner": "platform-integrations",
  "artifactSha256": "7a31-new-unverified-hash",
  "protocolVersion": "2026-07-28",
  "requestedAuthority": {
    "filesystem": ["section-5/fixture/queue-context.md"],
    "network": [],
    "secrets": ["QUEUE_ADMIN_TOKEN"]
  },
  "advertisedCapabilities": {
    "resources": ["iac://course/queue-review"],
    "tools": [
      {"name": "rotate_queue_secret", "readOnlyHint": true}
    ]
  },
  "tests": {"status": "passed-before-packaging"}
}
```

The server calls secret rotation read-only because it does not edit a
repository file.

## Your task

Write an `admit`, `reject`, or `defer` decision for each capability. Include:

1. exact capability and version;
2. requested filesystem, command, network, secret, and operation authority;
3. at least two decision reasons;
4. artifact hash and test status for that exact hash;
5. owner and revocation action;
6. evidence required before reconsideration;
7. evidence limits;
8. whether human approval remains required.

If only part of a package is useful, explain how you would split the
capability. Do not accept a mutating tool because its annotation says
`readOnlyHint: true`.

## Review questions

- Does an owner name authenticate the publisher?
- Does a hash prove that an artifact is safe?
- Can a test result from before packaging be attached to a new hash?
- Is secret rotation read-only because no repository file changes?
- Should a provider-free review receive network access for a future use case?
- Which control enforces filesystem and secret access at runtime?
- What decision is required before the server can rotate a real secret?

## Acceptance criteria

Your review is complete when it:

- does not install or run either package;
- evaluates the exact version and artifact hash;
- records requested authority in concrete terms;
- treats metadata and annotations as review inputs, not enforcement;
- requires tests against the packaged hash;
- names an owner and revocation action;
- separates a resources-only path from a mutating tool path;
- keeps human approval pending for mutation.

## Checkpoint

Ask another learner to identify one decision based on current need and one
decision based on missing evidence.

The answer key remains outside the default learner site. Complete your review
before comparing it with `section-5/challenge/answer-key.md` in the labs
repository.
