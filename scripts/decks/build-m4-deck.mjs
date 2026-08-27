import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual, slugId} from './lib/primitives.mjs';
import {boundaryToward, center, cubicPath, linePath, port, rect, validateEdge} from './lib/geometry.mjs';
import {slides} from './specs/m4-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m4-give-iac-agent-right-context.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');
const INK = '#1e1e1e';
const GRAY = '#757575';
const RED = '#c62828';
const GREEN = '#2e7d32';
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const page = (number) => `M4&middot;${String(number).padStart(2, '0')}`;

export function validateSlideSequence(candidateSlides) {
  const seen = new Set();
  for (const slide of candidateSlides) {
    if (seen.has(slide.n)) throw new Error(`duplicate slide number ${slide.n}`);
    seen.add(slide.n);
  }
  const actual = candidateSlides.map((slide) => slide.n);
  const expected = Array.from({length: candidateSlides.length}, (_, index) => index + 1);
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

function edge(id, from, fromPort, to, toPort, route, nodes, {gray = true, dashed = false, fromPoint, toPoint} = {}) {
  const connector = {id, from, fromPort, to, toPort, route, fromPoint, toPoint};
  const errors = validateEdge(connector, nodes.map((item) => item.box));
  if (errors.length) throw new Error(`invalid M4 connector ${id}: ${errors.join('; ')}`);
  return `<g fill="none" stroke="${gray ? GRAY : INK}" stroke-width="2.2"${dashed ? ' stroke-dasharray="6 6"' : ''}><path data-edge-id="${id}" data-from="${from}" data-to="${to}" data-from-port="${fromPort}" data-to-port="${toPort}" d="${route.d}" marker-end="url(#${gray ? 'ahg' : 'ah'})"/></g>`;
}

function pipeline(items, {fragment = false, foot = '', fills = FILLS} = {}) {
  const gap = items.length > 6 ? 16 : items.length > 5 ? 22 : 34;
  const width = Math.floor((1010 - gap * (items.length - 1)) / items.length);
  const nodes = items.map((label, index) => node(label, 45 + index * (width + gap), 125, width, 110, fills[index % fills.length], `${slugId(label)}-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => {
    const target = nodes[index + 1];
    return edge(`${source.box.id}-to-${target.box.id}`, source.box.id, 'right', target.box.id, 'left', linePath(port(source.box, 'right'), port(target.box, 'left')), nodes);
  });
  const diagram = fragment
    ? `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}`
    : `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
  return `${diagram}${foot ? text(550, 330, foot, 'lbl-g') : ''}`;
}

function hub(items, {foot = '', fragment = false, selected = []} = {}) {
  const [centerLabel, ...satellites] = items;
  const hubNode = node(centerLabel, 420, 150, 260, 90, '#e1d5e7', `${slugId(centerLabel)}-hub`);
  const positions = [[45, 50], [390, 35], [760, 50], [45, 280], [390, 295], [760, 280], [875, 165]];
  const outer = satellites.map((label, index) => node(label, positions[index][0], positions[index][1], 180, 76, selected.length && !selected.includes(index) ? '#fff' : FILLS[index % FILLS.length], `${slugId(label)}-${index + 1}`, selected.length && !selected.includes(index) ? {stroke: GRAY, dash: '7 6'} : {}));
  const nodes = [hubNode, ...outer];
  const edges = outer.map((target, index) => {
    const start = boundaryToward(hubNode.box, center(target.box));
    const end = boundaryToward(target.box, center(hubNode.box));
    return edge(`${hubNode.box.id}-to-${target.box.id}`, hubNode.box.id, 'ray', target.box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end, dashed: selected.length && !selected.includes(index)});
  });
  const diagram = fragment
    ? `${hubNode.html}${edges.map((connector, index) => `<g class="fragment">${connector}${outer[index].html}</g>`).join('')}`
    : `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
  return `${diagram}${foot ? text(550, 392, foot, 'lbl-g') : ''}`;
}

function layerStack(items) {
  const widths = [900, 820, 740, 660];
  return items.map((label, index) => {
    const width = widths[index];
    const x = (1100 - width) / 2;
    const y = 42 + index * 80;
    const item = node(label, x, y, width, 60, FILLS[index], `context-layer-${index + 1}`);
    return item.html;
  }).join('') + text(550, 382, 'stable → task-specific → time-sensitive', 'lbl-g');
}

function instructionStack(items) {
  const nodes = items.map((label, index) => node(label, 300 + index * 55, 35 + index * 85, 500 - index * 110, 58, FILLS[index], `instruction-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => edge(`instruction-${index + 1}-narrows-${index + 2}`, source.box.id, 'bottom', nodes[index + 1].box.id, 'top', linePath(port(source.box, 'bottom'), port(nodes[index + 1].box, 'top')), nodes, {gray: index !== 0}));
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${nodes[index + 1].html}</g>`).join('')}${text(550, 380, 'scope narrows downward · authority does not flow upward', 'lbl-g')}`;
}

