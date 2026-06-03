// Play through real seasons at a high dose to capture a LOSS summary (drought).
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const OUT = new URL('../../docs/tutorial/img/', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const hide = () => page.addStyleTag({ content: `[aria-label="Reset session"]{display:none!important}` });

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('textbox').nth(0).fill('LOSS-DEMO-7');
  await page.getByRole('textbox').nth(1).fill('TUTORIAL');
  await page.getByRole('button', { name: /Start session/i }).click();
  await page.getByRole('button', { name: /English/i }).click();
  await page.getByRole('button', { name: /^Next$/ }).click();
  // training
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /Show me the counts/i }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /^1$/ }).click();
  await page.getByRole('button', { name: /High price/i }).click();
  await page.getByRole('button', { name: /Start practice/i }).click();

  async function playSeason(dose) {
    await page.getByText(/Season outlook|Season summary/).first().waitFor();
    await page.getByRole('button', { name: /Continue/i }).click();           // briefing -> dose
    await page.getByText(/How much fertilizer/i).waitFor();
    for (let i = 0; i < dose; i++) {
      const btn = page.getByRole('button', { name: /Increase fertilizer/i });
      if (await btn.isDisabled()) break;
      await btn.click();
    }
    await page.getByRole('button', { name: /^Invest$/ }).click();
    await page.getByRole('button', { name: /Yes, invest in fertilizer/i }).click();
    await page.getByRole('button', { name: /Reveal price/i }).click();
    await page.getByRole('button', { name: /See investment returns/i }).click();
    await page.getByText(/Season summary/i).waitFor();
    await page.waitForTimeout(250);
  }

  // practice
  await playSeason(9);
  await page.getByRole('button', { name: /Start real rounds/i }).click();

  let found = false;
  for (let s = 1; s <= 10 && !found; s++) {
    await playSeason(9);
    const txt = await page.locator('body').innerText();
    const m = txt.match(/TAKE-HOME\s+([\d.]+)/i);
    const takeHome = m ? parseFloat(m[1]) : 99;
    await hide();
    await page.screenshot({ path: `${OUT}loss-s${s}.png` });
    console.log(`season ${s}: take-home ${takeHome}`);
    if (takeHome < 25) { found = true; console.log('  -> LOSS captured'); }
    else await page.getByRole('button', { name: /Next season/i }).click();
  }
  console.log(found ? 'DONE: found a loss' : 'DONE: no loss in 10 seasons for this id');
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
