// Capture tutorial screenshots by walking the real game flow.
// Usage: node scripts/capture-screenshots.mjs   (dev server must be on :5173)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = new URL('../../docs/tutorial/img/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const shots = [];
async function shot(page, name) {
  // hide the dev reset overlay + status chips for clean tutorial images
  await page.addStyleTag({ content: `[aria-label="Reset session"]{display:none!important}` });
  await page.waitForTimeout(350);
  const file = `${OUT}${name}.png`;
  await page.screenshot({ path: file });
  shots.push(name);
  console.log('shot:', name);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 1. Welcome
  await page.getByRole('button', { name: /^Begin$/ }).waitFor();
  await shot(page, '01-welcome');
  await page.getByRole('button', { name: /^Begin$/ }).click();

  // 2. Enumerator setup → fill + start (inputs have no label assoc; use order)
  await page.getByRole('textbox').nth(0).fill('DEMO-001');
  await page.getByRole('textbox').nth(1).fill('TUTORIAL');
  await shot(page, '02-setup');
  await page.getByRole('button', { name: /Start session/i }).click();

  // 3. Language
  await page.getByRole('button', { name: /English/i }).waitFor();
  await shot(page, '03-language');
  await page.getByRole('button', { name: /English/i }).click();

  // 4. Instructions
  await page.getByRole('button', { name: /^Next$/ }).waitFor();
  await shot(page, '04-instructions');
  await page.getByRole('button', { name: /^Next$/ }).click();

  // 5. Training — concept (icon array example)
  await page.getByText(/Understanding chance/i).waitFor();
  await shot(page, '05-training-concept');
  await page.getByRole('button', { name: /Next/i }).click();
  // count step
  await page.getByRole('button', { name: /Show me the counts/i }).click();
  await shot(page, '06-training-count');
  await page.getByRole('button', { name: /Next/i }).click();
  // check step — answer both correctly (drought = 1, price = High)
  await page.getByText(/Two quick questions/i).waitFor();
  await shot(page, '07-training-check');
  await page.getByRole('button', { name: /^1$/ }).click();
  await page.getByRole('button', { name: /High price/i }).click();
  await page.getByRole('button', { name: /Start practice/i }).click();

  // 6. Practice round — briefing
  await page.getByText(/Season outlook/i).waitFor();
  await shot(page, '08-briefing');
  await page.getByRole('button', { name: /Continue/i }).click();

  // dose: set to 6 bags
  await page.getByText(/How much fertilizer/i).waitFor();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: /Increase fertilizer/i }).click();
  await page.waitForTimeout(150);
  await shot(page, '09-dose');
  await page.getByRole('button', { name: /^Plant$/ }).click();

  // confirm dialog
  await page.getByText(/Are you sure/i).waitFor();
  await shot(page, '10-confirm');
  await page.getByRole('button', { name: /Yes, plant now/i }).click();

  // reveal: rain, then price
  await page.getByText(/Harvest time/i).waitFor();
  await page.waitForTimeout(300);
  await shot(page, '11-reveal-rain');
  await page.getByRole('button', { name: /Reveal price/i }).click();
  await page.waitForTimeout(300);
  await shot(page, '12-reveal-price');
  await page.getByRole('button', { name: /See harvest/i }).click();

  // summary
  await page.getByText(/Season summary/i).waitFor();
  await page.waitForTimeout(300);
  await shot(page, '13-summary');
  await page.getByRole('button', { name: /Start real rounds/i }).click();

  // 7. Round 1 — capture another summary (different dose for variety)
  await page.getByText(/Season outlook/i).waitFor();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByText(/How much fertilizer/i).waitFor();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Increase fertilizer/i }).click();
  await page.getByRole('button', { name: /^Plant$/ }).click();
  await page.getByRole('button', { name: /Yes, plant now/i }).click();
  await page.getByRole('button', { name: /Reveal price/i }).click();
  await page.getByRole('button', { name: /See harvest/i }).click();
  await page.getByText(/Season summary/i).waitFor();
  await page.waitForTimeout(300);
  await shot(page, '14-summary-round1');

  console.log('\nDONE. Captured', shots.length, 'screenshots to', OUT);
} catch (e) {
  console.error('FAILED at screenshot', shots.length + 1, ':', e.message);
  await page.screenshot({ path: `${OUT}error-state.png` });
  process.exitCode = 1;
} finally {
  await browser.close();
}
