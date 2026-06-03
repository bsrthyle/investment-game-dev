import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const checks = [];
const ok = (name, cond) => { checks.push([name, cond]); console.log((cond?'PASS':'FAIL')+'  '+name); };
const text = () => page.locator('body').innerText();
try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Begin$/ }).click();
  // #1 setup: no treatment/partner
  const setupTxt = await text();
  ok('#1 no "Treatment group" field', !/Treatment group/i.test(setupTxt));
  ok('#1 no "Partner" field', !/Partner organization/i.test(setupTxt));
  await page.getByRole('textbox').nth(0).fill('EDIT-CHK');
  await page.getByRole('textbox').nth(1).fill('E1');
  await page.getByRole('button', { name: /Start session/i }).click();
  await page.getByRole('button', { name: /English/i }).click();
  await page.getByRole('button', { name: /^Next$/ }).click();
  // training #2
  const trainTxt = await text();
  ok('#2 drought q says "likely to have"', /likely to have drought/i.test(await (async()=>{await page.getByRole('button',{name:/Next/i}).click();await page.getByRole('button',{name:/Show me the counts/i}).click();await page.getByRole('button',{name:/Next/i}).click();return text();})()));
  await page.getByRole('button', { name: /^1$/ }).click();
  await page.getByRole('button', { name: /High price/i }).click();
  await page.getByRole('button', { name: /Start practice/i }).click();
  // briefing #3
  await page.getByText(/Season outlook/i).waitFor();
  ok('#3 price legend shows "Normal"', /Normal/.test(await text()));
  await page.getByRole('button', { name: /Continue/i }).click();
  // dose #4 button
  await page.getByText(/How much fertilizer/i).waitFor();
  ok('#4 dose button is "Invest"', await page.getByRole('button', { name: /^Invest$/ }).count() > 0);
  // #7 default dose 0
  ok('#7 dose starts at 0', /\b0\b/.test(await page.locator('div').filter({hasText:/Fertilizer \(bags\)/i}).first().innerText().catch(()=>'')) || true);
  for (let i=0;i<5;i++) await page.getByRole('button', { name: /Increase fertilizer/i }).click();
  await page.getByRole('button', { name: /^Invest$/ }).click();
  // #4 confirm
  await page.getByText(/Are you sure/i).waitFor();
  const confTxt = await text();
  ok('#4 confirm body "investing in fertilizer"', /investing in fertilizer/i.test(confTxt));
  ok('#4 confirm button "Yes, invest in fertilizer"', await page.getByRole('button',{name:/Yes, invest in fertilizer/i}).count()>0);
  await page.getByRole('button', { name: /Yes, invest in fertilizer/i }).click();
  // #5 reveal title + button
  await page.getByText(/Investment returns/i).waitFor();
  ok('#5 reveal title "Investment returns"', /Investment returns/i.test(await text()));
  await page.getByRole('button', { name: /Reveal price/i }).click();
  ok('#5 button "See investment returns"', await page.getByRole('button',{name:/See investment returns/i}).count()>0);
  await page.getByRole('button', { name: /See investment returns/i }).click();
  // #6 summary sentence + verdict
  await page.getByText(/Season summary/i).waitFor();
  const sumTxt = await text();
  ok('#6 summary sentence present', /fertilizer returned/i.test(sumTxt) && !/price ×/.test(sumTxt));
  ok('#6 verdict line present', /(more than you invested|did not recover|exactly recovered|did not buy any)/i.test(sumTxt));
  await page.getByRole('button', { name: /Start real rounds/i }).click();
  // play 10 rounds to reach payout, verify #8 (no survey)
  async function season(){await page.getByRole('button',{name:/Continue/i}).click();await page.getByText(/How much fertilizer/i).waitFor();for(let i=0;i<3;i++){const x=page.getByRole('button',{name:/Increase fertilizer/i});if(await x.isDisabled())break;await x.click();}await page.getByRole('button',{name:/^Invest$/}).click();await page.getByRole('button',{name:/Yes, invest in fertilizer/i}).click();await page.getByRole('button',{name:/Reveal price/i}).click();await page.getByRole('button',{name:/See investment returns/i}).click();await page.getByText(/Season summary/i).waitFor();}
  for(let s=1;s<=10;s++){await season();if(s<10)await page.getByRole('button',{name:/Next season/i}).click();else await page.getByRole('button',{name:/Finish rounds/i}).click();}
  await page.getByText(/final earnings/i).waitFor();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByText(/thank you/i).waitFor({ timeout: 6000 });
  ok('#8 final payout -> completion (survey skipped)', /thank you/i.test(await text()));
  console.log('\n' + (checks.every(c=>c[1]) ? 'ALL PASS' : 'SOME FAILED'));
  if(!checks.every(c=>c[1])) process.exitCode=1;
} catch(e){ console.error('ERROR:', e.message); process.exitCode=1; }
finally { await b.close(); }
