import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual, slugId} from './lib/primitives.mjs';
import {boundaryToward, center, cubicPath, linePath, port, rect, validateEdge} from './lib/geometry.mjs';
import {slides} from './specs/m3-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m3-plan-iac-before-agent-codes.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');
const INK = '#1e1e1e';
const GRAY = '#757575';
const RED = '#c62828';
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (number) => `M3&middot;${String(number).padStart(2, '0')}`;

export function validateSlideSequence(candidateSlides) {
  const seen = new Set();
  for (const slide of candidateSlides) {
    if (seen.has(slide.n)) throw new Error(`duplicate slide number ${slide.n}`);
    seen.add(slide.n);
  }
  const expected = Array.from({length: candidateSlides.length}, (_, index) => index + 1);
  const actual = candidateSlides.map((slide) => slide.n);
  if (actual.some((number, index) => number !== expected[index])) {
    throw new Error(`slide numbers must be contiguous from 1; received ${actual.join(', ')}`);
  }
}

function text(x, y, value, className = 'lbl-sm', anchor = 'middle', lineHeight = 22) {
  const lines = String(value).split('|');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeHtml(line)}</tspan>`).join('')}</text>`;
}

function node(label, x, y, width, height, fill = '#dae8fc', id = slugId(label), {stroke = INK, dash = ''} = {}) {
  const box = rect(id, x, y, width, height);
  const labelY = y + (height - (String(label).split('|').length - 1) * 22) / 2 + 7;
  return {
    box,
    html: `<g class="semantic-node" data-node-id="${id}" data-x="${x}" data-y="${y}" data-width="${width}" data-height="${height}"><g filter="url(#rough)" stroke="${stroke}" stroke-width="2.6"${dash ? ` stroke-dasharray="${dash}"` : ''}><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="13" fill="${fill}"/></g>${text(x + width / 2, labelY, label, 'lbl-b')}</g>`,
  };
}

function edge(id, from, fromPort, to, toPort, route, nodes, {gray = true, fragment = false, dashed = false, fromPoint, toPoint} = {}) {
  const connector = {id, from, fromPort, to, toPort, route, fromPoint, toPoint};
  const errors = validateEdge(connector, nodes.map((item) => item.box));
  if (errors.length) throw new Error(`invalid M3 connector ${id}: ${errors.join('; ')}`);
  const classes = fragment ? ' class="fragment"' : '';
  return `<g${classes} fill="none" stroke="${gray ? GRAY : INK}" stroke-width="2.2"${dashed ? ' stroke-dasharray="6 6"' : ''}><path data-edge-id="${id}" data-from="${from}" data-to="${to}" data-from-port="${fromPort}" data-to-port="${toPort}" d="${route.d}" marker-end="url(#${gray ? 'ahg' : 'ah'})"/></g>`;
}

