import { chromium } from "playwright";
import { spawn } from "child_process";

const PORT = 4070;
async function main() {
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  await new Promise((r) => setTimeout(r, 5000));
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox", "--window-size=1600,900", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 200)); });
  const waitText = async (t: string, timeout = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const ok = await page.evaluate((x) => (document.body.innerText || "").toUpperCase().includes(x.toUpperCase()), t);
      if (ok) return true;
      await page.waitForTimeout(300);
    }
    return false;
  };
  const clickText = async (t: string, ms = 1500) => {
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const ok = await page.evaluate((x) => {
        const b = Array.from(document.querySelectorAll("button")).find((bb) => bb.textContent && bb.textContent.toUpperCase().includes(x.toUpperCase()));
        if (b) { b.click(); return true; }
        return false;
      }, t);
      if (ok) break;
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(ms);
  };
  await page.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitText("ENTER GARAGE");
  await clickText("ENTER GARAGE", 4500);
  await clickText("PAINT BOOTH", 4500);
  await page.keyboard.press("3");
  await page.waitForTimeout(800);
  for (const [xr, yr] of [[0.5, 0.64], [0.62, 0.6], [0.7, 0.56], [0.44, 0.7]]) {
    await page.evaluate(
      `(() => {
        const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 800; });
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const fire = function (type, x, y) { canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 3, pointerType: "mouse" })); };
        fire("pointerdown", r.left + r.width * ${xr}, r.top + r.height * ${yr});
        fire("pointerup", r.left + r.width * ${xr}, r.top + r.height * ${yr});
      })()`
    );
    await page.waitForTimeout(400);
  }
  const dbg = await page.evaluate(() => (globalThis as unknown as { __d?: string[] }).__d ?? []);
  const dbg3 = await page.evaluate(() => (globalThis as unknown as { __d3?: number[] }).__d3 ?? []);
  const decalCount = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("vc-build-v2") || "{}").decals?.length ?? 0; } catch { return -1; }
  });
  console.log("pick hits:", JSON.stringify(dbg));
  console.log("placed counts:", JSON.stringify(dbg3));
  console.log("decals:", decalCount);
  await browser.close();
  server.kill();
  process.exit(0);
}
void main();
