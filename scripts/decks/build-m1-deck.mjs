import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {renderVisual} from './lib/primitives.mjs';
import {slides} from './specs/m1-slides.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const DEFAULT_OUTPUT = resolve(REPOSITORY_ROOT, 'static/decks/m1-agentic-iac-fundamentals.html');
const SHELL_PATH = resolve(SCRIPT_DIRECTORY, 'deck-shell.html.tmpl');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const page = (number) => `M1&middot;${String(number).padStart(2, '0')}`;

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

  const titleSlide = slide.titleSlide;
  const kicker = titleSlide
    ? '<p class="kicker">MODULE 1 &nbsp;·&nbsp; AGENTIC INFRASTRUCTURE AS CODE</p>'
    : slide.n === 60
      ? '<p class="kicker">MODULE 1 &nbsp;·&nbsp; FOUNDATION COMPLETE</p>'
      : '';
  const titleStyle = titleSlide ? ' style="font-size:1.8em"' : '';
  const subtitleStyle = titleSlide ? ' style="font-size:1.1em"' : '';
  const viewBox = titleSlide ? '0 0 1100 380' : '0 0 1100 400';
  const aria = titleSlide
    ? 'A human gives intent to a bounded agent that works with repository tools and returns evidence for approval.'
    : `A hand-drawn technical diagram explains ${slide.title}.`;
  const credit = titleSlide
    ? '<p class="credit"><b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI &nbsp;·&nbsp; Lesson + Lab + Quiz</p>'
    : slide.n === 60
      ? '<p class="credit">Now open <b>Section 1 Lab</b>. &nbsp;·&nbsp; <b>Gourav Shah</b> &nbsp;·&nbsp; School of DevOps &amp; AI</p>'
      : '';
  const autoAnimate = titleSlide ? ' data-auto-animate' : '';

  return `<section${autoAnimate}>${kicker}<h2 class="t"${titleStyle}>${escapeHtml(slide.title)}</h2><p class="s"${subtitleStyle}>${escapeHtml(slide.subtitle)}</p><svg viewBox="${viewBox}" role="img" aria-label="${escapeHtml(aria)}">${renderVisual(slide)}</svg>${credit}<div class="pageno">${page(slide.n)}</div></section>`;
}

function assembleDeck(shell, candidateSlides) {
  validateSlideSequence(candidateSlides);
  const slideHtml = candidateSlides.map(renderSection).join('\n\n');
  let html = shell
    .replaceAll('{{course.title}}', 'Agentic Infrastructure as Code')
    .replaceAll('{{module.no}}', '1')
    .replaceAll('{{module.title}}', 'Agentic Infrastructure as Code Fundamentals')
    .replaceAll('{{module.subtitle}}', 'Intent, tools, evidence, and human control.')
    .replaceAll('{{module.code}}', 'M1')
    .replace('{{slides}}', slideHtml);
  html = html.replace('</head>', `<style>
  .reveal .slides section.divider{justify-content:center;align-items:center;}
  .reveal .slides section.divider h2.t{order:0;font-size:2.2em;max-width:88%;}
  .reveal .slides section:first-of-type svg{min-height:32%;}
</style></head>`);
  if (html.includes('{{slides}}')) throw new Error('deck shell contains an unresolved slides token');
  return html;
}

export async function buildM1Deck({outputPath = DEFAULT_OUTPUT, checkOnly = false} = {}) {
  const shell = await readFile(SHELL_PATH, 'utf8');
  const html = assembleDeck(shell, slides);
  const dividerCount = slides.filter((slide) => slide.divider).length;
  const result = {
    html,
    slideCount: slides.length,
    dividerCount,
    contentCount: slides.length - dividerCount,
  };
  if (result.slideCount !== 61 || dividerCount !== 10 || result.contentCount !== 51) {
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
  const result = await buildM1Deck();
  console.log(`wrote ${DEFAULT_OUTPUT}`);
  console.log(`${result.slideCount} slides · ${result.dividerCount} dividers · ${result.contentCount} content slides`);
}
