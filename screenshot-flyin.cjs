const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:4332/aopa/home-4", { waitUntil: "networkidle" });

  const spacer = await page.$("#flyin-spacer");
  await spacer.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(800);

  await page.screenshot({ path: "/private/tmp/claude-503/-Users-johnfuller-Code-grubby-galaxy/5d60eacf-cbe2-4250-9ad1-e41dc7927103/scratchpad/flyin-section.png" });
  await browser.close();
})();
