// Capture enumerator/admin screenshots: admin tabs (with sample sessions),
// setup form, and final payout. Dev server must be on :5173.
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const WORKER = 'https://fertilizer-game-server.bismignot.workers.dev';
const OUT = new URL('../../docs/tutorial/img/', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const hide = () => page.addStyleTag({ content: `[aria-label="Reset session"]{display:none!important}` });
const shot = async (name) => { await hide(); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}${name}.png` }); console.log('shot', name); };

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600); // let Dexie open the DB

  // inject two sample sessions so the admin views look realistic
  await page.evaluate(() => new Promise((resolve, reject) => {
    const req = indexedDB.open('InvestmentGameDB');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sessions')) return resolve();
      const tx = db.transaction('sessions', 'readwrite');
      const s = tx.objectStore('sessions');
      const now = Date.now();
      s.add({ participantId: 'NG-0142', sessionId: 'a1', treatmentGroup: 'T1', sessionStartTime: new Date(now - 5400e3).toISOString(), currentScreen: 'COMPLETION', totalRevenueTokens: 268, syncStatus: 'synced', createdAt: now - 5400e3 });
      s.add({ participantId: 'NG-0143', sessionId: 'a2', treatmentGroup: 'Control', sessionStartTime: new Date(now - 1800e3).toISOString(), currentScreen: 'COMPLETION', totalRevenueTokens: 254, syncStatus: 'pending', createdAt: now - 1800e3 });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  }));

  // open admin (hidden top-right button on Welcome)
  await page.getByRole('button', { name: /Admin panel/i }).click();
  await page.getByText(/Enter PIN/i).waitFor();
  await shot('admin-pin');
  await page.getByRole('textbox').fill('1234');
  await page.getByRole('button', { name: /Unlock/i }).click();

  // Sessions tab (default)
  await page.getByText(/Participant/i).first().waitFor();
  await shot('admin-sessions');

  // Sync tab (wait for its config useEffect to settle before filling)
  await page.getByRole('button', { name: /^Sync$/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole('textbox').nth(0).fill(WORKER);
  await page.getByRole('textbox').nth(1).fill('FIELD-PASS-2026');
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^Save$/ }).click();   // must Save before Test
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Test connection/i }).click();
  await page.getByText(/Connected/i).waitFor({ timeout: 15000 }).catch(() => {});
  await shot('admin-sync');

  // Export tab
  await page.getByRole('button', { name: /Export/i }).click();
  await page.waitForTimeout(300);
  await shot('admin-export');

  // Diagnostics tab
  await page.getByRole('button', { name: /Diagnostics/i }).click();
  await page.waitForTimeout(400);
  await shot('admin-diagnostics');

  // close admin
  await page.getByRole('button', { name: /^Close$/ }).click();

  // ---- setup form (filled) + full session to final payout ----
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('textbox').nth(0).fill('NG-0144');
  await page.getByRole('textbox').nth(1).fill('ENUM-07');
  // pick a treatment group if buttons exist
  await page.getByRole('button', { name: /^T1$/ }).click().catch(() => {});
  await page.waitForTimeout(200);
  await shot('admin-setup');
  await page.getByRole('button', { name: /Start session/i }).click();

  // language → instructions → training
  await page.getByRole('button', { name: /English/i }).click();
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /Show me the counts/i }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /^1$/ }).click();
  await page.getByRole('button', { name: /High price/i }).click();
  await page.getByRole('button', { name: /Start practice/i }).click();

  async function playSeason(dose) {
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByText(/How much fertilizer/i).waitFor();
    for (let i = 0; i < dose; i++) {
      const b = page.getByRole('button', { name: /Increase fertilizer/i });
      if (await b.isDisabled()) break;
      await b.click();
    }
    await page.getByRole('button', { name: /^Invest$/ }).click();
    await page.getByRole('button', { name: /Yes, invest in fertilizer/i }).click();
    await page.getByRole('button', { name: /Reveal price/i }).click();
    await page.getByRole('button', { name: /See investment returns/i }).click();
    await page.getByText(/Season summary/i).waitFor();
  }

  await playSeason(5);                                   // practice
  await page.getByRole('button', { name: /Start real rounds/i }).click();
  for (let s = 1; s <= 10; s++) {
    await playSeason(4 + (s % 4));
    if (s < 10) await page.getByRole('button', { name: /Next season/i }).click();
    else await page.getByRole('button', { name: /Finish rounds/i }).click();
  }

  // final payout
  await page.getByText(/final earnings/i).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await shot('final-payout');

  console.log('DONE');
} catch (e) {
  console.error('FAILED:', e.message);
  await page.screenshot({ path: `${OUT}enum-error.png` });
  process.exitCode = 1;
} finally {
  await browser.close();
}
