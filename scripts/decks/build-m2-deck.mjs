import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual, slugId} from './lib/primitives.mjs';
import {cubicPath, linePath, port, rect, validateEdge} from './lib/geometry.mjs';
import {slides} from './specs/m2-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m2-first-iac-change-ai-coding-agent.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');
const INK = '#1e1e1e';
const GRAY = '#757575';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (number) => `M2&middot;${String(number).padStart(2, '0')}`;

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

function node(label, x, y, width, height, fill, id = slugId(label)) {
  const box = rect(id, x, y, width, height);
  const lines = String(label).split('|');
  const labelY = y + (height - (lines.length - 1) * 22) / 2 + 7;
  return {
    box,
    html: `<g class="semantic-node" data-node-id="${id}" data-x="${x}" data-y="${y}" data-width="${width}" data-height="${height}"><g filter="url(#rough)" stroke="${INK}" stroke-width="2.6"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="13" fill="${fill}"/></g>${text(x + width / 2, labelY, label, 'lbl-b')}</g>`,
  };
}

function edge(id, from, fromPort, to, toPort, route, nodes, {gray = true, fragment = false} = {}) {
  const connector = {id, from, fromPort, to, toPort, route};
  const errors = validateEdge(connector, nodes.map((item) => item.box));
  if (errors.length) throw new Error(`invalid M2 connector ${id}: ${errors.join('; ')}`);
  const fragmentClass = fragment ? ' class="fragment"' : '';
  // SVG filters can collapse around a perfectly horizontal or vertical path.
  // Keep connectors unfiltered so every arrow remains visible in browser renders.
  return `<g${fragmentClass} fill="none" stroke="${gray ? GRAY : INK}" stroke-width="2.2"><path data-edge-id="${id}" data-from="${from}" data-to="${to}" data-from-port="${fromPort}" data-to-port="${toPort}" d="${route.d}" marker-end="url(#${gray ? 'ahg' : 'ah'})"/></g>`;
}

