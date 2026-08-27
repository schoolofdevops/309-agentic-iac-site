import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual} from './lib/primitives.mjs';
import {slides} from './specs/m8-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m8-test-secure-ai-generated-infrastructure.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (number) => `M8&middot;${String(number).padStart(2, '0')}`;

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
  const isClosing = slide.n === 74;
  const isLabBridge = slide.n === 75;
  const kicker = isTitle
    ? '<p class="kicker">MODULE 8 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : isClosing
      ? '<p class="kicker">MODULE 8 &nbsp;·&nbsp; EVIDENCE AND REVIEW</p>'
      : isLabBridge
        ? '<p class="kicker">MODULE 8 &nbsp;·&nbsp; LAB BRIDGE</p>'
        : '';
  const credit = isTitle
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : isClosing
      ? '<p class="credit">Ten gates prepare the change. &nbsp;·&nbsp; <b>A human owns the decision.</b></p>'
      : isLabBridge
        ? '<p class="credit">Now open <b>Section 8 Lab</b>. &nbsp;·&nbsp; No cloud account and no apply.</p>'
        : '';
  const titleStyle = isTitle ? ' style="font-size:1.48em"' : '';
  const subtitleStyle = isTitle ? ' style="font-size:1.02em"' : '';
  const aria = `A hand-drawn technical diagram explains ${slide.title}.`;

  return `<section${isTitle ? ' data-auto-animate' : ''}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2>${slide.subtitle ? `<p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p>` : ''}<svg viewBox="0 0 1100 400" role="img" aria-label="${escapeHtml(aria)}">${renderVisual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '8')
    .replaceAll('{{module.title}}', 'Test and Secure AI-Generated Infrastructure Code')
    .replaceAll('{{module.subtitle}}', 'Build evidence before you trust generated HCL.')
    .replaceAll('{{module.code}}', 'M8')
    .replace('{{slides}}', candidateSlides.map(renderSection).join('\n\n'));

  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.05em;max-width:90%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
  </style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM8Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {
    html,
    slideCount: slides.length,
    dividerCount,
    contentCount: slides.length - dividerCount,
  };
  if (result.slideCount !== 75 || dividerCount !== 9 || result.contentCount !== 66) {
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
  const result = await buildM8Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
