import { chromium } from "playwright";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PORT = 4060;
const OUT = join(process.cwd(), "screenshots", "v2.5");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  await new Promise((r) => setTimeout(r, 5000));

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--window-size=1600,900", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 220)); });
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 220)));

  const shot = async (name: string, waitMs = 400) => {
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: join(OUT, name) });
    console.log("saved", name);
  };
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
  const canvasDraw = async (y0 = 0.58, x0 = 0.4, n = 46, amp = 0.07) => {
    await page.evaluate(
      `(() => {
        const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 800; });
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const fire = function (type, x, y) {
          canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse" }));
        };
        const pts = [];
        for (let i = 0; i < ${n}; i++) pts.push([r.left + r.width * (${x0} + i * 0.007), r.top + r.height * (${y0} + Math.sin(i * 0.22) * ${amp})]);
        fire("pointerdown", pts[0][0], pts[0][1]);
        for (const p of pts) fire("pointermove", p[0], p[1]);
        fire("pointerup", pts[pts.length - 1][0], pts[pts.length - 1][1]);
      })()`
    );
    await page.waitForTimeout(600);
  };
  const canvasClick = async (xr: number, yr: number) => {
    await page.evaluate(
      `(() => {
        const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 800; });
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const fire = function (type, x, y) {
          canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 2, pointerType: "mouse" }));
        };
        fire("pointerdown", r.left + r.width * ${xr}, r.top + r.height * ${yr});
        fire("pointerup", r.left + r.width * ${xr}, r.top + r.height * ${yr});
      })()`
    );
    await page.waitForTimeout(500);
  };

  await page.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded", timeout: 60000 });

  // 1 BOOT — title
  await waitText("ENTER GARAGE");
  await page.waitForTimeout(1600);
  await shot("01-boot-title.png");

  // 2 GARAGE — 3D showroom
  await clickText("ENTER GARAGE", 5200);
  await shot("02-garage-3d.png");

  // 3–5 SELECTOR — three platforms
  await clickText("SELECT VEHICLE", 3000);
  await shot("03-selector-seraph-r.png");
  await clickText("NEXT", 1400);
  await shot("04-selector-tempest-vx.png");
  await clickText("NEXT", 1400);
  await shot("05-selector-marlin-88.png");

  // 6 BOOTH — editor ready with paint tool + swatches
  await clickText("SELECT", 4200);
  // pull the camera back a touch so the whole car is framed for editing
  await page.mouse.move(800, 500);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(900);
  await page.keyboard.press("2");
  await page.waitForTimeout(900);
  await page.evaluate(`(() => {
    const input = document.querySelector('input[type="range"]');
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, "40");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await page.waitForTimeout(600);
  await shot("06-booth-paint-tool.png");

  // 7 BOOTH — bold painted strokes on the door panel
  await canvasDraw(0.66, 0.36, 55, 0.035);
  await canvasDraw(0.72, 0.4, 45, 0.03);
  await canvasDraw(0.61, 0.46, 35, 0.03);
  await shot("07-booth-painted.png");

  // 8 BOOTH — decal placement on the door (cyan VICE graphic + chevron)
  await page.keyboard.press("3");
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const tint = document.querySelector('button[aria-label="tint #39d9e6"]') as HTMLButtonElement | null;
    if (tint) tint.click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const preset = Array.from(document.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "VICE");
    if (preset) preset.click();
  });
  await page.waitForTimeout(300);
  await canvasClick(0.5, 0.64);
  await page.keyboard.press("3");
  await page.waitForTimeout(400);
  await canvasClick(0.62, 0.61);
  await page.keyboard.press("3");
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const preset = Array.from(document.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "CHEVRON");
    if (preset) preset.click();
  });
  await page.waitForTimeout(300);
  await canvasClick(0.72, 0.58);
  await shot("08-booth-decals.png");
  const decalCount = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("vc-build-v2") || "{}").decals?.length ?? 0; } catch { return -1; }
  });
  console.log("decals placed:", decalCount);

  // 9 BOOTH — selected decal panel + tint/material controls
  await page.keyboard.press("4");
  await page.waitForTimeout(700);
  await canvasClick(0.58, 0.68);
  await shot("09-booth-select-panel.png");

  // 10 APPLY → reveal sequence
  await clickText("APPLY LIVERY", 600);
  await page.waitForTimeout(1700);
  await shot("10-reveal-applying.png");

  // 11 REVEAL — car
  await page.waitForTimeout(2400);
  await shot("11-reveal-car.png");

  // 12 ANALYSIS — full telemetry
  await waitText("BUILD ANALYSIS", 15000);
  await page.waitForTimeout(3000);
  await shot("12-analysis.png");

  // 13 STREET RUN — driving
  await clickText("TAKE IT OUT", 4000);
  await page.keyboard.down("w");
  await page.waitForTimeout(1800);
  await page.keyboard.down("a");
  await page.waitForTimeout(700);
  await page.keyboard.up("a");
  await page.keyboard.up("w");
  await shot("13-street-run.png");

  // 14 STREET RUN — high-speed boost moment
  await page.keyboard.down("w");
  await page.keyboard.down("Shift");
  await page.waitForTimeout(2600);
  await page.keyboard.up("Shift");
  await page.keyboard.up("w");
  await shot("14-street-run-boost.png");

  // 15 BUILD CARD — 3D turntable
  await page.waitForTimeout(43000);
  await waitText("CUSTOMIZE AGAIN", 20000);
  await page.waitForTimeout(2000);
  await shot("15-build-card.png");

  writeFileSync(
    join(OUT, "README.md"),
    `# VICE//CUSTOMS V2 — Review Screenshots

Captured from the production build (1600×900, headless Chrome) — full player journey.

| File | Scene | What it shows |
|------|-------|---------------|
| 01-boot-title.png | Boot | Title screen, ENTER GARAGE CTA |
| 02-garage-3d.png | Garage | Real-time 3D SERAPH R in Bay 03 |
| 03-selector-seraph-r.png | Vehicle Select | SERAPH R + stats panel |
| 04-selector-tempest-vx.png | Vehicle Select | TEMPEST VX (blue) |
| 05-selector-marlin-88.png | Vehicle Select | MARLIN 88 (gold) |
| 06-booth-paint-tool.png | Paint Booth | 3D car, paint tool + ink colors + body paint swatches |
| 07-booth-painted.png | Paint Booth | Two freehand strokes painted live on the body |
| 08-booth-decals.png | Paint Booth | Decal placement (chevrons on the door) |
| 09-booth-select-panel.png | Paint Booth | Selected-decal controls (rotate/scale/material/tint hints) |
| 10-reveal-applying.png | Reveal | APPLYING BODY GRAPHICS status sequence |
| 11-reveal-car.png | Reveal | Customized car revealed (matte→gloss sweep) |
| 12-analysis.png | Analysis | Telemetry: BUILD CLASS, 4 stats, diagnostics, TAKE IT OUT |
| 13-street-run.png | Street Run | 3D night drive: car, road, city, speed HUD |
| 14-street-run-boost.png | Street Run | Boost moment with speed |
| 15-build-card.png | Final Card | 3D turntable card, classification, stats, actions |

Artwork in the later shots is the actual painted strokes + decals from shots 07–09 — the same serialized build drives reveal → analysis → street → card.
`,
    "utf8"
  );
  console.log("wrote README.md");

  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
  server.kill();
  process.exit(0);
}

void main();