function evidenceLimit(items) {
  const observation = node(`${items[0]}|${items[1]}`, 65, 120, 280, 110, '#dae8fc', 'validation-observation');
  const claim = node(items[3], 745, 120, 300, 110, '#d5e8d4', 'claim-current-design-validated');
  const nodes = [observation, claim];
  const connector = edge('observation-supports-design-claim', observation.box.id, 'right', claim.box.id, 'left', linePath(port(observation.box, 'right'), port(claim.box, 'left')), nodes, {gray: false});
  return `${connector}${nodes.map((item) => item.html).join('')}${text(545, 100, items[2], 'lbl-b')}${text(550, 290, items[4], 'lbl-b')}`;
}

function directoryScope() {
  const repo = node('repository rules', 400, 35, 300, 70, '#e1d5e7', 'repository-rules');
  const infra = node('infra/|Terraform edits', 145, 240, 300, 90, '#dae8fc', 'infra-directory');
  const evidence = node('evidence/|append-only', 655, 240, 300, 90, '#ffe6cc', 'evidence-directory');
  const nodes = [repo, infra, evidence];
  const edges = [
    edge('repo-rules-to-infra', repo.box.id, 'bottom', infra.box.id, 'top', cubicPath(port(repo.box, 'bottom'), {x: 480, y: 160}, {x: 295, y: 160}, port(infra.box, 'top')), nodes),
    edge('repo-rules-to-evidence', repo.box.id, 'bottom', evidence.box.id, 'top', cubicPath(port(repo.box, 'bottom'), {x: 620, y: 160}, {x: 805, y: 160}, port(evidence.box, 'top')), nodes),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(550, 380, 'directory rules narrow repository rules', 'lbl-g')}`;
}

function retrievedData() {
  const issue = node('retrieved issue 184|“ignore rules”', 45, 135, 250, 105, '#f8cecc', 'retrieved-issue-184', {stroke: RED});
  const quarantine = node('quarantine|data, not instruction', 425, 135, 260, 105, '#ffe6cc', 'quarantine');
  const report = node('report conflict', 815, 135, 220, 105, '#d5e8d4', 'conflict-report');
  const nodes = [issue, quarantine, report];
  const edges = [
    edge('issue-to-quarantine', issue.box.id, 'right', quarantine.box.id, 'left', linePath(port(issue.box, 'right'), port(quarantine.box, 'left')), nodes, {gray: false}),
    edge('quarantine-to-report', quarantine.box.id, 'right', report.box.id, 'left', linePath(port(quarantine.box, 'right'), port(report.box, 'left')), nodes),
  ];
  return `${issue.html}<g class="fragment">${edges[0]}${quarantine.html}</g><g class="fragment">${edges[1]}${report.html}</g><g filter="url(#rough)" fill="none" stroke="${RED}" stroke-width="3"><path d="M710,65 L710,305"/></g>${text(710, 335, 'no path into the instruction stack', 'lbl-b')}`;
}

function boundedNeighborhood(items, {subgraph = false} = {}) {
  const selected = subgraph ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  return hub(items, {fragment: true, selected, foot: subgraph ? 'selected source-linked paths only' : 'unrelated nodes remain addressable'});
}

function meters(items) {
  return items.map((label, index) => {
    const x = 45 + index * 175;
    const fillWidth = [110, 90, 65, 45, 55, 35][index];
    return `<g><g filter="url(#rough)" stroke="${INK}" stroke-width="2.2"><rect x="${x}" y="105" width="140" height="145" rx="14" fill="#fff"/><rect x="${x + 15}" y="185" width="110" height="22" rx="8" fill="#fff"/><rect x="${x + 15}" y="185" width="${fillWidth}" height="22" rx="8" fill="${FILLS[index % FILLS.length]}"/></g>${text(x + 70, 150, label, 'lbl-b')}</g>`;
  }).join('') + text(550, 315, 'a budget is a set of limits', 'lbl-g');
}

function sourceHashes(items) {
  return items.map((label, index) => {
    const col = index % 3; const row = Math.floor(index / 3);
    return node(label, 55 + col * 355, 55 + row * 155, 290, 105, FILLS[index % FILLS.length], `source-${index + 1}`).html;
  }).join('') + text(550, 380, 'hash change → validation stops', 'lbl-g');
}

function pageAnatomy(items, kind = 'wiki') {
  const outer = node(items[0], 110, 35, 880, 320, kind === 'index' ? '#e1d5e7' : '#dae8fc', `${kind}-page`);
  const fields = items.slice(1).map((label, index) => {
    const col = index % 2; const row = Math.floor(index / 2);
    return node(label, 165 + col * 410, 105 + row * 90, 355, 58, '#fff', `${kind}-field-${index + 1}`).html;
  }).join('');
  return `${outer.html}${fields}`;
}

function edgeAnatomy(items) {
  const source = node('source', 70, 135, 180, 90, '#dae8fc', 'edge-source');
  const claim = node('claim', 850, 135, 180, 90, '#d5e8d4', 'edge-claim');
  const nodes = [source, claim];
  const connector = edge('typed-edge-anatomy', source.box.id, 'right', claim.box.id, 'left', linePath(port(source.box, 'right'), port(claim.box, 'left')), nodes, {gray: false});
  return `${connector}${source.html}${claim.html}${text(550, 105, items[0], 'lbl-b')}${text(550, 160, items[1], 'lbl')}${text(550, 205, `${items[2]} · ${items[3]}`, 'lbl-sm')}${text(550, 245, `${items[4]} · ${items[5]}`, 'lbl-sm')}`;
}

function queueEvidenceGraph(items) {
  const positions = [[25, 40], [300, 30], [575, 30], [850, 40], [25, 285], [300, 275], [575, 275], [850, 285]];
  const nodes = items.map((label, index) => node(label, positions[index][0], positions[index][1], 205, 72, FILLS[index % FILLS.length], `queue-graph-${index + 1}`));
  const pairs = [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[0,4],[1,5],[2,6],[3,7]];
  const edges = pairs.map(([from, to], index) => {
    const start = boundaryToward(nodes[from].box, center(nodes[to].box));
    const end = boundaryToward(nodes[to].box, center(nodes[from].box));
    return edge(`queue-evidence-edge-${index + 1}`, nodes[from].box.id, 'ray', nodes[to].box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end, dashed: index === 1});
  });
  return `${nodes[0].html}${edges.map((connector, index) => `<g class="fragment">${connector}${index < nodes.length - 1 ? nodes[index + 1].html : ''}</g>`).join('')}`;
}

function claimConflict(items) {
  const claim = node(items[3], 405, 145, 290, 100, '#e1d5e7', 'shared-state-claim');
  const positions = [[45, 50], [405, 20], [765, 50]];
  const sources = items.slice(0, 3).map((label, index) => node(label, positions[index][0], positions[index][1], 290, 82, index === 0 ? '#fff' : '#f8cecc', `conflict-source-${index + 1}`, index === 0 ? {stroke: GRAY, dash: '7 6'} : {stroke: RED}));
  const nodes = [claim, ...sources];
  const edges = sources.map((source, index) => {
    const start = boundaryToward(source.box, center(claim.box)); const end = boundaryToward(claim.box, center(source.box));
    return edge(`conflict-edge-${index + 1}`, source.box.id, 'ray', claim.box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end, gray: index === 0});
  });
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(550, 375, 'rejected history stays visible · current authority wins', 'lbl-g')}`;
}

