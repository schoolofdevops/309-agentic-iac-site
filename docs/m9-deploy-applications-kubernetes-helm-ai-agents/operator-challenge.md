---
sidebar_position: 3
title: 'Operator Challenge - Independent Evidence Packet Review'
description: Review three Kubernetes and Helm evidence packets, then define bounded verification and recovery proof without changing a cluster.
---

# Operator Challenge: Independent Evidence Packet Review

You are the operator for the local `inference-platform` release. The starting
release was healthy: all three roles were ready, the API returned HTTP 200, and
`job-0001` moved from queued to complete. You receive three incident evidence
packets captured from controlled, sequential failures.

This is an independent packet-only review. You do not inject a fault, receive
a named fault, or run a repair command. Work only from the evidence shown on
this page.

:::warning[Keep the evidence trails independent]

Treat each incident as a separate window. Finish the diagnosis and complete
the recovery proof before considering the next incident. Do the same for B
before C. Do not use a later packet to explain an earlier one.

:::

For every packet, your response must:

1. state the **likely layer and cause** without claiming more than the packet
   supports;
2. cite the exact Pod status, rollout status, events, EndpointSlice, live
   object, logs, values, render, Service, or client evidence you used;
3. explain which apparently healthy signal did not clear the incident;
4. propose one **bounded verification** that would distinguish your diagnosis
   from a reasonable alternative;
5. describe the smallest repair boundary without writing a repair command; and
6. define the **recovery proof** required before the next incident begins.

Record your answers in your course notes or in a copy of the worksheet at the
end of this page.

## Incident A

The rollout of a new API revision does not complete. The existing revision
continues to serve, so a high-level availability check remains green.

### Evidence packet

**Pod status**

```text
NAME                                      READY   STATUS    RESTARTS
inference-platform-api-<old-revision>     1/1     Running   0
inference-platform-api-<new-revision>     0/1     Running   0
```

**Rollout status**

```text
Waiting for deployment "inference-platform-api" rollout to finish:
1 old replicas are pending termination...
error: timed out waiting for the condition
```

**Events**

```text
TYPE      REASON      OBJECT                                  MESSAGE
Warning   Unhealthy   pod/inference-platform-api-<new>        Readiness probe failed: HTTP probe failed with statuscode: 404
```

**EndpointSlice**

```text
NAME                           ADDRESSES                 READY
inference-platform-api-<id>    10.244.0.5,10.244.0.8    true,false
```

**Live Deployment and Helm render comparison**

```text
live readiness HTTP route:        <route A>
stored Helm readiness HTTP route: <route B>
comparison:                        different
Deployment Available condition:   True
```

**Logs**

```text
(no application log line)
```

Your diagnosis must account for all four facts together: the old revision is
ready, the new process is running, the new endpoint is not ready, and the
kubelet received HTTP 404. Explain why empty application logs do not cancel the
probe event. State whether the first failing layer is image startup, process
liveness, readiness, endpoint selection, or the external client path.

Your bounded verification should compare one live field with its stored
release intent and one application route observation. Your recovery proof must
include a completed API rollout, one ready current-revision Pod, a ready
EndpointSlice address, and HTTP 200 through the original client path.

## Incident B

The first incident has been recovered. A replacement worker now remains
unready, while the earlier worker revision can still poll work.

### Evidence packet

**Pod status**

```text
NAME                                      READY   STATUS    RESTARTS
inference-platform-worker-<old>           1/1     Running   0
inference-platform-worker-<new>           0/1     Running   0
```

**Rollout status**

```text
Waiting for deployment "inference-platform-worker" rollout to finish:
1 old replicas are pending termination...
error: timed out waiting for the condition
```

**Events**

```text
TYPE      REASON      OBJECT                                     MESSAGE
Warning   Unhealthy   pod/inference-platform-worker-<new>        Readiness probe failed: HTTP probe failed with statuscode: 503
```

**Dependency EndpointSlice**

```text
NAME                                      PORTS   ENDPOINTS
inference-platform-dependencies-<id>      8081    10.244.0.6
```

**Live Deployment**

```text
BACKEND_URL: http://<unresolved-service>:8081
```

**Logs from the replacement Pod**

```text
[pod/inference-platform-worker-<new>/worker] worker poll failed:
lookup <unresolved-service>: no such host
```

**Stored Helm render**

```text
name: BACKEND_URL
valueFrom:
  configMapKeyRef:
    name: inference-platform
    key: BACKEND_URL
```

Your diagnosis must explain why a ready dependency endpoint does not clear the
replacement worker. Separate DNS resolution evidence from NetworkPolicy
evidence; this runtime made no policy-enforcement claim. Compare the live
configuration source with the stored render and identify the smallest ownership
layer that can explain the difference.

Your bounded verification should show whether the intended ConfigMap reference
resolves to the ready dependency Service without exposing any credential. Your
recovery proof must include a successful worker rollout, one ready
current-revision worker, the still-ready dependency EndpointSlice, and a worker
poll that no longer reports the packet failure.

## Incident C

The worker incident has been recovered. The API Pod and its in-cluster endpoint
are healthy, but the original host request fails after a release revision.

### Evidence packet

**Pod and rollout status**

```text
NAME                                      READY   STATUS    RESTARTS
inference-platform-api-<current>          1/1     Running   0

deployment "inference-platform-api" successfully rolled out
```

**Service events**

```text
No resources found in inference namespace.
```

**EndpointSlice**

```text
NAME                           PORTS   ENDPOINTS     READY
inference-platform-api-<id>    8080    10.244.0.8   true
```

**Live Deployment and logs**

```text
readiness HTTP route: consistent with stored release
Deployment Available condition: True
(no application error)
```

**Helm values, Helm render, live Service, and Kind mapping**

```text
stored release node-facing port:  <changed-port>
rendered Service node-facing port: <changed-port>
live Service node-facing port:     <changed-port>
fixed Kind host mapping target:    <baseline-port>
comparison:                        changed-port and baseline-port differ
```

**Original host client path**

```text
curl: (52) Empty reply from server
ready HTTP 000
```

Your diagnosis must explain why a ready Pod, successful rollout, and ready
EndpointSlice do not prove the host path. Decide whether the packet supports an
application, probe, endpoint, Service, release-values, or host-mapping layer.
Cite the three pieces of evidence that agree and the one boundary that differs.

Your bounded verification should compare the current release intent with the
fixed local-cluster mapping without changing the cluster. Your recovery proof
must retain the healthy API rollout and endpoint, restore agreement at the
node-facing boundary, and return HTTP 200 through the original host path.

## Operator worksheet

Record your answers before comparing them with an instructor-led review.

| Incident | Likely layer and cause | Exact supporting evidence | Healthy signal that did not clear it | Bounded verification | Smallest repair boundary | Recovery proof |
|---|---|---|---|---|---|---|
| A |  |  |  |  |  |  |
| B |  |  |  |  |  |  |
| C |  |  |  |  |  |  |

Close with two proof limits:

- explain why these packets do not prove NetworkPolicy enforcement; and
- state why three recovered local incidents do not authorize a production
  deployment.
