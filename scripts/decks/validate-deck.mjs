import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildM1Deck} from './build-m1-deck.mjs';
import {
  boundaryToward,
  center,
  cubicPath,
  linePath,
  rect,
  validateEdge,
} from './lib/geometry.mjs';

const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
);

function parseNumber(value, context) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${context} must be numeric`);
  return parsed;
}

function parsePath(data) {
  const number = '(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))';
  const line = new RegExp(`^M${number},${number}\\s+L${number},${number}$`).exec(data);
  if (line) {
    return linePath(
      {x: Number(line[1]), y: Number(line[2])},
      {x: Number(line[3]), y: Number(line[4])},
    );
  }
  const cubic = new RegExp(`^M${number},${number}\\s+C${number},${number}\\s+${number},${number}\\s+${number},${number}$`).exec(data);
  if (cubic) {
    return cubicPath(
      {x: Number(cubic[1]), y: Number(cubic[2])},
      {x: Number(cubic[3]), y: Number(cubic[4])},
      {x: Number(cubic[5]), y: Number(cubic[6])},
      {x: Number(cubic[7]), y: Number(cubic[8])},
    );
  }
  throw new Error(`unsupported connector path ${data}`);
}

function pageId(section, index) {
  const match = /<div class="pageno">([^<]+)<\/div>/.exec(section);
  if (!match) return `section ${index + 1}`;
  return match[1].replace('&middot;', '.').replace('·', '.');
}

export function validateDeckHtml(html) {
  const errors = [];
  const sections = [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
  let nodeCount = 0;
  let edgeCount = 0;

  sections.forEach((section, sectionIndex) => {
    const slide = pageId(section, sectionIndex);
    const nodes = [];
    for (const match of section.matchAll(/<g\b[^>]*data-node-id="[^"]+"[^>]*>/g)) {
      try {
        const data = attributes(match[0]);
        nodes.push(rect(
          data['data-node-id'],
          parseNumber(data['data-x'], `${data['data-node-id']}.x`),
          parseNumber(data['data-y'], `${data['data-node-id']}.y`),
          parseNumber(data['data-width'], `${data['data-node-id']}.width`),
          parseNumber(data['data-height'], `${data['data-node-id']}.height`),
        ));
      } catch (error) {
        errors.push(`slide ${slide}: ${error.message}`);
      }
    }
    nodeCount += nodes.length;

    for (const match of section.matchAll(/<path\b[^>]*data-edge-id="[^"]+"[^>]*\/?\s*>/g)) {
      const data = attributes(match[0]);
      const id = data['data-edge-id'];
      edgeCount += 1;
      if (!data['marker-end']) errors.push(`slide ${slide} edge ${id}: marker-end is required`);
      try {
        const route = parsePath(data.d);
        const source = nodes.find((node) => node.id === data['data-from']);
        const target = nodes.find((node) => node.id === data['data-to']);
        const connector = {
          id,
          from: data['data-from'],
          to: data['data-to'],
          fromPort: data['data-from-port'],
          toPort: data['data-to-port'],
          route,
        };
        if (source && target && connector.fromPort === 'ray' && connector.toPort === 'ray') {
          connector.fromPoint = boundaryToward(source, center(target));
          connector.toPoint = boundaryToward(target, center(source));
        }
        for (const error of validateEdge(connector, nodes)) {
          errors.push(`slide ${slide} edge ${id}: ${error}`);
        }
      } catch (error) {
        errors.push(`slide ${slide} edge ${id}: ${error.message}`);
      }
    }
  });

  return {errors: [...new Set(errors)], stats: {slideCount: sections.length, nodeCount, edgeCount}};
}

export async function compareFreshDeck(committedPath) {
  const directory = await mkdtemp(join(tmpdir(), 'm1-deck-fresh-'));
  const generatedPath = join(directory, basename(committedPath));
  try {
    await buildM1Deck({outputPath: generatedPath});
    const [committed, generated] = await Promise.all([
      readFile(committedPath, 'utf8'),
      readFile(generatedPath, 'utf8'),
    ]);
    return committed === generated ? [] : ['generated deck differs from committed artifact'];
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const input = process.argv[2];
  if (!input) throw new Error('usage: validate-deck.mjs <deck.html> [--fresh]');
  const committedPath = resolve(input);
  const html = await readFile(committedPath, 'utf8');
  const result = validateDeckHtml(html);
  if (process.argv.includes('--fresh')) result.errors.push(...await compareFreshDeck(committedPath));
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`${result.stats.slideCount} slides · ${result.stats.nodeCount} semantic nodes · ${result.stats.edgeCount} validated connectors · fresh artifact`);
  }
}
