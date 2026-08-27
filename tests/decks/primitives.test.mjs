import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createHubDiagram,
  createLoopDiagram,
  createPipelineDiagram,
  renderDiagram,
} from '../../scripts/decks/lib/primitives.mjs';

test('clockwise loop declares the intended ports for every connector', () => {
  const diagram = createLoopDiagram(['goal', 'inspect', 'act', 'observe', 'verify', 'evidence']);
  assert.deepEqual(
    diagram.edges.map(({from, fromPort, to, toPort}) => `${from}.${fromPort}->${to}.${toPort}`),
    [
      'goal.right->inspect.left',
      'inspect.right->act.left',
      'act.right->observe.left',
      'observe.bottom->verify.right',
      'verify.left->evidence.right',
      'evidence.left->goal.bottom',
    ],
  );
  assert.deepEqual(diagram.errors, []);
});

test('five-node loop closes below the diagram without crossing a box', () => {
  const diagram = createLoopDiagram(['ask', 'suggest', 'human edit', 'human run', 'read result']);
  assert.deepEqual(diagram.errors, []);
  assert.match(diagram.edges.at(-1).route.d, /C/);
  assert.ok(diagram.edges.at(-1).route.c1.y > 335);
  const html = renderDiagram(diagram);
  assert.match(html, /data-edge-id="human-run-to-read-result"[^>]+data-from-port="bottom"[^>]+data-to-port="right"/);
  assert.match(html, /data-edge-id="read-result-to-ask"[^>]+data-from-port="left"[^>]+data-to-port="bottom"/);
});

test('hub rays start and finish on rectangle boundaries, never at the center label', () => {
  const diagram = createHubDiagram(['agentic IaC', 'intent', 'context', 'plan', 'tools']);
  assert.deepEqual(diagram.errors, []);
  for (const edge of diagram.edges) {
    assert.notDeepEqual(edge.route.start, {x: 550, y: 190});
    assert.notDeepEqual(edge.route.end, {x: 550, y: 190});
  }
  assert.match(renderDiagram(diagram), /data-edge-id="agentic-iac-to-intent"/);
  assert.doesNotMatch(renderDiagram(diagram), /M550,190/);
});

test('rendered semantic nodes and edges carry machine-checkable metadata', () => {
  const html = renderDiagram(createLoopDiagram(['goal', 'inspect', 'act', 'observe', 'verify', 'evidence']));
  assert.match(html, /data-node-id="observe"/);
  assert.match(html, /data-edge-id="observe-to-verify"/);
  assert.match(html, /data-from="observe"/);
  assert.match(html, /data-from-port="bottom"/);
  assert.match(html, /data-to="verify"/);
  assert.match(html, /data-to-port="right"/);

  const firstEdge = html.indexOf('data-edge-id=');
  const firstNode = html.indexOf('data-node-id=');
  assert.ok(firstEdge >= 0 && firstEdge < firstNode, 'connectors must render behind boxes');
});

test('fragment diagrams reveal each connector with its destination node', () => {
  const html = renderDiagram(createPipelineDiagram(['source', 'check', 'decision'], {fragments: true}));
  assert.equal((html.match(/class="fragment semantic-step"/g) || []).length, 2);
  assert.match(html, /class="fragment semantic-step">[\s\S]*data-from="source" data-to="check"[\s\S]*data-node-id="check"/);
  assert.doesNotMatch(html.match(/^.*?<g class="fragment semantic-step">/s)?.[0] || '', /data-node-id="check"/);
});
