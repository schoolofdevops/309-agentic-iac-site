---
sidebar_position: 3
title: 'Operator Challenge - Diagnose Kubernetes and Helm Failures'
description: Diagnose three sequential failures from Kubernetes and Helm evidence, recover each one, and keep the evidence trails independent.
---

# Operator Challenge: Diagnose Kubernetes and Helm Failures

The repaired `inference-platform` release begins healthy on the exact
`agentic-iac-s9` cluster. The API, dependency service, and worker are ready. A
request can move from queued to complete and return the deterministic result.

You now own three incident windows. Each begins with a controlled change from
the learner repository task. The top-level symptom is similar: the workload is
not usable through an expected path. The evidence is different.

Open the
[Section 9 diagnostic task](https://github.com/schoolofdevops/309-agentic-iac-labs/blob/main/section-9/challenge/task.md)
for the tested injection and observation steps. Do not open its answer key.

:::warning[Keep the incidents independent]

Run only one incident at a time. Collect the full evidence set, write your
diagnosis, make the smallest recovery, and complete the recovery proof before
you begin the next incident. If a recovery does not pass, stop. A later failure
must not hide an earlier one.

:::

## Incident 1: A New API Pod Does Not Become Ready

The API rollout times out. One older API Pod can remain `1/1 Running` while a
new Pod is `0/1 Running`. The release may therefore retain some availability
even though the new revision cannot enter normal Service traffic.

Collect these observations before writing a diagnosis:

| Evidence | Record this fact |
|---|---|
| Pod status | Old and new Pod names, ready columns, restarts, and age |
| Rollout status | Exact timeout and the Deployment named by it |
| Events | Warning reason, object identity, HTTP result, and age |
| EndpointSlice | Addresses and each endpoint's ready condition |
| Live Deployment | Current API readiness route and availability condition |
| Logs | Output from both API Pods, including an explicit empty result |
| Helm render | Intended API readiness route in the stored release manifest |

Do not assume that an empty application log clears the workload. A kubelet
probe can receive a failing HTTP response without the application writing a log
line. Do not assume that `Available=True` clears the new revision. The old Pod
can keep the Deployment available during a failed rolling update.

Write a short incident note with:

1. the client or rollout symptom;
2. the first evidence layer that remains healthy;
3. the first evidence layer that fails;
4. whether live state and Helm intent agree;
5. one smallest-scope recovery;
6. the Pod, endpoint, and HTTP 200 observations that will close the incident.

After the controlled recovery, preserve the successful rollout, ready Pod,
ready EndpointSlice address, and host readiness response. Continue only after
the exact API path returns HTTP 200.

## Incident 2: A Replacement Worker Cannot Serve Its Role

The worker rollout times out. An older worker may stay ready while a replacement
worker remains `0/1 Running`. The replacement readiness response indicates a
dependency problem, but the real dependency Service still has a ready endpoint.

Collect the same categories against the worker revision:

| Evidence | Record this fact |
|---|---|
| Pod status | Both worker Pod identities and ready conditions |
| Rollout status | Exact timeout and revision progress |
| Events | Worker readiness response and object name |
| EndpointSlice | Current dependency address and port |
| Live Deployment | Effective dependency setting in the replacement worker |
| Logs | Prefixed log lines tied to the failing Pod identity |
| Helm render | Intended source of the worker dependency setting |

Keep endpoint existence separate from client configuration. A ready dependency
does not help a process that is trying another destination. Keep DNS evidence
separate from NetworkPolicy evidence. This core profile has no NetworkPolicy
enforcement claim.

Your diagnosis should identify the failed relationship without copying a fix
from the task. Explain why the real dependency endpoint does or does not clear
the dependency service itself. Compare the live Deployment with the Helm
render. Propose one field-level recovery that restores reviewed release intent
without changing the application, dependency Deployment, or unrelated role.

Complete recovery with a successful worker rollout, one ready worker Pod, and
the still-ready dependency EndpointSlice. Do not begin Incident 3 while a new
worker revision remains unready.

## Incident 3: Pods Are Healthy but the Host Request Fails

The API Pod is ready. The API rollout is successful. The EndpointSlice has a
ready backend. The readiness path in the Deployment remains correct. The host
request still fails.

This incident adds release and Service evidence because Pod health is not the
same as the host-to-Service path:

| Evidence | Record this fact |
|---|---|
| Pod status | Ready API identity with restart count |
| Rollout status | Successful API Deployment result |
| Events | Service-specific query, including a valid empty result |
| EndpointSlice | Ready API address and target port |
| Live Deployment | Probe route and availability |
| Logs | API output or explicit absence of an application error |
| Helm values | Stored Service setting for the current revision |
| Helm render | Service setting generated from those values |
| Live Service | Type, Service port, target port, and node-facing port |
| Client path | Exact host request result without hiding the exit |

Do not repair the Pod simply because the user-visible request fails. First show
which in-cluster layers are healthy. Then compare Helm values, Helm render, the
live Service, and the fixed Kind host mapping. Decide where the first mismatch
appears.

Your incident note must explain what healthy Pods and ready endpoints prove and
what they do not prove. Name the release input or live field that owns the
broken hop. Propose the smallest recovery that returns to reviewed values. Do
not change the Kind cluster configuration, API image, probe, or unrelated
Service.

Close the incident with the restored rendered Service setting, successful API
rollout, ready Pod, ready endpoint, and an HTTP 200 response through the
original host path.

## Submit Your Operator Record

Submit one table with a row for each incident:

| Incident | Symptom | Healthy boundary | First failed evidence | Intent versus live state | Smallest recovery | Recovery proof |
|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |

Add a final paragraph that answers:

- Why did similar top-level symptoms require evidence from different layers?
- Which observation prevented you from changing the wrong component?
- Which proof limit applies to NetworkPolicy in this exercise?
- What authority still belongs to a human after all three recoveries pass?

The learner repository keeps the explanation separate. Complete your record
first. Then compare it with:

```bash
sed -n '1,260p' section-9/challenge/answer-key.md
```

The answer key supports self-review. It does not turn local recovery into
deployment approval or NetworkPolicy enforcement evidence.
