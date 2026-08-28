import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {boundaryToward, center, linePath, rect, validateEdge} from './lib/geometry.mjs';
import {renderDiagram, renderVisual, slugId} from './lib/primitives.mjs';
import {slides} from './specs/m9-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m9-deploy-applications-kubernetes-helm-ai-agents.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (number) => `M9&middot;${String(number).padStart(2, '0')}`;
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4'];

const plainLabel = (value) => String(value).replaceAll('|', ' ').replaceAll('->', 'to').replace(/\s+/g, ' ').trim();
const readableList = (values) => values.length < 2
  ? values[0]
  : `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;

export function describeSlide(slide) {
  if (slide.aria) return slide.aria;
  const labels = slide.items.map(plainLabel);
  const foot = slide.foot ? `; ${plainLabel(slide.foot)}` : '';
  if (slide.type === 'pipeline') return `A left-to-right flow moves from ${labels.join(' to ')}${foot}.`;
  if (slide.type === 'loop') return `A clockwise loop connects ${readableList(labels)}${foot}.`;
  if (slide.type === 'hub') return `A hub labeled ${labels[0]} connects outward to ${readableList(labels.slice(1))}${foot}.`;
  if (slide.type === 'compare') return `A side-by-side comparison contrasts ${labels[0]}, ${labels[1]}, with ${labels[2]}, ${labels[3]}${foot}.`;
  if (slide.type === 'boundary') return `A dashed boundary contains ${labels[0]} and names ${readableList(labels.slice(1))}${foot}.`;
  if (slide.type === 'ladder') return `An ascending ladder moves from ${labels.join(' to ')}${foot}.`;
  if (slide.type === 'icons') return `A lab sequence moves from ${labels.join(' to ')}.`;
  if (slide.type === 'gateGrid') return `Thirteen evaluator gate cards name ${readableList(labels)}; all gates bind to the same candidate.`;
  return `Cards identify ${readableList(labels)}${foot}.`;
}

function diagramNode(label, x, y, width, height, index, role = 'node') {
  return {...rect(slugId(label), x, y, width, height), label, fill: FILLS[index % FILLS.length], role};
}

function diagramEdge(source, target) {
  const fromPoint = boundaryToward(source, center(target));
  const toPoint = boundaryToward(target, center(source));
  return {
    id: `${source.id}-to-${target.id}`,
    from: source.id,
    fromPort: 'ray',
    to: target.id,
    toPort: 'ray',
    route: linePath(fromPoint, toPoint),
    fromPoint,
    toPoint,
  };
}

function staticDiagram(kind, nodes, edges) {
  return {kind, nodes, edges, fragments: false, errors: edges.flatMap((connector) => validateEdge(connector, nodes))};
}

function footText(value) {
  return value ? `<text x="550" y="375" text-anchor="middle" class="lbl-g"><tspan x="550" dy="0">${escapeHtml(value)}</tspan></text>` : '';
}

function renderFlow(slide) {
  const nodes = [
    diagramNode(slide.items[0], 55, 70, 210, 82, 0),
    diagramNode(slide.items[1], 55, 245, 210, 82, 1),
    diagramNode(slide.items[2], 405, 145, 290, 105, 2, 'hub'),
    diagramNode(slide.items[3], 835, 70, 210, 82, 3),
    diagramNode(slide.items[4], 835, 245, 210, 82, 0),
  ];
  const [helm, kustomize, finalRender, schema, policy] = nodes;
  return `${renderDiagram(staticDiagram('render-flow', nodes, [
    diagramEdge(helm, finalRender),
    diagramEdge(kustomize, finalRender),
    diagramEdge(finalRender, schema),
    diagramEdge(finalRender, policy),
  ]))}${footText(slide.foot)}`;
}

function gateGrid(slide) {
  const positions = [
    ...Array.from({length: 5}, (_, index) => [35 + index * 205, 42]),
    ...Array.from({length: 4}, (_, index) => [137 + index * 205, 148]),
    ...Array.from({length: 4}, (_, index) => [137 + index * 205, 254]),
  ];
  const nodes = slide.items.map((item, index) => diagramNode(item, positions[index][0], positions[index][1], 180, 70, index));
  return `${renderDiagram(staticDiagram('gate-grid', nodes, []))}${footText(slide.foot)}`;
}

function readinessIncident(slide) {
  const nodes = [
    diagramNode(slide.items[0], 80, 55, 220, 88, 0),
    diagramNode(slide.items[1], 440, 55, 220, 88, 1),
    diagramNode(slide.items[2], 800, 55, 220, 88, 2),
    diagramNode(slide.items[3], 175, 230, 300, 90, 3),
    diagramNode(slide.items[4], 625, 230, 300, 90, 0),
  ];
  return `${renderDiagram(staticDiagram('readiness-incident', nodes, [
    diagramEdge(nodes[0], nodes[1]),
    diagramEdge(nodes[1], nodes[2]),
  ]))}${footText(slide.foot)}`;
}

function backendIncident(slide) {
  const nodes = [
    diagramNode(slide.items[0], 40, 55, 200, 88, 0),
    diagramNode(slide.items[1], 310, 55, 200, 88, 1),
    diagramNode(slide.items[2], 580, 55, 200, 88, 2),
    diagramNode(slide.items[3], 850, 55, 200, 88, 3),
    diagramNode(slide.items[4], 405, 230, 290, 90, 0),
  ];
  return `${renderDiagram(staticDiagram('backend-incident', nodes, [
    diagramEdge(nodes[0], nodes[1]),
    diagramEdge(nodes[1], nodes[2]),
    diagramEdge(nodes[2], nodes[3]),
  ]))}${footText(slide.foot)}`;
}

function renderM9Visual(slide) {
  if (slide.type === 'renderFlow') return renderFlow(slide);
  if (slide.type === 'gateGrid') return gateGrid(slide);
  if (slide.type === 'readinessIncident') return readinessIncident(slide);
  if (slide.type === 'backendIncident') return backendIncident(slide);
  return renderVisual(slide);
}

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

function renderSection(slide) {
  if (slide.divider) {
    return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  }

  const isTitle = slide.titleSlide;
  const isClosing = slide.n === 79;
  const isLabBridge = slide.n === 80;
  const kicker = isTitle
    ? '<p class="kicker">MODULE 9 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : isClosing
      ? '<p class="kicker">MODULE 9 &nbsp;·&nbsp; RENDER AND RUNTIME EVIDENCE</p>'
      : isLabBridge
        ? '<p class="kicker">MODULE 9 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const credit = isTitle
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : isClosing
      ? '<p class="credit">Static checks prepare the package. &nbsp;·&nbsp; <b>A human owns deployment authority.</b></p>'
      : isLabBridge
        ? '<p class="credit">Now open <b>Section 9 Lab</b>. &nbsp;·&nbsp; Local Kind only.</p>'
        : '';
  const titleStyle = isTitle ? ' style="font-size:1.38em"' : '';
  const subtitleStyle = isTitle ? ' style="font-size:1.02em"' : '';
  const aria = describeSlide(slide);

  return `<section${isTitle ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(aria)}">${renderM9Visual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '9')
    .replaceAll('{{module.title}}', 'Deploy Applications with Kubernetes, Helm, and AI Agents')
    .replaceAll('{{module.subtitle}}', 'Prove one exact package from source through runtime.')
    .replaceAll('{{module.code}}', 'M9')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));

  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM9Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {
    html,
    slideCount: slides.length,
    dividerCount,
    contentCount: slides.length - dividerCount,
  };
  if (result.slideCount !== 80 || dividerCount !== 11 || result.contentCount !== 69) {
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
  const result = await buildM9Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
