import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createServer} from 'node:http';
import {dirname, extname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

import {slides} from './specs/m5-slides.mjs';

const execute = promisify(execFile);
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../..');
const STATIC_DIRECTORY = resolve(REPOSITORY_ROOT, 'static');
const DECK_PATH = resolve(STATIC_DIRECTORY, 'decks/m5-connect-iac-agent-tools-skills-mcp.html');
const ARTIFACT_DIRECTORY = resolve(REPOSITORY_ROOT, '.artifacts/decks/m5');
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mimeTypes = new Map([['.html', 'text/html; charset=utf-8'], ['.png', 'image/png']]);

async function executable(path) {
  if (!path) return false;
  try { await access(path, constants.X_OK); return true; } catch { return false; }
}

export async function findChrome() {
  if (await executable(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    try {
      const {stdout} = await execute('which', [command]);
      if (await executable(stdout.trim())) return stdout.trim();
    } catch { /* try next */ }
  }
  if (await executable(MAC_CHROME)) return MAC_CHROME;
  throw new Error('Chrome not found; set CHROME_BIN');
}

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const requestedPath = resolve(STATIC_DIRECTORY, relative || 'index.html');
      if (!requestedPath.startsWith(`${STATIC_DIRECTORY}/`)) return response.writeHead(403).end('Forbidden');
      const body = await readFile(requestedPath);
      response.writeHead(200, {'content-type': mimeTypes.get(extname(requestedPath)) || 'application/octet-stream'}).end(body);
    } catch { response.writeHead(404).end('Not found'); }
  });
  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

const sectionFragments = (html) => [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) =>
  (match[0].match(/class="[^"]*\bfragment\b[^"]*"/g) || []).length,
);
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

async function writeContactSheet() {
  const tiles = slides.map((slide) => {
    const number = String(slide.n).padStart(2, '0');
    return `<figure><img src="slide-${number}.png" alt="Slide ${slide.n}: ${escapeHtml(slide.title)}"><figcaption><b>M5.${number}</b> ${escapeHtml(slide.title)}</figcaption></figure>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Module 5 deck contact sheet</title><style>body{margin:24px;background:#eee;font:15px system-ui;color:#222}h1{margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}figure{margin:0;background:white;padding:8px;border:1px solid #bbb;border-radius:8px}img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:white}figcaption{padding:8px 4px 3px;line-height:1.35}</style></head><body><h1>Module 5 · 60-slide visual QA</h1><div class="grid">${tiles}</div></body></html>`;
  await writeFile(join(ARTIFACT_DIRECTORY, 'contact-sheet.html'), html, 'utf8');
}

export async function renderM5Deck() {
  const chrome = await findChrome();
  const deckHtml = await readFile(DECK_PATH, 'utf8');
  const fragmentCounts = sectionFragments(deckHtml);
  if (fragmentCounts.length !== slides.length) throw new Error(`expected ${slides.length} sections, found ${fragmentCounts.length}`);
  await mkdir(ARTIFACT_DIRECTORY, {recursive: true});
  const server = await startStaticServer();
  const address = server.address();
  try {
    for (let index = 0; index < slides.length; index += 1) {
      const number = String(index + 1).padStart(2, '0');
      const output = join(ARTIFACT_DIRECTORY, `slide-${number}.png`);
      const finalFragment = fragmentCounts[index] ? `/0/${fragmentCounts[index] - 1}` : '';
      const url = `http://127.0.0.1:${address.port}/decks/m5-connect-iac-agent-tools-skills-mcp.html?transition=none#/${index}${finalFragment}`;
      await execute(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,720', '--virtual-time-budget=3000', '--run-all-compositor-stages-before-draw', `--screenshot=${output}`, url], {maxBuffer: 1024 * 1024});
      if ((index + 1) % 5 === 0 || index === slides.length - 1) console.log(`rendered ${index + 1}/${slides.length}`);
    }
    await writeContactSheet();
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  console.log(`wrote ${ARTIFACT_DIRECTORY}/slide-01.png through slide-60.png`);
  console.log(`wrote ${ARTIFACT_DIRECTORY}/contact-sheet.html`);
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) await renderM5Deck();