function falseEdge() {
  const validation = node('validation|observation', 45, 75, 215, 80, '#dae8fc', 'validation-observation');
  const pack = node('context pack', 840, 75, 215, 80, '#ffe6cc', 'context-pack');
  const claim = node('claim-current-|design-validated', 440, 265, 250, 85, '#d5e8d4', 'claim-current-design-validated');
  const nodes = [validation, pack, claim];
  const rejectedRoute = linePath(port(validation.box, 'right'), port(pack.box, 'left'));
  const rejectedErrors = validateEdge({id: 'rejected-relationship', from: validation.box.id, fromPort: 'right', to: pack.box.id, toPort: 'left', route: rejectedRoute}, nodes.map((item) => item.box));
  if (rejectedErrors.length) throw new Error(`invalid M4 rejected relationship: ${rejectedErrors.join('; ')}`);
  const wrong = `<g fill="none" stroke="${RED}" stroke-width="2.2"><path d="${rejectedRoute.d}"/></g>`;
  const supports = edge('observation-supports-claim', validation.box.id, 'bottom', claim.box.id, 'left', cubicPath(port(validation.box, 'bottom'), {x: 155, y: 250}, {x: 360, y: 307}, port(claim.box, 'left')), nodes, {gray: false});
  const derived = edge('pack-derived-from-observation', pack.box.id, 'bottom', validation.box.id, 'bottom', cubicPath(port(pack.box, 'bottom'), {x: 950, y: 225}, {x: 155, y: 225}, port(validation.box, 'bottom')), nodes);
  return `${wrong}${nodes[0].html}${nodes[1].html}${text(550, 62, 'EVALUATES ×', 'lbl-b')}<g filter="url(#rough)" fill="none" stroke="${RED}" stroke-width="4"><path d="M400,55 L700,175"/><path d="M700,55 L400,175"/></g><g class="fragment">${supports}${claim.html}${text(335, 285, 'SUPPORTS', 'lbl-b')}</g><g class="fragment">${derived}${text(550, 205, 'context pack DERIVED_FROM validation', 'lbl-sm')}</g>`;
}

