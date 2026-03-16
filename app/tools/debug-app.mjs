import { chromium } from 'playwright';

const BASE = 'http://localhost:8081';
const errors = [];
const warnings = [];
const logs = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 414, height: 896 }, // iPhone XR size
  permissions: ['camera'],
});
const page = await context.newPage();

// Capture all console messages
page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') errors.push(text);
  else if (type === 'warning') warnings.push(text);
  else logs.push(text.substring(0, 200));
});

// Capture page errors (crashes)
page.on('pageerror', (err) => {
  errors.push(`PAGE CRASH: ${err.message}`);
});

console.log('=== AR-DeC Debug Report ===\n');

// 1. Load Home Screen
console.log('--- Home Screen ---');
try {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check if app rendered (not white screen)
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.length : 0;
  });
  console.log(`Root HTML size: ${rootContent} chars (0 = white screen)`);

  // Check visible text
  const visibleText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log(`Visible text: "${visibleText.substring(0, 200)}"`);

  // Screenshot
  await page.screenshot({ path: 'tools/debug-home.png' });
  console.log('Screenshot: tools/debug-home.png');
} catch (e) {
  console.log(`FAILED: ${e.message}`);
}

// 2. Navigate to Scan tab
console.log('\n--- Scanner Screen ---');
try {
  const scanTab = await page.$('text=Scan');
  if (scanTab) {
    await scanTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tools/debug-scan.png' });
    console.log('Screenshot: tools/debug-scan.png');

    const scanText = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`Visible: "${scanText.substring(0, 150)}"`);
  } else {
    console.log('FAILED: Scan tab not found');
  }
} catch (e) {
  console.log(`FAILED: ${e.message}`);
}

// 3. Navigate to Profile tab
console.log('\n--- Profile Screen ---');
try {
  const profileTab = await page.$('text=Profile');
  if (profileTab) {
    await profileTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tools/debug-profile.png' });
    console.log('Screenshot: tools/debug-profile.png');
  } else {
    console.log('FAILED: Profile tab not found');
  }
} catch (e) {
  console.log(`FAILED: ${e.message}`);
}

// 4. Go back to Home and tap Quiz quick action
console.log('\n--- Quiz Screen ---');
try {
  const homeTab = await page.$('text=Home');
  if (homeTab) await homeTab.click();
  await page.waitForTimeout(1000);

  const quizBtn = await page.$('text=Quiz');
  if (quizBtn) {
    await quizBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tools/debug-quiz.png' });
    console.log('Screenshot: tools/debug-quiz.png');
  } else {
    console.log('Quiz button not found (may need words scanned first)');
  }
} catch (e) {
  console.log(`FAILED: ${e.message}`);
}

// 5. AR View
console.log('\n--- AR View Screen ---');
try {
  const homeTab = await page.$('text=Home');
  if (homeTab) await homeTab.click();
  await page.waitForTimeout(1000);

  const arBtn = await page.$('text=AR View');
  if (arBtn) {
    await arBtn.click();
    await page.waitForTimeout(4000); // wait for Sketchfab to load
    await page.screenshot({ path: 'tools/debug-ar.png' });
    console.log('Screenshot: tools/debug-ar.png');
  } else {
    console.log('AR View button not found');
  }
} catch (e) {
  console.log(`FAILED: ${e.message}`);
}

// Summary
console.log('\n=== ERRORS ===');
if (errors.length === 0) console.log('(none)');
errors.forEach((e, i) => console.log(`${i + 1}. ${e.substring(0, 300)}`));

console.log('\n=== WARNINGS ===');
if (warnings.length === 0) console.log('(none)');
warnings.forEach((w, i) => console.log(`${i + 1}. ${w.substring(0, 200)}`));

console.log(`\n=== SUMMARY ===`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Logs: ${logs.length}`);

await browser.close();
