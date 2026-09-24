import puppeteer from "puppeteer-core";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4020;

const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
await new Promise((r) => setTimeout(r, 5000));

const errors = [];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1600,900", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0", timeout: 60000 });

const waitForText = async (text, timeout = 25000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const ok = await page.evaluate((t) => {
      const b = document.body.innerText || "";
      return b.toUpperCase().includes(t.toUpperCase());
    }, text);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};

const clickText = async (text, ms = 1500) => {
  const start = Date.now();
  while (Date.now() - start < 20000) {
    const ok = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.toUpperCase().includes(t.toUpperCase()));
      if (b) { b.click(); return true; }
      return false;
    }, text);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await new Promise((r) => setTimeout(r, ms));
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await waitForText("ENTER GARAGE");
await page.screenshot({ path: "/tmp/audit-1-boot.png" });

await clickText("ENTER GARAGE", 2800);
await page.screenshot({ path: "/tmp/audit-2-garage.png" });

await clickText("SELECT VEHICLE", 2000);
await page.screenshot({ path: "/tmp/audit-3-select.png" });

await clickText("NEXT", 900);
await page.screenshot({ path: "/tmp/audit-4-select-tempest.png" });

await clickText("SELECT", 2200);
await wait(1500);
await page.screenshot({ path: "/tmp/audit-5-editor.png" });

await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const save = btns.find((b) => b.textContent && b.textContent.trim().toLowerCase() === "save");
  if (save) save.click();
});
await wait(1000);
await page.screenshot({ path: "/tmp/audit-6-reveal-1s.png" });
await wait(2600);
await page.screenshot({ path: "/tmp/audit-7-reveal-3.5s.png" });
await wait(2600);
await page.screenshot({ path: "/tmp/audit-8-analysis.png" });
await wait(2000);
await page.screenshot({ path: "/tmp/audit-9-analysis-late.png" });

await clickText("TAKE IT OUT", 2800);
await page.screenshot({ path: "/tmp/audit-10-street.png" });
await wait(3500);
await page.screenshot({ path: "/tmp/audit-11-street-mid.png" });
await wait(9000);
await page.screenshot({ path: "/tmp/audit-12-complete.png" });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
server.kill();
process.exit(0);