function stateMachine() {
  const proposed = node('proposed', 30, 115, 125, 66, '#dae8fc', 'proposed');
  const authorized = node('authorized', 205, 115, 135, 66, '#e1d5e7', 'authorized');
  const changed = node('changed', 390, 115, 125, 66, '#ffe6cc', 'changed');
  const validated = node('validated', 565, 115, 130, 66, '#d5e8d4', 'validated');
  const approved = node('approved', 745, 115, 125, 66, '#d5e8d4', 'approved');
  const stopped = node('stopped', 920, 115, 125, 66, '#d5e8d4', 'stopped');
  const rejected = node('rejected', 390, 285, 125, 66, '#f8cecc', 'rejected');
  const nodes = [proposed, authorized, changed, validated, approved, stopped, rejected];
  const edges = [
    edge('proposed-to-authorized', 'proposed', 'right', 'authorized', 'left', linePath(port(proposed.box, 'right'), port(authorized.box, 'left')), nodes),
    edge('authorized-to-changed', 'authorized', 'right', 'changed', 'left', linePath(port(authorized.box, 'right'), port(changed.box, 'left')), nodes),
    edge('changed-to-validated', 'changed', 'right', 'validated', 'left', linePath(port(changed.box, 'right'), port(validated.box, 'left')), nodes),
    edge('validated-to-approved', 'validated', 'right', 'approved', 'left', linePath(port(validated.box, 'right'), port(approved.box, 'left')), nodes),
    edge('approved-to-stopped', 'approved', 'right', 'stopped', 'left', linePath(port(approved.box, 'right'), port(stopped.box, 'left')), nodes),
    edge('changed-to-rejected', 'changed', 'bottom', 'rejected', 'top', linePath(port(changed.box, 'bottom'), port(rejected.box, 'top')), nodes),
    edge('validated-to-rejected', 'validated', 'bottom', 'rejected', 'right', cubicPath(port(validated.box, 'bottom'), {x: 630, y: 260}, {x: 560, y: 318}, port(rejected.box, 'right')), nodes),
    edge('rejected-to-proposed', 'rejected', 'left', 'proposed', 'bottom', cubicPath(port(rejected.box, 'left'), {x: 260, y: 360}, {x: 92, y: 285}, port(proposed.box, 'bottom')), nodes),
  ];
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}${text(550, 383, 'rejection returns to a corrected task · no path to deploy', 'lbl-g')}`;
}

function applyBlock(items) {
  const fills = ['#dae8fc', '#d5e8d4', '#e1d5e7'];
  const nodes = items.slice(0, 3).map((label, index) => node(label, 70 + index * 280, 125, 205, 100, fills[index], `safe-${index + 1}`));
  const edges = nodes.slice(0, -1).map((source, index) => {
    const target = nodes[index + 1];
    return edge(`safe-${index + 1}-to-${index + 2}`, source.box.id, 'right', target.box.id, 'left', linePath(port(source.box, 'right'), port(target.box, 'left')), nodes);
  });
  return `${edges.join('')}${nodes.map((item) => item.html).join('')}
    <g filter="url(#rough)" fill="none" stroke="#c62828" stroke-width="3" stroke-dasharray="9 7"><line x1="890" y1="60" x2="890" y2="315"/><rect x="925" y="125" width="130" height="100" rx="13" fill="#f8cecc"/><path d="M935,135 L1045,215 M1045,135 L935,215"/></g>
    ${text(990, 180, items[3], 'lbl-b')}${text(890, 350, 'outside this task', 'lbl-g')}`;
}

function terraformRepair() {
  const resource = node('resource|random_id.platform', 90, 75, 395, 210, '#d5e8d4', 'resource-block');
  const output = node('output.platform_name|random_id.platform.hex', 625, 105, 390, 150, '#dae8fc', 'output-reference');
  const nodes = [resource, output];
  const connector = edge('resource-to-output', resource.box.id, 'right', output.box.id, 'left', linePath(port(resource.box, 'right'), port(output.box, 'left')), nodes, {fragment: true, gray: false});
  return `<g class="fragment">${resource.html}${text(287, 215, 'byte_length = 4', 'lbl')}</g>${connector}${output.html}${text(550, 330, '+4 lines · output remains unchanged', 'lbl-g')}`;
}

function slideVisual(slide) {
  if (slide.type === 'state-machine') return stateMachine();
  if (slide.type === 'apply-block') return applyBlock(slide.items);
  if (slide.type === 'terraform-repair') return terraformRepair();
  return renderVisual(slide);
}

function renderSection(slide) {
  if (slide.divider) {
    return `<section class="divider"><h2 class="t">${escapeHtml(slide.title)}</h2><div class="pageno">${page(slide.n)}</div></section>`;
  }

  const titleSlide = slide.titleSlide;
  const closingSlide = slide.n === 42;
  const kicker = titleSlide
    ? '<p class="kicker">MODULE 2 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : closingSlide
      ? '<p class="kicker">MODULE 2 &nbsp;·&nbsp; READY FOR REVIEW</p>'
      : '';
  const titleStyle = titleSlide ? ' style="font-size:1.65em"' : '';
  const subtitleStyle = titleSlide ? ' style="font-size:1.1em"' : '';
  const viewBox = titleSlide ? '0 0 1100 380' : '0 0 1100 400';
  const credit = titleSlide
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : closingSlide
      ? '<p class="credit">Now open <b>Section 2 Lab</b>. &nbsp;·&nbsp; <b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI</p>'
      : '';
  const aria = `A hand-drawn technical diagram explains ${slide.title}.`;
  return `<section${titleSlide ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2><p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p><svg viewBox="${viewBox}" role="img" aria-label="${escapeHtml(aria)}">${slideVisual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  const slideHtml = candidateSlides.map(renderSection).join('\n\n');
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '2')
    .replaceAll('{{module.title}}', 'Build Your First IaC Change with an AI Coding Agent')
    .replaceAll('{{module.subtitle}}', 'One safe repair. Direct proof. Human review.')
    .replaceAll('{{module.code}}', 'M2')
    .replace('{{slides}}', slideHtml);
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
</style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM2Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {html, slideCount: slides.length, dividerCount, contentCount: slides.length - dividerCount};
  if (result.slideCount !== 43 || dividerCount !== 8 || result.contentCount !== 35) {
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
  const result = await buildM2Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
