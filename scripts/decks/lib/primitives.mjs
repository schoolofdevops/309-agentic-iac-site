import {
  boundaryToward,
  center,
  cubicPath,
  linePath,
  port,
  rect,
  validateEdge,
} from './geometry.mjs';

const INK = '#1e1e1e';
const GRAY = '#757575';
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export function slugId(value) {
  return String(value)
    .toLowerCase()
    .replaceAll('|', ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function labelText(x, y, value, className = 'lbl-sm', anchor = 'middle', lineHeight = 21) {
  const parts = String(value).split('|');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${parts.map((part, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeHtml(part)}</tspan>`).join('')}</text>`;
}

function semanticNode(label, x, y, width, height, index, role = 'node') {
  return {
    ...rect(slugId(label), x, y, width, height),
    label,
    fill: FILLS[index % FILLS.length],
    role,
  };
}

function edge(id, from, fromPort, to, toPort, route, extra = {}) {
  return {id, from, fromPort, to, toPort, route, ...extra};
}

function validateDiagram(nodes, edges) {
  return edges.flatMap((connector) => validateEdge(connector, nodes));
}

export function createLoopDiagram(items, {fragments = false} = {}) {
  if (![5, 6].includes(items.length)) throw new Error('loop diagrams require five or six nodes');
  const positions = [[120, 145], [330, 55], [585, 55], [810, 145], [585, 265], [330, 265]];
  const nodes = items.map((item, index) => semanticNode(item, ...positions[index], 170, 70, index));
  const [left, upperLeft, upperRight, right, lowerRight, lowerLeft] = nodes;
  const edges = [
    edge(`${left.id}-to-${upperLeft.id}`, left.id, 'right', upperLeft.id, 'left', cubicPath(
      port(left, 'right'), {x: 310, y: 180}, {x: 310, y: 90}, port(upperLeft, 'left'),
    )),
    edge(`${upperLeft.id}-to-${upperRight.id}`, upperLeft.id, 'right', upperRight.id, 'left', linePath(
      port(upperLeft, 'right'), port(upperRight, 'left'),
    )),
    edge(`${upperRight.id}-to-${right.id}`, upperRight.id, 'right', right.id, 'left', cubicPath(
      port(upperRight, 'right'), {x: 785, y: 90}, {x: 790, y: 180}, port(right, 'left'),
    )),
    edge(`${right.id}-to-${lowerRight.id}`, right.id, 'bottom', lowerRight.id, 'right', cubicPath(
      port(right, 'bottom'), {x: 895, y: 250}, {x: 790, y: 300}, port(lowerRight, 'right'),
    )),
  ];

  if (lowerLeft) {
    edges.push(
      edge(`${lowerRight.id}-to-${lowerLeft.id}`, lowerRight.id, 'left', lowerLeft.id, 'right', linePath(
        port(lowerRight, 'left'), port(lowerLeft, 'right'),
      )),
      edge(`${lowerLeft.id}-to-${left.id}`, lowerLeft.id, 'left', left.id, 'bottom', cubicPath(
        port(lowerLeft, 'left'), {x: 280, y: 300}, {x: 205, y: 250}, port(left, 'bottom'),
      )),
    );
  } else {
    edges.push(edge(`${lowerRight.id}-to-${left.id}`, lowerRight.id, 'left', left.id, 'bottom', cubicPath(
      port(lowerRight, 'left'), {x: 500, y: 350}, {x: 205, y: 350}, port(left, 'bottom'),
    )));
  }

  return {kind: 'loop', nodes, edges, fragments, errors: validateDiagram(nodes, edges)};
}

export function createHubDiagram(items, {fragments = false} = {}) {
  if (items.length < 2 || items.length > 7) throw new Error('hub diagrams require a center and one to six satellites');
  const [centerLabel, ...satelliteLabels] = items;
  const centerNode = semanticNode(centerLabel, 405, 145, 290, 90, 1, 'hub');
  const positions = [[120, 75], [430, 35], [760, 75], [120, 245], [430, 285], [760, 245]];
  const satellites = satelliteLabels.map((label, index) => semanticNode(label, ...positions[index], 220, 84, index));
  const nodes = [centerNode, ...satellites];
  const edges = satellites.map((satellite) => {
    const fromPoint = boundaryToward(centerNode, center(satellite));
    const toPoint = boundaryToward(satellite, center(centerNode));
    return edge(
      `${centerNode.id}-to-${satellite.id}`,
      centerNode.id,
      'ray',
      satellite.id,
      'ray',
      linePath(fromPoint, toPoint),
      {fromPoint, toPoint},
    );
  });
  return {kind: 'hub', nodes, edges, fragments, errors: validateDiagram(nodes, edges)};
}

export function createPipelineDiagram(items, {fragments = false} = {}) {
  const gap = items.length > 6 ? 22 : 34;
  const width = Math.floor((1000 - gap * (items.length - 1)) / items.length);
  const nodes = items.map((item, index) => semanticNode(item, 50 + index * (width + gap), 125, width, 110, index));
  const edges = nodes.slice(0, -1).map((source, index) => {
    const target = nodes[index + 1];
    return edge(`${source.id}-to-${target.id}`, source.id, 'right', target.id, 'left', linePath(
      port(source, 'right'), port(target, 'left'),
    ));
  });
  return {kind: 'pipeline', nodes, edges, fragments, errors: validateDiagram(nodes, edges)};
}

function renderEdge(connector) {
  return `<path data-edge-id="${escapeHtml(connector.id)}" data-from="${escapeHtml(connector.from)}" data-to="${escapeHtml(connector.to)}" data-from-port="${escapeHtml(connector.fromPort)}" data-to-port="${escapeHtml(connector.toPort)}" d="${connector.route.d}" marker-end="url(#ahg)"/>`;
}

function renderNode(node, index) {
  const labelY = node.y + (node.height - (String(node.label).split('|').length - 1) * 21) / 2 + 7;
  return `<g class="semantic-node" data-node-id="${escapeHtml(node.id)}" data-x="${node.x}" data-y="${node.y}" data-width="${node.width}" data-height="${node.height}"><g filter="url(#rough)" stroke="${INK}" stroke-width="${node.role === 'hub' ? 3 : 2.5}"><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${node.role === 'hub' ? 16 : 12}" fill="${node.fill}"/></g>${labelText(node.x + node.width / 2, labelY, node.label, node.role === 'hub' ? 'lbl-b' : 'lbl-sm')}</g>`;
}

export function renderDiagram(diagram) {
  if (diagram.errors.length) throw new Error(`invalid ${diagram.kind} diagram:\n${diagram.errors.join('\n')}`);
  // Keep connectors crisp. The rough filter can clip short paths and their
  // arrowheads even when the geometry is valid, which makes causal direction
  // disappear in the rendered deck. Boxes retain the hand-drawn treatment.
  const edgeGroup = (connector) => `<g class="semantic-edges" fill="none" stroke="${GRAY}" stroke-width="2.1">${renderEdge(connector)}</g>`;
  if (!diagram.fragments) {
    const edges = `<g class="semantic-edges" fill="none" stroke="${GRAY}" stroke-width="2.1">${diagram.edges.map(renderEdge).join('')}</g>`;
    const nodes = diagram.nodes.map((node, index) => renderNode(node, index)).join('');
    return `${edges}${nodes}`;
  }

  const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]));
  const initialNode = diagram.nodes.find((node) => node.role === 'hub') || diagram.nodes[0];
  const renderedNodes = new Set([initialNode.id]);
  const steps = diagram.edges.map((connector) => {
    const target = nodeById.get(connector.to);
    const targetHtml = target && !renderedNodes.has(target.id)
      ? renderNode(target, diagram.nodes.indexOf(target))
      : '';
    if (target) renderedNodes.add(target.id);
    return `<g class="fragment semantic-step">${edgeGroup(connector)}${targetHtml}</g>`;
  }).join('');
  return `${renderNode(initialNode, diagram.nodes.indexOf(initialNode))}${steps}`;
}

function withFoot(svg, foot, y = 385) {
  return `${svg}${foot ? labelText(550, y, foot, 'lbl-g') : ''}`;
}

export function pipeline(items, options = {}) {
  return withFoot(renderDiagram(createPipelineDiagram(items, options)), options.foot, 315);
}

export function clockwiseLoop(items, options = {}) {
  return withFoot(renderDiagram(createLoopDiagram(items, options)), options.foot);
}

export function hub(items, options = {}) {
  return withFoot(renderDiagram(createHubDiagram(items, options)), options.foot);
}

export function compare(items, {foot = '', fragments = false} = {}) {
  const [left, leftSub, right, rightSub] = items;
  if (fragments) {
    return `
    <g filter="url(#rough)" stroke="${INK}" stroke-width="2.8">
      <rect x="70" y="70" width="430" height="210" rx="16" fill="#dae8fc"/>
    </g>
    ${labelText(285, 125, left, 'lbl-b')}
    ${labelText(285, 180, leftSub, 'lbl', 'middle', 30)}
    <g class="fragment">
      <g filter="url(#rough)" stroke="${INK}" stroke-width="2.8"><rect x="600" y="70" width="430" height="210" rx="16" fill="#e1d5e7"/></g>
      ${labelText(815, 125, right, 'lbl-b')}
      ${labelText(815, 180, rightSub, 'lbl', 'middle', 30)}
    </g>
    <g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2.2"><line x1="535" y1="75" x2="565" y2="275"/></g>
    ${foot ? labelText(550, 335, foot, 'lbl-g') : ''}`;
  }
  return `
    <g filter="url(#rough)" stroke="${INK}" stroke-width="2.8">
      <rect x="70" y="70" width="430" height="210" rx="16" fill="#dae8fc"/>
      <rect x="600" y="70" width="430" height="210" rx="16" fill="#e1d5e7"/>
    </g>
    ${labelText(285, 125, left, 'lbl-b')}
    ${labelText(285, 180, leftSub, 'lbl', 'middle', 30)}
    ${labelText(815, 125, right, 'lbl-b')}
    ${labelText(815, 180, rightSub, 'lbl', 'middle', 30)}
    <g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2.2"><line x1="535" y1="75" x2="565" y2="275"/></g>
    ${foot ? labelText(550, 335, foot, 'lbl-g') : ''}`;
}

export function cards(items, {fragments = false, foot = ''} = {}) {
  const columns = items.length <= 4 ? items.length : 3;
  const rows = Math.ceil(items.length / columns);
  const width = columns === 4 ? 235 : 290;
  const height = rows === 1 ? 150 : 118;
  const gapX = columns === 4 ? 25 : 55;
  const startX = (1100 - (columns * width + (columns - 1) * gapX)) / 2;
  const startY = rows === 1 ? 105 : 70;
  const rendered = items.map((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (width + gapX);
    const y = startY + row * (height + 24);
    const fragment = fragments && index > 0 ? ' class="fragment"' : '';
    return `<g${fragment}><g filter="url(#rough)" stroke="${INK}" stroke-width="2.5"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="13" fill="${FILLS[index % FILLS.length]}"/></g>${labelText(x + width / 2, y + 45, item, 'lbl-b', 'middle', 25)}</g>`;
  }).join('');
  return withFoot(rendered, foot, 345);
}

export function ladder(items, {fragments = false, foot = ''} = {}) {
  const width = 150;
  const rendered = items.map((item, index) => {
    const x = 70 + index * 168;
    const y = 295 - index * 38;
    const fragment = fragments && index > 0 ? ' class="fragment"' : '';
    return `<g${fragment}><g filter="url(#rough)" stroke="${INK}" stroke-width="2.5"><rect x="${x}" y="${y}" width="${width}" height="${48 + index * 8}" rx="10" fill="${FILLS[Math.min(index, 3)]}"/></g>${labelText(x + width / 2, y + 30, item, 'lbl-sm')}</g>`;
  }).join('');
  return withFoot(rendered, foot);
}

export function boundary(items, {foot = ''} = {}) {
  const [centerLabel, ...rules] = items;
  const positions = [[215, 105], [885, 105], [215, 280], [885, 280], [550, 300]];
  return `
    <g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2.5" stroke-dasharray="10 7"><rect x="90" y="45" width="920" height="285" rx="24"/></g>
    <g filter="url(#rough)" stroke="${INK}" stroke-width="3"><rect x="390" y="130" width="320" height="110" rx="16" fill="#e1d5e7"/></g>
    ${labelText(550, 178, centerLabel, 'lbl-b')}
    ${rules.map((rule, index) => labelText(positions[index][0], positions[index][1], rule, 'lbl-sm')).join('')}
    ${foot ? labelText(550, 375, foot, 'lbl-g') : ''}`;
}

export function icons(items) {
  const compact = items.length > 5;
  const width = compact ? 145 : 175;
  const gap = compact ? 30 : 35;
  const start = compact ? 40 : 35;
  // Keep the original five-card geometry byte-for-byte stable for Module 1.
  const center = compact ? width / 2 : 87;
  return items.map((item, index) => {
    const x = start + index * (width + gap);
    const fragment = index === 0 ? '' : ' class="fragment"';
    return `<g${fragment} transform="translate(${x},0)"><g filter="url(#rough)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="7 6"><rect x="0" y="80" width="${width}" height="180" rx="16"/></g><g filter="url(#rough)" stroke="${INK}" stroke-width="2.5"><circle cx="${center}" cy="135" r="32" fill="${FILLS[index % FILLS.length]}"/><path d="M${center - 22},135 L${center - 5},151 L${center + 26},116" fill="none"/></g>${labelText(center, 205, item, 'lbl-b', 'middle', 24)}</g>`;
  }).join('');
}

export function renderVisual(slide) {
  const options = {fragments: slide.fragments, foot: slide.foot || ''};
  if (slide.type === 'compare') return compare(slide.items, options);
  if (slide.type === 'cards') return cards(slide.items, options);
  if (slide.type === 'hub') return hub(slide.items, options);
  if (slide.type === 'ladder') return ladder(slide.items, options);
  if (slide.type === 'boundary') return boundary(slide.items, options);
  if (slide.type === 'loop') return clockwiseLoop(slide.items, options);
  if (slide.type === 'icons') return icons(slide.items);
  return pipeline(slide.items, options);
}
