import puppeteer from "puppeteer-core";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4013;

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

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text().slice(0, 200)}`);
});
page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message.slice(0, 200)}`));

await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0", timeout: 60000 });

const waitForText = async (text, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.some((b) => b.textContent && b.textContent.toUpperCase().includes(t.toUpperCase()));
    }, text);
    if (found) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
};

const clickText = async (text, ms = 1200) => {
  await waitForText(text);
  await page.evaluate((t) => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btn = btns.find((b) => b.textContent && b.textContent.toUpperCase().includes(t.toUpperCase()));
    if (btn) btn.click();
  }, text);
  await new Promise((r) => setTimeout(r, ms));
};

const waitForTextContent = async (text, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = await page.evaluate((t) => {
      const txt = document.body.innerText || "";
      return txt.toUpperCase().includes(t.toUpperCase());
    }, text);
    if (found) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const steps = [];
const step = (name) => steps.push(name);

// 1. BOOT
await waitForText("ENTER GARAGE", 30000);
step("boot: enter garage button visible");

// 2. GARAGE
await clickText("ENTER GARAGE", 3000);
const garageCarVisible = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll("img"));
  return imgs.some((i) => i.src.startsWith("data:image/png") && i.width > 100);
});
step(`garage: car visible=${garageCarVisible}`);
await page.screenshot({ path: "/tmp/vc-flow-1-garage.png" });

// 3. PAINT BOOTH
await clickText("PAINT BOOTH", 1500);
const editorLoaded = await waitForTextContent("DRAW · TEXT", 30000);
step(`paint-booth: editor loaded=${editorLoaded}`);
await wait(3000);
await page.screenshot({ path: "/tmp/vc-flow-2-editor.png" });

// make some edits: click Draw tool, draw a stroke on canvas, add shapes
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const draw = btns.find((b) => b.textContent && b.textContent.trim() === "Draw");
  if (draw) draw.click();
});
await wait(1200);
const drew = await page.evaluate(() => {
  const canvas = Array.from(document.querySelectorAll("canvas")).find((c) => c.width > 500);
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const mk = (type, x, y) => {
    const el = canvas;
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: r.left + x, clientY: r.top + y }));
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: r.left + x, clientY: r.top + y, pointerId: 1, pointerType: "mouse" }));
  };
  const drawPoints = (pts) => {
    for (let i = 0; i < pts.length; i++) {
      mk(i === 0 ? "pointerdown" : "pointermove", pts[i][0], pts[i][1]);
    }
    mk("pointerup", pts[pts.length - 1][0], pts[pts.length - 1][1]);
  };
  const pts = [];
  for (let i = 0; i < 50; i++) pts.push([rect.width * (0.2 + i * 0.012), rect.height * (0.3 + Math.sin(i * 0.3) * 0.1)]);
  drawPoints(pts);
  return true;
});
step(`editor: drew stroke=${drew}`);
await wait(800);

// click Save
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const save = btns.find((b) => b.textContent && b.textContent.trim().toLowerCase() === "save");
  if (save) save.click();
});
step("editor: save clicked");
await wait(1500);

// 4. REVEAL
const revealSeen = await waitForTextContent("APPLYING BODY GRAPHICS", 15000);
step(`reveal: applying text=${revealSeen}`);
await wait(3200);
await page.screenshot({ path: "/tmp/vc-flow-3-reveal.png" });

// 5. ANALYSIS
const analysisSeen = await waitForTextContent("BUILD ANALYSIS", 20000);
const statsSeen = await waitForTextContent("POLICE HEAT", 10000);
step(`analysis: profile=${analysisSeen} stats=${statsSeen}`);
await wait(2500);
const statValues = await page.evaluate(() => {
  const text = document.body.innerText;
  const m = text.match(/STYLE\s*(\d+)/);
  const h = text.match(/POLICE HEAT\s*(\d+)/);
  const s = text.match(/STREET REP\s*(\d+)/);
  return { style: m ? m[1] : null, heat: h ? h[1] : null, rep: s ? s[1] : null };
});
step(`analysis: style=${statValues.style} rep=${statValues.rep} heat=${statValues.heat}`);
await page.screenshot({ path: "/tmp/vc-flow-4-analysis.png" });

// 6. STREET RUN
await clickText("TAKE IT OUT", 3000);
const streetSeen = await waitForTextContent("OCEAN DISTRICT", 8000);
const speedSeen = await waitForTextContent("MPH", 6000);
step(`street: hud=${streetSeen} speed=${speedSeen}`);
await wait(2500);
await page.screenshot({ path: "/tmp/vc-flow-5-street.png" });

// 7. COMPLETE
const completeSeen = await waitForTextContent("CUSTOMIZE AGAIN", 25000);
const cardSeen = await waitForTextContent("BUILD #", 5000);
step(`complete: card=${completeSeen} build=${cardSeen}`);
await page.screenshot({ path: "/tmp/vc-flow-6-complete.png" });

// 8. CUSTOMIZE AGAIN (test 10: second editor run)
await clickText("CUSTOMIZE AGAIN", 2500);
const editor2 = await waitForTextContent("DRAW · TEXT", 30000);
step(`customize-again: editor reopened=${editor2}`);
await page.screenshot({ path: "/tmp/vc-flow-7-editor2.png" });

console.log(JSON.stringify({ steps, errors }, null, 2));
await browser.close();
server.kill();
process.exit(errors.length ? 1 : 0);