function pipeline(items, {fragment = false, foot = '', fills = FILLS} = {}) {
  const gap = items.length > 5 ? 24 : 36;
  const width = Math.floor((1010 - gap * (items.length - 1)) / items.length);
  const nodes = items.map((label, index) => node(label, 45 + index * (width + gap), 125, width, 110, fills[index % fills.length], `${slugId(label)}-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => {
    const target = nodes[index + 1];
    return edge(`${source.box.id}-to-${target.box.id}`, source.box.id, 'right', target.box.id, 'left', linePath(port(source.box, 'right'), port(target.box, 'left')), nodes);
  });
  const diagram = fragment
    ? `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}`
    : `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
  return `${diagram}${foot ? text(550, 320, foot, 'lbl-g') : ''}`;
}

function hub(items, {foot = '', fragment = false} = {}) {
  const [centerLabel, ...satellites] = items;
  const hubNode = node(centerLabel, 420, 150, 260, 90, '#e1d5e7', slugId(centerLabel));
  const positions = [[55, 55], [390, 35], [760, 55], [55, 270], [390, 285], [760, 270], [880, 165]];
  const outer = satellites.map((label, index) => node(label, positions[index][0], positions[index][1], 170, 76, FILLS[index % FILLS.length], `${slugId(label)}-${index + 1}`));
  const nodes = [hubNode, ...outer];
  const edges = outer.map((target) => {
    const start = boundaryToward(hubNode.box, center(target.box));
    const end = boundaryToward(target.box, center(hubNode.box));
    return edge(`${hubNode.box.id}-to-${target.box.id}`, hubNode.box.id, 'ray', target.box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end});
  });
  const diagram = fragment
    ? `${hubNode.html}${edges.map((connector, index) => `<g class="fragment">${connector}${outer[index].html}</g>`).join('')}`
    : `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
  return `${diagram}${foot ? text(550, 390, foot, 'lbl-g') : ''}`;
}

function ownerHandoffs() {
  const labels = ['approved|behaviour', 'Terraform|queue', 'Helm|reference', 'GitOps|promotion', 'application|job flow'];
  const width = 170;
  const nodes = labels.map((label, index) => node(label, 35 + index * 215, 75, width, 82, FILLS[index % FILLS.length], `owner-${index + 1}`));
  const secret = node('secret|management', 685, 275, 185, 82, '#e1d5e7', 'secret-owner');
  nodes.push(secret);
  const edges = nodes.slice(0, 4).map((source, index) => edge(`owner-${index + 1}-handoff`, source.box.id, 'right', nodes[index + 1].box.id, 'left', linePath(port(source.box, 'right'), port(nodes[index + 1].box, 'left')), nodes));
  const secretEdge = edge('secret-to-application', secret.box.id, 'top', nodes[4].box.id, 'bottom', linePath(port(secret.box, 'top'), port(nodes[4].box, 'bottom')), nodes, {dashed: true});
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}<g class="fragment">${secretEdge}${secret.html}</g>${text(777, 385, 'runtime value lookup', 'lbl-g')}`;
}

function stateCollision() {
  const testPlan = node('test plan', 80, 65, 190, 80, '#dae8fc', 'test-plan');
  const production = node('production|apply', 80, 260, 190, 80, '#ffe6cc', 'production-apply');
  const state = node('remote://platform/|production', 710, 125, 300, 125, '#f8cecc', 'shared-state', {stroke: RED});
  const nodes = [testPlan, production, state];
  const edges = [
    edge('test-claims-production-state', testPlan.box.id, 'right', state.box.id, 'top', cubicPath(port(testPlan.box, 'right'), {x: 450, y: 105}, {x: 850, y: 55}, port(state.box, 'top')), nodes),
    edge('production-claims-production-state', production.box.id, 'right', state.box.id, 'bottom', cubicPath(port(production.box, 'right'), {x: 450, y: 300}, {x: 850, y: 320}, port(state.box, 'bottom')), nodes),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(610, 365, 'mixed queue identities', 'lbl-b')}`;
}

function destructiveGate() {
  const depth = node('queue depth|> 0', 45, 55, 170, 80, '#dae8fc', 'queue-depth');
  const inflight = node('in-flight work|> 0', 45, 260, 170, 80, '#dae8fc', 'in-flight-work');
  const drain = node('drain + retention|evidence', 340, 150, 220, 100, '#ffe6cc', 'drain-evidence');
  const gate = node('DELETE|LOCKED', 650, 150, 170, 100, '#f8cecc', 'drain-gate', {stroke: RED});
  const approval = node('named human|approval pending', 900, 55, 170, 85, '#e1d5e7', 'destructive-approval');
  const remove = node('remove later', 900, 260, 170, 80, '#fff', 'remove-later', {dash: '8 6'});
  const nodes = [depth, inflight, drain, gate, approval, remove];
  const edges = [
    edge('depth-to-drain-evidence', depth.box.id, 'right', drain.box.id, 'top', cubicPath(port(depth.box, 'right'), {x: 270, y: 95}, {x: 420, y: 95}, port(drain.box, 'top')), nodes),
    edge('inflight-to-drain-evidence', inflight.box.id, 'right', drain.box.id, 'bottom', cubicPath(port(inflight.box, 'right'), {x: 270, y: 300}, {x: 420, y: 300}, port(drain.box, 'bottom')), nodes),
    edge('drain-evidence-to-gate', drain.box.id, 'right', gate.box.id, 'left', linePath(port(drain.box, 'right'), port(gate.box, 'left')), nodes),
    edge('gate-to-approval', gate.box.id, 'right', approval.box.id, 'left', cubicPath(port(gate.box, 'right'), {x: 865, y: 200}, {x: 850, y: 98}, port(approval.box, 'left')), nodes, {dashed: true}),
    edge('approval-to-remove', approval.box.id, 'bottom', remove.box.id, 'top', linePath(port(approval.box, 'bottom'), port(remove.box, 'top')), nodes, {dashed: true}),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(735, 305, 'wait for zero depth + zero in-flight', 'lbl-g')}`;
}

