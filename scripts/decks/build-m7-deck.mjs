import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual, slugId} from './lib/primitives.mjs';
import {boundaryToward, center, linePath, port, rect, validateEdge} from './lib/geometry.mjs';
import {slides} from './specs/m7-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m7-build-infrastructure-terraform-opentofu-ai.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');
const INK = '#1e1e1e';
const GRAY = '#757575';
const RED = '#c62828';
const GREEN = '#2e7d32';
const FILLS = ['#dae8fc', '#e1d5e7', '#ffe6cc', '#d5e8d4'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const page = (number) => `M7&middot;${String(number).padStart(2, '0')}`;

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
  if (errors.length) throw new Error(`invalid M7 connector ${id}: ${errors.join('; ')}`);
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

function hub(items, {foot = '', fragment = false, inward = false} = {}) {
  const [centerLabel, ...satellites] = items;
  const hubNode = node(centerLabel, 420, 150, 260, 90, '#e1d5e7', `${slugId(centerLabel)}-hub`);
  const positions = [[45, 55], [390, 35], [760, 55], [45, 280], [390, 300], [760, 280]];
  const outer = satellites.map((label, index) => node(label, positions[index][0], positions[index][1], 180, 76, FILLS[index % FILLS.length], `${slugId(label)}-${index + 1}`));
  const nodes = [hubNode, ...outer];
  const edges = outer.map((target) => {
    const source = inward ? target : hubNode;
    const destination = inward ? hubNode : target;
    const start = boundaryToward(source.box, center(destination.box));
    const end = boundaryToward(destination.box, center(source.box));
    return edge(`${source.box.id}-to-${destination.box.id}`, source.box.id, 'ray', destination.box.id, 'ray', linePath(start, end), nodes, {fromPoint: start, toPoint: end});
  });
  const diagram = fragment
    ? inward
      ? `${hubNode.html}${edges.map((connector, index) => `<g class="fragment">${connector}${outer[index].html}</g>`).join('')}`
      : `${hubNode.html}${edges.map((connector, index) => `<g class="fragment">${connector}${outer[index].html}</g>`).join('')}`
    : `${edges.join('')}${nodes.map((item) => item.html).join('')}`;
  return `${diagram}${foot ? text(550, 392, foot, 'lbl-g') : ''}`;
}

function authorityIntersection(items) {
  return hub(['effective authority', ...items], {fragment: true, inward: true, foot: 'the narrowest limit wins'});
}

function approvalGate(items) {
  return pipeline(items, {fragment: true, foot: 'change authority remains with a person', fills: ['#dae8fc', '#d5e8d4', '#ffe6cc', '#f8cecc']});
}

function fiveRoutes(items) {
  return hub(['task need', ...items], {fragment: true, foot: 'choose by fit · combine only when needed'});
}

function evidenceChain(items) {
  return pipeline(items, {fragment: true, foot: 'each record points to the same run'});
}

function evidenceInputs(items, foot) {
  return hub(items, {fragment: true, inward: true, foot});
}

function skillAnatomy(items) {
  return pipeline(items, {foot: 'SKILL.md required · other directories optional'});
}

function dependencyClosure(items) {
  return hub([items[0], ...items.slice(1)], {fragment: true, foot: 'review every reachable instruction and executable'});
}

function mcpArchitecture(items) {
  return pipeline(items, {fragment: true, foot: 'host policy surrounds the client connection'});
}

function poisonedMetadata(items) {
  return pipeline(items, {fragment: true, foot: 'description → implementation check → reject'});
}

function adapterBoundary(items) {
  const contract = items.at(-1);
  return hub([contract, ...items.slice(0, -1)], {fragment: true, inward: true, foot: 'same tests · same evidence · same approval'});
}

function admissionGate(items) {
  return hub(['admission decision', ...items], {fragment: true, inward: true, foot: 'default deny on missing, changed, or excessive authority'});
}

function passBoundary(items, foot) {
  const pass = node(items[0], 70, 125, 300, 110, '#d5e8d4', 'local-validation-pass', {stroke: GREEN});
  const limits = node(items.slice(1).join('|'), 700, 85, 335, 205, '#ffe6cc', 'evidence-limits');
  const nodes = [pass, limits];
  const connector = edge('pass-to-evidence-limits', pass.box.id, 'right', limits.box.id, 'left', linePath(port(pass.box, 'right'), port(limits.box, 'left')), nodes, {dashed: true});
  return `${connector}${pass.html}${limits.html}${text(550, 110, 'human review', 'lbl-b')}${text(550, 350, foot, 'lbl-g')}`;
}

function visual(slide) {
  switch (slide.type) {
    case 'authority-intersection': return authorityIntersection(slide.items);
    case 'approval-gate': return approvalGate(slide.items);
    case 'five-routes': return fiveRoutes(slide.items);
    case 'evidence-chain': return evidenceChain(slide.items);
    case 'evidence-inputs': return evidenceInputs(slide.items, slide.foot);
    case 'skill-anatomy': return skillAnatomy(slide.items);
    case 'progressive-disclosure': return pipeline(slide.items, {fragment: true, foot: slide.foot});
    case 'dependency-closure': return dependencyClosure(slide.items);
    case 'mcp-architecture': return mcpArchitecture(slide.items);
    case 'poisoned-metadata': return poisonedMetadata(slide.items);
    case 'adapter-boundary': return adapterBoundary(slide.items);
    case 'admission-gate': return admissionGate(slide.items);
    case 'pass-boundary': return passBoundary(slide.items, slide.foot);
    case 'hub': return hub(slide.items, {fragment: slide.fragments, foot: slide.foot});
    case 'controlled-cli':
    case 'resource-flow':
    case 'tool-flow':
    case 'revocation-loop':
    case 'deputy-gate':
    case 'capability-pack':
    case 'title-story':
    case 'pipeline':
    case 'closing':
    case 'lab-bridge': return pipeline(slide.items, {fragment: slide.fragments, foot: slide.foot});
    case 'route-focus': return renderVisual({...slide, type: 'cards'});
    case 'test-matrix': return renderVisual({...slide, type: 'cards'});
    default: return renderVisual(slide);
  }
}

function renderSection(slide) {
  if (slide.divider) return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  const titleSlide = slide.titleSlide;
  const closingSlide = slide.n === 81;
  const labBridgeSlide = slide.n === 82;
  const kicker = titleSlide
    ? '<p class="kicker">MODULE 7 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : closingSlide
      ? '<p class="kicker">MODULE 7 &nbsp;·&nbsp; TERRAFORM FOUNDATIONS</p>'
      : labBridgeSlide
        ? '<p class="kicker">MODULE 7 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const titleStyle = titleSlide ? ' style="font-size:1.55em"' : '';
  const subtitleStyle = titleSlide ? ' style="font-size:1.02em"' : '';
  const credit = titleSlide
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : closingSlide
      ? '<p class="credit">Four gates. Honest evidence. &nbsp;·&nbsp; <b>Human approval</b> stays visible.</p>'
      : labBridgeSlide
        ? '<p class="credit">Now open <b>Section 7 Lab</b>. &nbsp;·&nbsp; The local lifecycle uses explicit approval.</p>'
        : '';
  const aria = `A hand-drawn technical diagram explains ${slide.title}.`;
  return `<section${titleSlide ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(aria)}">${visual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '7')
    .replaceAll('{{module.title}}', 'Build Infrastructure with Terraform, OpenTofu, and AI Agents')
    .replaceAll('{{module.subtitle}}', 'Understand the engine before you trust generated HCL.')
    .replaceAll('{{module.code}}', 'M7')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM7Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {html, slideCount: slides.length, dividerCount, contentCount: slides.length - dividerCount};
  if (result.slideCount !== 82 || dividerCount !== 11 || result.contentCount !== 71) {
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
  const result = await buildM7Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
