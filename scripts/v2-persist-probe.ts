import { chromium } from "playwright";
import { spawn } from "child_process";

const PORT = 4054;
async function main() {
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  await new Promise((r) => setTimeout(r, 5000));
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox", "--window-size=1600,900", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors: string[] = [];
  page.on("console", (m) => { if (m.text().includes("VC-SETSCENE")) errors.push("MARKER:" + m.text().slice(0, 80)); else if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
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
  await clickText("ENTER GARAGE", 4000);
  await clickText("PAINT BOOTH", 2500);

  // paint a stroke
  await page.keyboard.press("2");
  await page.waitForTimeout(600);
  await page.evaluate(`(() => {
    const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 800; });
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const fire = function (type, x, y) { canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse" })); };
    const pts = [];
    for (let i = 0; i < 40; i++) pts.push([r.left + r.width * (0.5 + i * 0.006), r.top + r.height * (0.65 + Math.sin(i * 0.2) * 0.04)]);
    fire("pointerdown", pts[0][0], pts[0][1]);
    for (const p of pts) fire("pointermove", p[0], p[1]);
    fire("pointerup", pts[pts.length - 1][0], pts[pts.length - 1][1]);
  })()`);
  await page.waitForTimeout(600);

  const dbg = await page.evaluate(() => (globalThis as unknown as { __vcDebug?: unknown }).__vcDebug ?? null);
  console.log("debug:", JSON.stringify(dbg));
  const stored = await page.evaluate(() => {
    try { const raw = localStorage.getItem("vc-build-v2"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  console.log("v2 build persisted:", Boolean(stored), "strokes:", stored?.livery?.strokes?.length ?? 0);

  // reload → build restored
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitText("ENTER GARAGE");
  await clickText("ENTER GARAGE", 4500);
  const liveryShown = await page.evaluate(() => {
    const b = document.body.innerText || "";
    return b.toUpperCase().includes("PAINT BOOTH");
  });
  console.log("reload: garage OK, livery restored (garage shows PAINT BOOTH):", liveryShown);

  // customize-again path: go through booth → apply → reveal → analysis → street → card → customize again
  await clickText("PAINT BOOTH", 2500);
  await clickText("APPLY LIVERY", 500);
  await waitText("CUSTOM BUILD COMPLETE", 12000);
  await waitText("BUILD ANALYSIS", 12000);
  await clickText("TAKE IT OUT", 2500);
  await page.waitForTimeout(48000);
  await waitText("CUSTOMIZE AGAIN", 30000);
  const before = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => (b.textContent || "").trim().slice(0, 24)));
  console.log("card buttons:", JSON.stringify(before));
  await page.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.textContent && x.textContent.toUpperCase().includes("CUSTOMIZE AGAIN"));
    if (b) { b.click(); return "clicked"; }
    return "not-found";
  })()`);
  await page.waitForTimeout(3000);
  const afterClick = (await page.evaluate(() => document.body.innerText || "")).slice(0, 120).replace(/\n/g, " | ");
  console.log("after click:", afterClick);
  const reducerAfter = await page.evaluate(() => (globalThis as unknown as { __reducerLog?: string[] }).__reducerLog ?? []);
  console.log("reducer after click:", JSON.stringify(reducerAfter.slice(-8)));
  const log = await page.evaluate(() => (globalThis as unknown as { __reducerLog?: string[] }).__reducerLog ?? []);
  const setLog = await page.evaluate(() => (globalThis as unknown as { __setSceneLog?: string[] }).__setSceneLog ?? []);
  const flag = await page.evaluate(() => (window as unknown as { __vcTest?: number }).__vcTest ?? 0);
  console.log("reducer log tail:", JSON.stringify(log.slice(-8)));
  console.log("setScene log:", JSON.stringify(setLog.slice(-8)));
  console.log("flag:", flag);
  const editor2 = await waitText("APPLY LIVERY", 8000);
  console.log("customize again → booth reopened:", editor2);

  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
  server.kill();
  process.exit(0);
}
void main();
