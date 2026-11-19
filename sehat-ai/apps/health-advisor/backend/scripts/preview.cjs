const fs = require('node:fs/promises');
const path = require('node:path');
const { buildPreviewRequest, PREVIEW_MODEL } = require('../dist/preview/request');
const { callPreview } = require('../dist/preview/client');

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--dry-run'].includes(arg))) throw new Error('Usage: npm run preview -- [--dry-run]');
  const root = path.resolve(__dirname, '..');
  try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const request = buildPreviewRequest(process.env.HEALTH_ADVISOR_PREVIEW_MODEL || PREVIEW_MODEL);
  const dryRun = args.includes('--dry-run');
  const key = process.env.GEMINI_API_KEY || '';
  if (!dryRun && !key) throw new Error('GEMINI_API_KEY is missing. Copy .env.example to .env and set your free-tier key.');
  const dir = await fs.mkdtemp(path.join(await ensureResults(root), 'preview-'));
  // Headers and credentials are deliberately absent from saved requests.
  await fs.writeFile(path.join(dir, 'request.json'), JSON.stringify(request, null, 2));
  console.log(`Model: ${request.model}; synthetic patient; catalog foods: ${request.context.catalog.foods.length}`);
  console.log(`Request: ${path.join(dir, 'request.json')}`);
  if (dryRun) { console.log('Dry run: no API request made.'); return; }
  try {
    const result = await callPreview(request, key, Number(process.env.HEALTH_ADVISOR_PREVIEW_TIMEOUT_MS || 120000));
    await fs.writeFile(path.join(dir, 'response.json'), JSON.stringify(result, null, 2));
    await fs.writeFile(path.join(dir, 'raw.txt'), result.rawText || result.rawResponse);
    console.log(`Response: ${path.join(dir, 'response.json')}`);
    console.log(`HTTP ${result.httpStatus}; finish: ${result.finishReason}; ${result.elapsedMs} ms`);
    if (!result.complete) { console.error('Response failed or is incomplete. Inspect the saved response; no fallback was used.'); process.exitCode = 1; }
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'Request timed out.' : 'Network request failed.';
    await fs.writeFile(path.join(dir, 'error.json'), JSON.stringify({ reason, model: request.model }));
    throw new Error(`${reason} See ${dir}`);
  }
}
async function ensureResults(root) {
  const dir = path.join(root, 'preview-results');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
