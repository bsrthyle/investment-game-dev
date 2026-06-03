import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const sessionCount = () => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open('InvestmentGameDB');
  r.onsuccess = () => { const c = r.result.transaction('sessions','readonly').objectStore('sessions').count(); c.onsuccess = () => res(c.result); };
  r.onerror = () => rej(r.error);
}));
try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('textbox').nth(0).fill('VERIFY-P1');
  await page.getByRole('textbox').nth(1).fill('ENUM-V');
  await page.getByRole('button', { name: /Start session/i }).click();
  await page.getByRole('button', { name: /English/i }).click();
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /Show me the counts/i }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /^1$/ }).click();
  await page.getByRole('button', { name: /High price/i }).click();
  await page.getByRole('button', { name: /Start practice/i }).click();
  async function season() {
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByText(/How much fertilizer/i).waitFor();
    for (let i=0;i<3;i++){const b=page.getByRole('button',{name:/Increase fertilizer/i}); if(await b.isDisabled())break; await b.click();}
    await page.getByRole('button', { name: /^Plant$/ }).click();
    await page.getByRole('button', { name: /Yes, plant now/i }).click();
    await page.getByRole('button', { name: /Reveal price/i }).click();
    await page.getByRole('button', { name: /See harvest/i }).click();
    await page.getByText(/Season summary/i).waitFor();
  }
  await season();
  await page.getByRole('button', { name: /Start real rounds/i }).click();
  for (let s=1;s<=10;s++){ await season(); if(s<10) await page.getByRole('button',{name:/Next season/i}).click(); else await page.getByRole('button',{name:/Finish rounds/i}).click(); }
  await page.getByRole('button', { name: /Continue/i }).click(); // -> survey
  // survey: in each question card click the first option, or fill the number input
  await page.getByRole('button', { name: /submit/i }).waitFor();
  const cards = page.locator('div.rounded-xl.bg-white.p-4');
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    if (await card.locator('input').count()) await card.locator('input').first().fill('5');
    else if (await card.locator('button').count()) await card.locator('button').first().click();
  }
  await page.getByRole('button', { name: /submit/i }).click();
  // completion
  await page.getByText(/thank you/i).waitFor({ timeout: 8000 });
  const before = await sessionCount();
  const hasNext = await page.getByRole('button', { name: /Next participant/i }).count();
  await page.screenshot({ path: new URL('../../docs/tutorial/img/completion.png', import.meta.url).pathname });
  await page.getByRole('button', { name: /Next participant/i }).click();
  await page.getByText(/Enumerator only/i).waitFor({ timeout: 5000 });
  const after = await sessionCount();
  console.log(`Next-participant button present: ${hasNext>0}`);
  console.log(`On setup screen after click: true`);
  console.log(`sessions in DB before: ${before}, after: ${after} (should be unchanged, >=1)`);
  console.log((hasNext>0 && after>=1 && after===before) ? 'PASS' : 'CHECK');
} catch (e) { console.error('FAILED:', e.message); process.exitCode=1; }
finally { await browser.close(); }