function threeStructures(items) {
  const question = node('reviewer question', 430, 35, 240, 72, '#e1d5e7', 'reviewer-question');
  const targets = items.map((label, index) => node(label, 55 + index * 355, 245, 290, 90, FILLS[index], `structure-${index + 1}`));
  const nodes = [question, ...targets];
  const edges = targets.map((target, index) => edge(`question-to-structure-${index + 1}`, question.box.id, 'bottom', target.box.id, 'top', cubicPath(port(question.box, 'bottom'), {x: 550, y: 170}, {x: center(target.box).x, y: 170}, port(target.box, 'top')), nodes));
  return `${question.html}${edges.map((connector, index) => `<g class="fragment">${connector}${targets[index].html}</g>`).join('')}${text(550, 385, 'linked by references · never merged', 'lbl-g')}`;
}

function gitDag(items) {
  const positions = [[90,180],[300,180],[510,75],[510,285],[760,180]];
  const nodes = items.map((label,index) => node(label, positions[index][0], positions[index][1], 110, 65, FILLS[index % FILLS.length], `commit-${index+1}`));
  const pairs = [[0,1],[1,2],[1,3],[2,4],[3,4]];
  const edges = pairs.map(([a,b], index) => {
    const start=boundaryToward(nodes[a].box,center(nodes[b].box)); const end=boundaryToward(nodes[b].box,center(nodes[a].box));
    return edge(`git-parent-${index+1}`,nodes[a].box.id,'ray',nodes[b].box.id,'ray',linePath(start,end),nodes,{fromPoint:start,toPoint:end});
  });
  return `${edges.join('')}${nodes.map((item)=>item.html).join('')}${text(550,385,'commit parent relationships','lbl-g')}`;
}

function authorityMatrix(items) {
  const labels = [['DIRECT', 'INDIRECT / UNTRUSTED'], ['CURRENT', items[0], items[2]], ['STALE', items[1], items[3]]];
  return `${text(650,45,labels[0][0],'lbl-b')}${text(900,45,labels[0][1],'lbl-b')}${text(180,145,labels[1][0],'lbl-b')}${text(180,285,labels[2][0],'lbl-b')}${[items[0],items[2],items[1],items[3]].map((label,index)=>node(label,400+(index%2)*310,80+Math.floor(index/2)*140,260,95,index===0?'#d5e8d4':index===3?'#f8cecc':FILLS[(index+1)%FILLS.length],`matrix-${index+1}`).html).join('')}`;
}

function bundleConverge(items) {
  const pack = node('reviewable|context bundle', 420, 150, 260, 90, '#e1d5e7', 'context-bundle');
  const positions = [[45,45],[390,25],[760,45],[45,285],[390,305],[760,285]];
  const sources = items.map((label,index)=>node(label,positions[index][0],positions[index][1],180,72,FILLS[index%FILLS.length],`bundle-source-${index+1}`));
  const nodes=[pack,...sources];
  const edges=sources.map((source,index)=>{const start=boundaryToward(source.box,center(pack.box));const end=boundaryToward(pack.box,center(source.box));return edge(`bundle-source-${index+1}-to-pack`,source.box.id,'ray',pack.box.id,'ray',linePath(start,end),nodes,{fromPoint:start,toPoint:end});});
  return `${pack.html}${edges.map((connector,index)=>`<g class="fragment">${connector}${sources[index].html}</g>`).join('')}${text(550,390,'six artifacts · one bounded review surface','lbl-g')}`;
}