function rollbackOrder() {
  const labels = ['stop new|jobs', 'observe depth|+ in-flight', 'drain or|recover', 'restore old|route', 'retain data|for checks', 'approve removal|later'];
  const positions = [[40, 55], [425, 55], [810, 55], [810, 250], [425, 250], [40, 250]];
  const nodes = labels.map((label, index) => node(label, positions[index][0], positions[index][1], 245, 90, index === 5 ? '#e1d5e7' : FILLS[index % FILLS.length], `rollback-step-${index + 1}`));
  const routes = [
    ['right', 'left'], ['right', 'left'], ['bottom', 'top'], ['left', 'right'], ['left', 'right'],
  ];
  const edges = nodes.slice(0, -1).map((source, index) => edge(`rollback-${index + 1}-to-${index + 2}`, source.box.id, routes[index][0], nodes[index + 1].box.id, routes[index][1], linePath(port(source.box, routes[index][0]), port(nodes[index + 1].box, routes[index][1])), nodes, {dashed: index === 4}));
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}`;
}

function boundedGraph() {
  const api = node('API', 255, 90, 130, 65, '#dae8fc', 'bounded-api');
  const queue = node('queue', 470, 90, 140, 65, '#ffe6cc', 'bounded-queue');
  const worker = node('worker', 695, 90, 140, 65, '#dae8fc', 'bounded-worker');
  const result = node('result', 695, 245, 140, 65, '#d5e8d4', 'bounded-result');
  const secret = node('secret manager', 355, 245, 190, 65, '#e1d5e7', 'bounded-secret');
  const nodes = [api, queue, worker, result, secret];
  const edges = [
    edge('bounded-api-to-queue', api.box.id, 'right', queue.box.id, 'left', linePath(port(api.box, 'right'), port(queue.box, 'left')), nodes),
    edge('bounded-queue-to-worker', queue.box.id, 'right', worker.box.id, 'left', linePath(port(queue.box, 'right'), port(worker.box, 'left')), nodes),
    edge('bounded-worker-to-result', worker.box.id, 'bottom', result.box.id, 'top', linePath(port(worker.box, 'bottom'), port(result.box, 'top')), nodes),
    edge('bounded-secret-to-api', secret.box.id, 'left', api.box.id, 'bottom', cubicPath(port(secret.box, 'left'), {x: 300, y: 277}, {x: 320, y: 205}, port(api.box, 'bottom')), nodes, {dashed: true}),
    edge('bounded-secret-to-worker', secret.box.id, 'right', worker.box.id, 'bottom', cubicPath(port(secret.box, 'right'), {x: 620, y: 277}, {x: 765, y: 220}, port(worker.box, 'bottom')), nodes, {dashed: true}),
  ];
  return `<g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2.5" stroke-dasharray="10 7"><rect x="175" y="35" width="750" height="320" rx="24"/></g>${text(550, 375, 'smallest graph that answers this decision', 'lbl-g')}${edges.join('')}${nodes.map((item) => item.html).join('')}`;
}

function nodeAnatomy() {
  const outer = node('job-queue', 100, 45, 900, 300, '#dae8fc', 'job-queue-anatomy');
  const fields = [
    ['unique ID', 'queue.job-queue'], ['type', 'system'], ['description', 'asynchronous job buffer'],
    ['lifecycle owner', 'platform'], ['trust boundary', 'workload platform'], ['model status', 'candidate'],
  ];
  const fieldHtml = fields.map(([name, value], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 145 + column * 285;
    const y = 125 + row * 100;
    return `<g filter="url(#rough)" stroke="${INK}" stroke-width="2"><rect x="${x}" y="${y}" width="240" height="68" rx="10" fill="#fff"/></g>${text(x + 120, y + 27, name, 'lbl-b')}${text(x + 120, y + 52, value, 'lbl-sm')}`;
  }).join('');
  return `${outer.html}${fieldHtml}`;
}

