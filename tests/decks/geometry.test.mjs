import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cubicPath,
  linePath,
  port,
  rect,
  validateEdge,
} from '../../scripts/decks/lib/geometry.mjs';

test('ports use exact rectangle boundaries', () => {
  const node = rect('observe', 810, 145, 170, 70);
  assert.deepEqual(port(node, 'top'), {x: 895, y: 145});
  assert.deepEqual(port(node, 'right'), {x: 980, y: 180});
  assert.deepEqual(port(node, 'bottom'), {x: 895, y: 215});
  assert.deepEqual(port(node, 'left'), {x: 810, y: 180});
});

test('a clockwise corner avoids both nodes', () => {
  const observe = rect('observe', 810, 145, 170, 70);
  const verify = rect('verify', 585, 265, 170, 70);
  const route = cubicPath(
    port(observe, 'bottom'),
    {x: 895, y: 250},
    {x: 790, y: 300},
    port(verify, 'right'),
  );

  assert.deepEqual(
    validateEdge({
      id: 'observe-to-verify',
      from: observe.id,
      fromPort: 'bottom',
      to: verify.id,
      toPort: 'right',
      route,
    }, [observe, verify]),
    [],
  );
});

test('a route through an unrelated node reports the collision', () => {
  const source = rect('source', 0, 0, 100, 50);
  const blocker = rect('blocker', 140, 0, 100, 50);
  const target = rect('target', 280, 0, 100, 50);
  const route = cubicPath(
    port(source, 'right'),
    {x: 160, y: 25},
    {x: 220, y: 25},
    port(target, 'left'),
  );

  assert.match(
    validateEdge({
      id: 'bad',
      from: source.id,
      fromPort: 'right',
      to: target.id,
      toPort: 'left',
      route,
    }, [source, blocker, target]).join('\n'),
    /bad.*blocker/,
  );
});

test('a route must end at its declared target port', () => {
  const source = rect('source', 0, 0, 100, 50);
  const target = rect('target', 200, 0, 100, 50);
  const route = linePath(port(source, 'right'), port(target, 'right'));

  assert.match(
    validateEdge({
      id: 'wrong-target-port',
      from: source.id,
      fromPort: 'right',
      to: target.id,
      toPort: 'left',
      route,
    }, [source, target]).join('\n'),
    /wrong-target-port.*target port/,
  );
});