function passBoundary(items) {
  const pass=node(items[0],80,125,270,110,'#d5e8d4','deterministic-pass',{stroke:GREEN});
  const limits=node(items.slice(1).join('|'),700,85,330,205,'#ffe6cc','pass-limits');
  const nodes=[pass,limits];
  const connector=edge('pass-to-human-review',pass.box.id,'right',limits.box.id,'left',linePath(port(pass.box,'right'),port(limits.box,'left')),nodes,{dashed:true});
  return `${connector}${nodes.map((item)=>item.html).join('')}${text(525,105,'human review','lbl-b')}${text(550,345,'approval pending','lbl-b')}`;
}

function cardsOrGeneric(slide) {
  if (slide.items.length > 6) return pipeline(slide.items, {fragment: slide.fragments, foot: slide.foot});
  return renderVisual(slide);
}

function visual(slide) {
  switch (slide.type) {
    case 'layer-stack': return layerStack(slide.items);
    case 'instruction-stack': return instructionStack(slide.items);
    case 'evidence-limit': return evidenceLimit(slide.items);
    case 'directory-scope': return directoryScope();
    case 'retrieved-data': return retrievedData();
    case 'bounded-neighborhood': return boundedNeighborhood(slide.items);
    case 'bounded-subgraph': return boundedNeighborhood(slide.items, {subgraph: true});
    case 'meters': return meters(slide.items);
    case 'source-hashes': return sourceHashes(slide.items);
    case 'wiki-page': return pageAnatomy(slide.items, 'wiki');
    case 'index-page': return pageAnatomy(slide.items, 'index');
    case 'edge-anatomy': return edgeAnatomy(slide.items);
    case 'queue-evidence-graph': return queueEvidenceGraph(slide.items);
    case 'claim-conflict': return claimConflict(slide.items);
    case 'false-edge': return falseEdge();
    case 'three-structures': return threeStructures(slide.items);
    case 'git-dag': return gitDag(slide.items);
    case 'authority-matrix': return authorityMatrix(slide.items);
    case 'bundle-converge': return bundleConverge(slide.items);
    case 'pass-boundary': return passBoundary(slide.items);
    case 'hub': return hub(slide.items, {foot: slide.foot, fragment: slide.fragments});
    case 'pipeline':
    case 'title-story':
    case 'funnel':
    case 'three-zones':
    case 'wiki-links':
    case 'evidence-provenance':
    case 'conflict-resolution':
    case 'trust-ladder':
    case 'closing':
    case 'lab-bridge': return pipeline(slide.items, {fragment: slide.fragments, foot: slide.foot});
    case 'cards': return cardsOrGeneric(slide);
    default: return renderVisual(slide);
  }
}

function renderSection(slide) {
  if (slide.divider) return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  const titleSlide = slide.titleSlide;
  const closingSlide = slide.n === 63;
  const labBridgeSlide = slide.n === 64;
  const kicker = titleSlide
    ? '<p class="kicker">MODULE 4 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : closingSlide
      ? '<p class="kicker">MODULE 4 &nbsp;·&nbsp; CONTEXT ENGINEERING</p>'
      : labBridgeSlide
        ? '<p class="kicker">MODULE 4 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const titleStyle = titleSlide ? ' style="font-size:1.72em"' : '';
  const subtitleStyle = titleSlide ? ' style="font-size:1.06em"' : '';
  const credit = titleSlide
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : closingSlide
      ? '<p class="credit">Small, source-linked context. &nbsp;·&nbsp; <b>Human review</b> remains the decision.</p>'
      : labBridgeSlide
        ? '<p class="credit">Now open <b>Section 4 Lab</b>. &nbsp;·&nbsp; Stop before implementation.</p>'
        : '';
  const aria = `A hand-drawn technical diagram explains ${slide.title}.`;
  return `<section${titleSlide ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(aria)}">${visual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '4')
    .replaceAll('{{module.title}}', 'Give Your IaC Agent the Right Context')
    .replaceAll('{{module.subtitle}}', 'Select trusted context before the agent acts.')
    .replaceAll('{{module.code}}', 'M4')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM4Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {html, slideCount: slides.length, dividerCount, contentCount: slides.length - dividerCount};
  if (result.slideCount !== 64 || dividerCount !== 9 || result.contentCount !== 55) {
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
  const result = await buildM4Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
