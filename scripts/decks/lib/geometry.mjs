const PORT_NAMES = new Set(['top', 'right', 'bottom', 'left']);

const samePoint = (left, right, tolerance = 0.001) =>
  Math.abs(left.x - right.x) <= tolerance && Math.abs(left.y - right.y) <= tolerance;

const pointInside = (point, node, clearance = 0) =>
  point.x > node.x - clearance &&
  point.x < node.x + node.width + clearance &&
  point.y > node.y - clearance &&
  point.y < node.y + node.height + clearance;

const pointText = (point) => `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;

export function rect(id, x, y, width, height) {
  if (!id) throw new Error('rectangle id is required');
  for (const [name, value] of Object.entries({x, y, width, height})) {
    if (!Number.isFinite(value)) throw new Error(`${id}: ${name} must be finite`);
  }
  if (width <= 0 || height <= 0) throw new Error(`${id}: rectangle dimensions must be positive`);
  return Object.freeze({id, x, y, width, height});
}

export function center(node) {
  return {x: node.x + node.width / 2, y: node.y + node.height / 2};
}

export function port(node, name) {
  if (!PORT_NAMES.has(name)) throw new Error(`${node.id}: unknown port ${name}`);
  const midpoint = center(node);
  if (name === 'top') return {x: midpoint.x, y: node.y};
  if (name === 'right') return {x: node.x + node.width, y: midpoint.y};
  if (name === 'bottom') return {x: midpoint.x, y: node.y + node.height};
  return {x: node.x, y: midpoint.y};
}

export function boundaryToward(node, target) {
  const origin = center(node);
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  if (dx === 0 && dy === 0) throw new Error(`${node.id}: target cannot equal rectangle center`);

  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : (node.width / 2) / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : (node.height / 2) / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return {x: origin.x + dx * scale, y: origin.y + dy * scale};
}

export function linePath(start, end) {
  return Object.freeze({
    kind: 'line',
    start: {...start},
    end: {...end},
    d: `M${start.x},${start.y} L${end.x},${end.y}`,
  });
}

export function cubicPath(start, c1, c2, end) {
  return Object.freeze({
    kind: 'cubic',
    start: {...start},
    c1: {...c1},
    c2: {...c2},
    end: {...end},
    d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`,
  });
}

function cubicPoint(route, t) {
  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  return {
    x: u2 * u * route.start.x + 3 * u2 * t * route.c1.x + 3 * u * t2 * route.c2.x + t2 * t * route.end.x,
    y: u2 * u * route.start.y + 3 * u2 * t * route.c1.y + 3 * u * t2 * route.c2.y + t2 * t * route.end.y,
  };
}

export function sampleRoute(route, steps = 100) {
  if (!Number.isInteger(steps) || steps < 2) throw new Error('route samples must be an integer of at least 2');
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    if (route.kind === 'line') {
      points.push({
        x: route.start.x + (route.end.x - route.start.x) * t,
        y: route.start.y + (route.end.y - route.start.y) * t,
      });
    } else if (route.kind === 'cubic') {
      points.push(cubicPoint(route, t));
    } else {
      throw new Error(`unknown route kind ${route.kind}`);
    }
  }
  return points;
}

function targetInwardNormal(portName) {
  if (portName === 'left') return {x: 1, y: 0};
  if (portName === 'right') return {x: -1, y: 0};
  if (portName === 'top') return {x: 0, y: 1};
  return {x: 0, y: -1};
}

function finalTangent(route) {
  const previous = route.kind === 'cubic' ? route.c2 : route.start;
  return {x: route.end.x - previous.x, y: route.end.y - previous.y};
}

export function validateEdge(edge, nodes, {clearance = 6} = {}) {
  const errors = [];
  const source = nodes.find((node) => node.id === edge.from);
  const target = nodes.find((node) => node.id === edge.to);
  if (!source) errors.push(`${edge.id}: source node ${edge.from} does not exist`);
  if (!target) errors.push(`${edge.id}: target node ${edge.to} does not exist`);
  if (!source || !target) return errors;

  let expectedStart;
  let expectedEnd;
  try {
    expectedStart = port(source, edge.fromPort);
    expectedEnd = port(target, edge.toPort);
  } catch (error) {
    errors.push(`${edge.id}: ${error.message}`);
    return errors;
  }

  if (!samePoint(edge.route.start, expectedStart)) {
    errors.push(`${edge.id}: route does not start at declared source port ${edge.from}.${edge.fromPort}`);
  }
  if (!samePoint(edge.route.end, expectedEnd)) {
    errors.push(`${edge.id}: route does not end at declared target port ${edge.to}.${edge.toPort}`);
  }

  const tangent = finalTangent(edge.route);
  const normal = targetInwardNormal(edge.toPort);
  if (tangent.x * normal.x + tangent.y * normal.y <= 0) {
    errors.push(`${edge.id}: final tangent points away from target port ${edge.to}.${edge.toPort}`);
  }

  const samples = sampleRoute(edge.route);
  for (const node of nodes) {
    if (node.id === source.id || node.id === target.id) continue;
    const collision = samples.find((point) => pointInside(point, node, clearance));
    if (collision) errors.push(`${edge.id}: connector crosses node ${node.id} at ${pointText(collision)}`);
  }

  const middleSamples = samples.slice(1, -1);
  const sourceCollision = middleSamples.find((point) => pointInside(point, source));
  if (sourceCollision) {
    errors.push(`${edge.id}: connector remains inside source node ${source.id} at ${pointText(sourceCollision)}`);
  }
  const targetCollision = middleSamples.find((point) => pointInside(point, target));
  if (targetCollision) {
    errors.push(`${edge.id}: connector enters target node ${target.id} before its boundary at ${pointText(targetCollision)}`);
  }

  return [...new Set(errors)];
}
