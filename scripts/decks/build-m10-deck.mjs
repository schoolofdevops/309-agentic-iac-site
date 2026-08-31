import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {boundaryToward, center, cubicPath, linePath, port, rect, validateEdge} from './lib/geometry.mjs';
import {renderDiagram, renderVisual, slugId} from './lib/primitives.mjs';
import {slides} from './specs/m10-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m10-deliver-infrastructure-gitops-human-approval.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4', '#f8cecc'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (number) => `M10&middot;${String(number).padStart(2, '0')}`;
const plainLabel = (value) => String(value).replaceAll('|', ' ').replaceAll('->', 'to').replace(/\s+/g, ' ').trim();
const readableList = (values) => values.length < 2 ? values[0] : `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;

export function describeSlide(slide) {
  if (slide.aria) return slide.aria;
  const labels = slide.items.map(plainLabel);
  const foot = slide.foot ? `; ${plainLabel(slide.foot)}` : '';
  if (slide.type === 'pipeline') return `A left-to-right flow moves from ${labels.join(' to ')}${foot}.`;
  if (slide.type === 'loop') return `A clockwise responsibility loop connects ${readableList(labels)}${foot}.`;
  if (slide.type === 'hub') return `A hub labeled ${labels[0]} connects outward to ${readableList(labels.slice(1))}${foot}.`;
  if (slide.type === 'compare') return `A side-by-side comparison contrasts ${labels[0]}, ${labels[1]}, with ${labels[2]}, ${labels[3]}${foot}.`;
  if (slide.type === 'boundary') return `A dashed control boundary contains ${labels[0]} and names ${readableList(labels.slice(1))}${foot}.`;
  if (slide.type === 'ladder') return `An ascending evidence ladder moves from ${labels.join(' to ')}${foot}.`;
  if (slide.type === 'icons') return `A lab sequence moves from ${labels.join(' to ')}.`;
  if (slide.type === 'cards') return `Separate cards identify ${readableList(labels)}${foot}.`;
  return `A technical relationship connects ${readableList(labels)}${foot}.`;
}

function diagramNode(label, x, y, width, height, index, role = 'node', fill) {
  return {...rect(slugId(label), x, y, width, height), label, fill: fill || FILLS[index % FILLS.length], role};
}

function connector(source, target, {fromPort = 'ray', toPort = 'ray', route} = {}) {
  const fromPoint = fromPort === 'ray' ? boundaryToward(source, center(target)) : port(source, fromPort);
  const toPoint = toPort === 'ray' ? boundaryToward(target, center(source)) : port(target, toPort);
  return {
    id: `${source.id}-to-${target.id}`,
    from: source.id,
    fromPort,
    to: target.id,
    toPort,
    route: route ? route(fromPoint, toPoint) : linePath(fromPoint, toPoint),
    ...(fromPort === 'ray' ? {fromPoint} : {}),
    ...(toPort === 'ray' ? {toPoint} : {}),
  };
}

function diagram(kind, nodes, edges, fragments = false) {
  return {kind, nodes, edges, fragments, errors: edges.flatMap((edge) => validateEdge(edge, nodes))};
}

function footText(value, y = 382) {
  return value ? `<text x="550" y="${y}" text-anchor="middle" class="lbl-g"><tspan x="550" dy="0">${escapeHtml(value)}</tspan></text>` : '';
}

function renderTwoLanes(slide) {
  const nodes = [
    diagramNode(slide.items[0], 45, 155, 220, 90, 0),
    diagramNode(slide.items[1], 405, 50, 255, 90, 1),
    diagramNode(slide.items[2], 405, 270, 255, 90, 2),
    diagramNode(slide.items[3], 830, 155, 225, 90, 3),
  ];
  const edges = [connector(nodes[0], nodes[1]), connector(nodes[0], nodes[2]), connector(nodes[1], nodes[3]), connector(nodes[2], nodes[3])];
  return `${renderDiagram(diagram('two-lanes', nodes, edges, slide.fragments))}${footText(slide.foot)}`;
}

function renderTrustBoundary(slide) {
  const nodes = [
    diagramNode(slide.items[0], 70, 55, 250, 90, 0),
    diagramNode(slide.items[1], 70, 265, 250, 90, 4, 'node', '#f8cecc'),
    diagramNode(slide.items[2], 430, 155, 250, 95, 1, 'hub'),
    diagramNode(slide.items[3], 810, 155, 220, 95, 3),
  ];
  const edges = [connector(nodes[0], nodes[2]), connector(nodes[1], nodes[2]), connector(nodes[2], nodes[3])];
  const boundary = '<g filter="url(#rough)" fill="none" stroke="#757575" stroke-width="2.2" stroke-dasharray="9 7"><rect x="390" y="115" width="330" height="175" rx="22"/></g>';
  return `${boundary}${renderDiagram(diagram('trust-boundary', nodes, edges, slide.fragments))}${footText(slide.foot)}`;
}

function renderPlanJson(slide) {
  return `<g class="semantic-node" data-node-id="plan-json" data-x="140" data-y="45" data-width="820" data-height="285"><g filter="url(#rough)" stroke="#1e1e1e" stroke-width="2.8"><rect x="140" y="45" width="820" height="285" rx="18" fill="#dae8fc"/></g><text x="185" y="105" class="lbl-b" text-anchor="start">plan JSON</text><text x="185" y="165" class="lbl" text-anchor="start">address</text><text x="410" y="165" class="lbl-b" text-anchor="start">${escapeHtml(slide.items[0])}</text><text x="185" y="220" class="lbl" text-anchor="start">actions</text><text x="410" y="220" class="lbl-b" text-anchor="start">[${escapeHtml(slide.items[1])}]</text><text x="185" y="275" class="lbl" text-anchor="start">apply_permitted</text><text x="410" y="275" class="lbl-b" text-anchor="start">${escapeHtml(slide.items[2].split(': ').at(-1))}</text></g>${footText(slide.foot, 372)}`;
}

function renderConverge(slide) {
  const nodes = [
    diagramNode(slide.items[0], 75, 60, 260, 95, 0),
    diagramNode(slide.items[1], 75, 260, 260, 95, 1),
    diagramNode(slide.items[2], 735, 155, 290, 105, 3, 'hub'),
  ];
  return `${renderDiagram(diagram('converge', nodes, [connector(nodes[0], nodes[2]), connector(nodes[1], nodes[2])], slide.fragments))}${footText(slide.foot)}`;
}

function renderTransactionLoop(slide) {
  const nodes = [
    diagramNode(slide.items[0], 45, 100, 190, 90, 0),
    diagramNode(slide.items[1], 320, 100, 190, 90, 3),
    diagramNode(slide.items[2], 585, 45, 155, 80, 0),
    diagramNode(slide.items[3], 815, 45, 155, 80, 1),
    diagramNode(slide.items[4], 815, 250, 155, 80, 2),
    diagramNode(slide.items[5], 585, 250, 155, 80, 3),
  ];
  const edges = [
    connector(nodes[0], nodes[1], {fromPort: 'right', toPort: 'left'}),
    connector(nodes[2], nodes[3], {fromPort: 'right', toPort: 'left'}),
    connector(nodes[3], nodes[4], {fromPort: 'bottom', toPort: 'top'}),
    connector(nodes[4], nodes[5], {fromPort: 'left', toPort: 'right'}),
    connector(nodes[5], nodes[2], {fromPort: 'top', toPort: 'bottom'}),
  ];
  return `${renderDiagram(diagram('transaction-loop', nodes, edges, slide.fragments))}<text x="275" y="245" text-anchor="middle" class="lbl-g">one bounded transaction</text><text x="778" y="375" text-anchor="middle" class="lbl-g">continuing reconciliation loop</text>`;
}

function renderDriftLoop(slide) {
  const nodes = [
    diagramNode(slide.items[0], 45, 55, 220, 95, 0),
    diagramNode(slide.items[1], 45, 260, 220, 95, 4, 'node', '#f8cecc'),
    diagramNode(slide.items[2], 430, 155, 220, 95, 2),
    diagramNode(slide.items[3], 800, 155, 220, 95, 3, 'hub'),
  ];
  const edges = [connector(nodes[0], nodes[2]), connector(nodes[1], nodes[2]), connector(nodes[2], nodes[3])];
  return `${renderDiagram(diagram('drift-stop', nodes, edges, slide.fragments))}${footText(slide.foot)}`;
}

function renderEvidenceTrail(slide) {
  const top = slide.items.slice(0, 5).map((item, index) => diagramNode(item, 30 + index * 212, 55, 170, 75, index));
  const bottom = slide.items.slice(5).map((item, index) => diagramNode(item, 878 - index * 212, 260, 170, 75, index + 5));
  const nodes = [...top, ...bottom];
  const edges = [];
  for (let index = 0; index < top.length - 1; index += 1) edges.push(connector(top[index], top[index + 1], {fromPort: 'right', toPort: 'left'}));
  edges.push(connector(top.at(-1), bottom[0], {fromPort: 'bottom', toPort: 'top'}));
  for (let index = 0; index < bottom.length - 1; index += 1) edges.push(connector(bottom[index], bottom[index + 1], {fromPort: 'left', toPort: 'right'}));
  return `${renderDiagram(diagram('evidence-trail', nodes, edges, slide.fragments))}${footText(slide.foot)}`;
}

function renderEvidenceGraph(slide) {
  const nodes = [
    diagramNode(slide.items[0], 20, 60, 200, 85, 0),
    diagramNode(slide.items[1], 400, 60, 200, 85, 1),
    diagramNode(slide.items[2], 20, 260, 200, 85, 2),
    diagramNode(slide.items[3], 400, 260, 200, 85, 3),
    diagramNode(slide.items[4], 790, 260, 220, 85, 0),
    diagramNode(slide.items[5], 790, 60, 220, 85, 1, 'hub'),
  ];
  const edges = [connector(nodes[0], nodes[1]), connector(nodes[2], nodes[3]), connector(nodes[4], nodes[5], {fromPort: 'top', toPort: 'bottom'})];
  const labels = '<text x="310" y="83" text-anchor="middle" class="lbl-g">DERIVED_FROM</text><text x="310" y="283" text-anchor="middle" class="lbl-g">AUTHORIZES</text><text x="965" y="220" text-anchor="middle" class="lbl-g">SUPPORTS</text>';
  return `${renderDiagram(diagram('evidence-graph', nodes, edges, false))}${labels}${footText(slide.foot)}`;
}

function renderAuthorityBoundary(slide) {
  const nodes = slide.items.map((item, index) => diagramNode(item, 35 + index * 215, 105, 165, 90, index));
  const forward = nodes.slice(0, -1).map((node, index) => connector(node, nodes[index + 1], {fromPort: 'right', toPort: 'left'}));
  const bypass = connector(nodes[0], nodes.at(-1), {
    fromPort: 'bottom',
    toPort: 'bottom',
    route: (start, end) => cubicPath(start, {x: 145, y: 345}, {x: 885, y: 345}, end),
  });
  const cross = '<g filter="url(#rough)" fill="none" stroke="#c62828" stroke-width="5"><path d="M530,300 L570,340 M570,300 L530,340"/></g><text x="550" y="370" text-anchor="middle" class="lbl-g">forbidden author bypass</text>';
  return `${renderDiagram(diagram('authority-boundary', nodes, [...forward, bypass], false))}${cross}`;
}

function renderM10Visual(slide) {
  if (slide.type === 'twoLanes' || slide.type === 'splitCommit') return renderTwoLanes(slide);
  if (slide.type === 'trustBoundary') return renderTrustBoundary(slide);
  if (slide.type === 'planJson') return renderPlanJson(slide);
  if (slide.type === 'converge') return renderConverge(slide);
  if (slide.type === 'transactionLoop') return renderTransactionLoop(slide);
  if (slide.type === 'driftLoop') return renderDriftLoop(slide);
  if (slide.type === 'evidenceTrail') return renderEvidenceTrail(slide);
  if (slide.type === 'evidenceGraph') return renderEvidenceGraph(slide);
  if (slide.type === 'authorityBoundary') return renderAuthorityBoundary(slide);
  return renderVisual(slide);
}

export function validateSlideSequence(candidateSlides) {
  const numbers = candidateSlides.map((slide) => slide.n);
  if (new Set(numbers).size !== numbers.length) throw new Error('duplicate slide number');
  const expected = Array.from({length: candidateSlides.length}, (_, index) => index + 1);
  if (numbers.some((number, index) => number !== expected[index])) throw new Error(`slide numbers must be contiguous from 1; received ${numbers.join(', ')}`);
}

function renderSection(slide) {
  if (slide.divider) return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  const isTitle = slide.n === 1;
  const isClosing = slide.n === 69;
  const isLabBridge = slide.n === 70;
  const kicker = isTitle
    ? '<p class="kicker">MODULE 10 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : isClosing
      ? '<p class="kicker">MODULE 10 &nbsp;·&nbsp; SAFE DELIVERY</p>'
      : isLabBridge
        ? '<p class="kicker">MODULE 10 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const credit = isTitle
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : isClosing
      ? '<p class="credit">Plan-only Terraform + manual Argo CD sync. &nbsp;·&nbsp; <b>No autonomous apply.</b></p>'
      : isLabBridge
        ? '<p class="credit">Now open <b>Section 10 Lab</b>. &nbsp;·&nbsp; Local Kind only.</p>'
        : '';
  const titleStyle = isTitle ? ' style="font-size:1.28em"' : '';
  const subtitleStyle = isTitle ? ' style="font-size:1.02em"' : '';
  return `<section${isTitle ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(describeSlide(slide))}">${renderM10Visual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '10')
    .replaceAll('{{module.title}}', 'Deliver Infrastructure Safely with GitOps and Human Approval')
    .replaceAll('{{module.subtitle}}', 'One reviewed commit. Two delivery lanes. Human authority.')
    .replaceAll('{{module.code}}', 'M10')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM10Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {html, slideCount: slides.length, dividerCount, contentCount: slides.length - dividerCount};
  if (result.slideCount !== 70 || dividerCount !== 9 || result.contentCount !== 61) throw new Error(`unexpected deck structure: ${result.slideCount} slides, ${dividerCount} dividers, ${result.contentCount} content slides`);
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
  const result = await buildM10Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