function calmRelationships() {
  const client = node('client', 40, 140, 175, 85, '#dae8fc', 'calm-client');
  const api = node('API', 315, 140, 175, 85, '#e1d5e7', 'calm-api');
  const queue = node('queue', 600, 140, 175, 85, '#ffe6cc', 'calm-queue');
  const worker = node('worker', 875, 140, 175, 85, '#d5e8d4', 'calm-worker');
  const nodes = [client, api, queue, worker];
  const specs = [
    [client, api, 'client-interacts-api', 'interacts|HTTPS'],
    [api, queue, 'api-connects-queue', 'connects|queue-publish'],
    [queue, worker, 'queue-connects-worker', 'connects|queue-consume'],
  ];
  const edges = specs.map(([source, target, id], index) => edge(id, source.box.id, 'right', target.box.id, 'left', linePath(port(source.box, 'right'), port(target.box, 'left')), nodes, {gray: index !== 1}));
  const labels = specs.map((entry, index) => text(265 + index * 280, 105, entry[3], 'lbl-g')).join('');
  return `${client.html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}${labels}`;
}

function evidenceGates() {
  const labels = ['CALM|schema', 'local semantic|rules', 'organizational|policy', 'named human|approval', 'runtime|observation'];
  const limits = ['shape only', 'encoded rules', 'org requirements', 'design decision', 'deployed behaviour'];
  const nodes = labels.map((label, index) => node(label, 35 + index * 215, 105, 175, 90, index === 2 ? '#ffe6cc' : index === 3 ? '#e1d5e7' : '#dae8fc', `evidence-gate-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => edge(`evidence-gate-${index + 1}-to-${index + 2}`, source.box.id, 'right', nodes[index + 1].box.id, 'left', linePath(port(source.box, 'right'), port(nodes[index + 1].box, 'left')), nodes, {dashed: true}));
  const limitsHtml = limits.map((limit, index) => text(122 + index * 215, 240, `proves: ${limit}`, 'lbl-g')).join('');
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}${limitsHtml}${text(550, 305, 'no gate can stand in for the next gate', 'lbl-b')}`;
}

function stateBoundaries(items) {
  const boxes = items.map((label, index) => {
    const x = 55 + index * 350;
    return `<g><g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2.5" stroke-dasharray="9 7"><rect x="${x}" y="55" width="290" height="275" rx="20"/></g>${text(x + 145, 105, label, 'lbl-b')}${text(x + 145, 180, `queue-${index === 0 ? 'local' : index === 1 ? 'test' : 'prod'}`, 'lbl')}${text(x + 145, 250, 'unique recovery path', 'lbl-g')}</g>`;
  }).join('');
  return `${boxes}${text(550, 380, 'separate identity · separate owner · separate recovery', 'lbl-g')}`;
}

function threeLifecycles() {
  const pairs = [
    ['queue ID + policy ID', 'Terraform state'],
    ['job payload + status + result', 'runtime storage'],
    ['credential value', 'secret manager'],
  ];
  const nodes = [];
  const edges = [];
  pairs.forEach((pair, index) => {
    const x = 55 + index * 355;
    const source = node(pair[0], x, 70, 280, 90, FILLS[index], `value-${index + 1}`);
    const target = node(pair[1], x, 245, 280, 90, FILLS[index], `owner-${index + 1}`);
    nodes.push(source, target);
    edges.push(edge(`value-${index + 1}-to-owner-${index + 1}`, source.box.id, 'bottom', target.box.id, 'top', linePath(port(source.box, 'bottom'), port(target.box, 'top')), nodes));
  });
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
}

function lifecycleLanes(items) {
  return items.map((item, index) => {
    const [owner, detail] = item.split('|');
    const y = 35 + index * 70;
    return `<g><g filter="url(#rough)" stroke="${INK}" stroke-width="2.3"><rect x="80" y="${y}" width="220" height="52" rx="10" fill="${FILLS[index % FILLS.length]}"/><rect x="345" y="${y}" width="675" height="52" rx="10" fill="#fff"/></g>${text(190, y + 34, owner, 'lbl-b')}${text(680, y + 34, detail, 'lbl')}</g>`;
  }).join('');
}

function secretRuntime() {
  const secret = node('secret manager|value + version', 80, 140, 250, 110, '#e1d5e7', 'secret-manager');
  const api = node('API runtime', 650, 65, 210, 80, '#dae8fc', 'api-runtime');
  const worker = node('worker runtime', 650, 260, 210, 80, '#dae8fc', 'worker-runtime');
  const nodes = [secret, api, worker];
  const edges = [
    edge('secret-to-api-runtime', secret.box.id, 'right', api.box.id, 'left', cubicPath(port(secret.box, 'right'), {x: 475, y: 195}, {x: 500, y: 105}, port(api.box, 'left')), nodes, {dashed: true}),
    edge('secret-to-worker-runtime', secret.box.id, 'right', worker.box.id, 'left', cubicPath(port(secret.box, 'right'), {x: 475, y: 195}, {x: 500, y: 300}, port(worker.box, 'left')), nodes, {dashed: true}),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(960, 120, 'Git: reference only', 'lbl-g')}${text(960, 315, 'state: reference only', 'lbl-g')}`;
}

function queueGraph() {
  const client = node('client', 25, 80, 145, 72, '#dae8fc', 'client');
  const api = node('API', 225, 80, 145, 72, '#dae8fc', 'api');
  const queue = node('queue', 430, 80, 145, 72, '#ffe6cc', 'queue');
  const worker = node('worker', 635, 80, 145, 72, '#dae8fc', 'worker');
  const result = node('result store', 855, 80, 190, 72, '#d5e8d4', 'result-store');
  const secret = node('secret manager', 430, 285, 190, 72, '#e1d5e7', 'secret-manager');
  const nodes = [client, api, queue, worker, result, secret];
  const chainNodes = [client, api, queue, worker, result];
  const chain = chainNodes.slice(0, -1).map((source, index) => {
    const target = chainNodes[index + 1];
    return edge(`${source.box.id}-to-${target.box.id}`, source.box.id, 'right', target.box.id, 'left', linePath(port(source.box, 'right'), port(target.box, 'left')), nodes, {gray: index !== 1});
  });
  const secretToApi = edge('api-reads-secret', secret.box.id, 'left', api.box.id, 'bottom', cubicPath(port(secret.box, 'left'), {x: 350, y: 320}, {x: 298, y: 235}, port(api.box, 'bottom')), nodes, {dashed: true});
  const secretToWorker = edge('worker-reads-secret', secret.box.id, 'right', worker.box.id, 'bottom', cubicPath(port(secret.box, 'right'), {x: 710, y: 320}, {x: 708, y: 235}, port(worker.box, 'bottom')), nodes, {dashed: true});
  return `${client.html}${chain.map((connector, index) => `<g class="fragment">${connector}${chainNodes[index + 1].html}</g>`).join('')}<g class="fragment">${secretToApi}${secretToWorker}${secret.html}</g>${text(502, 205, 'AMQP · TLS required', 'lbl-g')}`;
}

function queueInterface() {
  const api = node('API', 95, 130, 180, 90, '#dae8fc', 'api');
  const queue = node('job-queue', 765, 105, 250, 140, '#ffe6cc', 'job-queue');
  const nodes = [api, queue];
  const connector = edge('api-to-queue-publish', api.box.id, 'right', queue.box.id, 'left', linePath(port(api.box, 'right'), port(queue.box, 'left')), nodes, {gray: false});
  return `${connector}${nodes.map((item) => item.html).join('')}${text(520, 125, 'queue-publish', 'lbl-b')}${text(520, 165, 'AMQP · port 5671', 'lbl')}
    <g filter="url(#rough)" stroke="${INK}" stroke-width="2.3" stroke-dasharray="7 6"><rect x="350" y="255" width="340" height="95" rx="13" fill="#e1d5e7"/></g>${text(520, 292, 'TLS required', 'lbl-b')}${text(520, 325, 'authenticated producers', 'lbl-sm')}
    <g fill="none" stroke="${GRAY}" stroke-width="2" stroke-dasharray="6 6"><line x1="690" y1="302" x2="820" y2="245"/></g>`;
}

function trustBoundaries() {
  const client = node('external client', 45, 140, 180, 80, '#dae8fc', 'external-client');
  const api = node('public API', 315, 140, 180, 80, '#dae8fc', 'public-api');
  const queue = node('queue + worker', 605, 140, 210, 80, '#ffe6cc', 'workload-platform');
  const secret = node('secret manager', 900, 140, 175, 80, '#e1d5e7', 'secret-management');
  const nodes = [client, api, queue, secret];
  const edges = nodes.slice(0, -1).map((source, index) => edge(`boundary-crossing-${index + 1}`, source.box.id, 'right', nodes[index + 1].box.id, 'left', linePath(port(source.box, 'right'), port(nodes[index + 1].box, 'left')), nodes));
  const boundaryNames = ['external-client', 'public-api', 'workload-platform', 'secret-management'];
  const boundaries = nodes.map((item, index) => `<g filter="url(#rough)" fill="none" stroke="${GRAY}" stroke-width="2" stroke-dasharray="7 6"><rect x="${item.box.x - 20}" y="55" width="${item.box.width + 40}" height="250" rx="20"/></g>${text(item.box.x + item.box.width / 2, 90, boundaryNames[index], 'lbl-g')}`).join('');
  return `${edges.join('')}${boundaries}${nodes.map((item) => item.html).join('')}${text(550, 345, 'identity · protocol/data · required control · recovery', 'lbl-g')}`;
}

function controlStandard() {
  const control = node('CONTROL|protect queue traffic', 80, 90, 315, 115, '#e1d5e7', 'control');
  const standard = node('STANDARD|approved interface shape', 705, 90, 315, 115, '#e1d5e7', 'standard');
  const evidence = node('evidence slot|proved later', 390, 275, 320, 85, '#fff', 'evidence-slot', {dash: '8 6'});
  const nodes = [control, standard, evidence];
  const edges = [
    edge('control-to-evidence', control.box.id, 'bottom', evidence.box.id, 'left', cubicPath(port(control.box, 'bottom'), {x: 245, y: 255}, {x: 340, y: 315}, port(evidence.box, 'left')), nodes, {dashed: true}),
    edge('standard-to-evidence', standard.box.id, 'bottom', evidence.box.id, 'right', cubicPath(port(standard.box, 'bottom'), {x: 865, y: 255}, {x: 760, y: 315}, port(evidence.box, 'right')), nodes, {dashed: true}),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
}

function designPack(items) {
  const [centerLabel, ...artifactLabels] = items;
  const task = node(centerLabel, 420, 150, 260, 90, '#e1d5e7', 'implementation-task');
  const positions = [[55, 55], [390, 35], [760, 55], [55, 270], [390, 285], [760, 270], [880, 165]];
  const artifacts = artifactLabels.map((label, index) => node(label, positions[index][0], positions[index][1], 170, 76, FILLS[index % FILLS.length], `${slugId(label)}-${index + 1}`));
  const nodes = [task, ...artifacts];
  const edges = artifacts.map((artifact) => {
    const start = boundaryToward(artifact.box, center(task.box));
    const end = boundaryToward(task.box, center(artifact.box));
    return edge(`${artifact.box.id}-constrains-task`, artifact.box.id, 'ray', task.box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end});
  });
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(550, 390, 'approval gate remains pending', 'lbl-g')}`;
}

function approvalStages() {
  const items = ['design|candidate', 'human design|approval', 'implementation|task', 'future apply/deploy|approval'];
  const nodes = items.map((label, index) => node(label, 55 + index * 265, 115, 205, 100, index === 0 ? '#dae8fc' : '#e1d5e7', `stage-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => edge(`stage-${index + 1}-to-${index + 2}`, source.box.id, 'right', nodes[index + 1].box.id, 'left', linePath(port(source.box, 'right'), port(nodes[index + 1].box, 'left')), nodes, {dashed: true}));
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}
    <g filter="url(#rough)" fill="none" stroke="${RED}" stroke-width="3"><line x1="255" y1="255" x2="255" y2="325"/></g>${text(255, 355, 'CURRENT: candidate ready for human review', 'lbl-b')}`;
}

function labBridge(items) {
  const width = 145;
  const gap = 30;
  const nodes = items.map((label, index) => node(label, 40 + index * (width + gap), 105, width, 150, FILLS[index % FILLS.length], `lab-step-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => edge(`lab-step-${index + 1}-to-${index + 2}`, source.box.id, 'right', nodes[index + 1].box.id, 'left', linePath(port(source.box, 'right'), port(nodes[index + 1].box, 'left')), nodes));
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}${text(550, 340, 'approval pending · no infrastructure code · no apply', 'lbl-g')}`;
}

function visual(slide) {
  switch (slide.type) {
    case 'owner-handoffs': return ownerHandoffs();
    case 'state-collision': return stateCollision();
    case 'state-boundaries': return stateBoundaries(slide.items);
    case 'data-lifecycles': return threeLifecycles();
    case 'lifecycle-lanes': return lifecycleLanes(slide.items);
    case 'secret-runtime': return secretRuntime();
    case 'queue-graph': return queueGraph();
    case 'queue-interface': return queueInterface();
    case 'trust-boundaries': return trustBoundaries();
    case 'control-standard': return controlStandard();
    case 'destructive-gate': return destructiveGate();
    case 'rollback-order': return rollbackOrder();
    case 'graph-boundary': return boundedGraph();
    case 'node-anatomy': return nodeAnatomy();
    case 'calm-relationships': return calmRelationships();
    case 'evidence-gates': return evidenceGates();
    case 'approval-stages': return approvalStages();
    case 'lab-bridge': return labBridge(slide.items);
    case 'design-pack': return designPack(slide.items);
    case 'drift-fanout': return hub(slide.items, {foot: slide.foot, fragment: true});
    case 'pipeline':
    case 'title-story':
    case 'assumption-stop':
    case 'helm-inputs':
    case 'replacement':
    case 'migration':
    case 'git-runtime':
    case 'adr-timeline':
      return pipeline(slide.items, {fragment: slide.fragments, foot: slide.foot});
    case 'hub':
    case 'change-additive': return hub(slide.items, {foot: slide.foot, fragment: slide.fragments});
    case 'loop': return pipeline(slide.items, {fragment: slide.fragments, foot: slide.foot});
    case 'review-matrix': return renderVisual({...slide, type: 'cards'});
    default: return renderVisual(slide);
  }
}

function renderSection(slide) {
  if (slide.divider) return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  const titleSlide = slide.titleSlide;
  const closingSlide = slide.n === 51;
  const labBridgeSlide = slide.n === 52;
  const kicker = titleSlide
    ? '<p class="kicker">MODULE 3 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : closingSlide
      ? '<p class="kicker">MODULE 3 &nbsp;·&nbsp; DESIGN CANDIDATE</p>'
      : labBridgeSlide
        ? '<p class="kicker">MODULE 3 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const titleStyle = titleSlide ? ' style="font-size:1.52em"' : '';
  const subtitleStyle = titleSlide ? ' style="font-size:1.06em"' : '';
  const credit = titleSlide
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : closingSlide
      ? '<p class="credit">Candidate ready for <b>human review</b>. &nbsp;·&nbsp; Approval remains pending.</p>'
      : labBridgeSlide
        ? '<p class="credit">Now open <b>Section 3 Lab</b>. &nbsp;·&nbsp; Stop before implementation.</p>'
        : '';
  const aria = `A hand-drawn technical diagram explains ${slide.title}.`;
  return `<section${titleSlide ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(aria)}">${visual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '3')
    .replaceAll('{{module.title}}', 'Plan Your IaC Change Before the Agent Writes Code')
    .replaceAll('{{module.subtitle}}', 'Turn one vague request into a reviewable design.')
    .replaceAll('{{module.code}}', 'M3')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM3Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {html, slideCount: slides.length, dividerCount, contentCount: slides.length - dividerCount};
  if (result.slideCount !== 52 || dividerCount !== 8 || result.contentCount !== 44) {
    throw new Error(`unexpected deck structure: ${result.slideCount} slides, ${dividerCount} dividers, ${result.contentCount} content slides`);
  }
  if (!checkOnly) {
    const resolvedOutput = resolve(outputPath);
    const temporaryOutput = `${resolvedOutput}.tmp`;
    await mkdir(dirname(resolvedOutput), {recursive: true});
    try {
      await writeFile(temporaryOutput, html, 'utf8');
      await rename(temporaryOutput, resolvedOutput);
    } catch (error) {
      await rm(temporaryOutput, {force: true});
      throw error;
    }
  }
  return result;
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const result = await buildM3Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
