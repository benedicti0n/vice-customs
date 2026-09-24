import { chromium } from "playwright";
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { join } from "path";

const PORT = 4030;
const OUT = join(process.cwd(), "screenshots");

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
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

  const shot = async (name: string) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log(`saved screenshots/${name}.png`);
  };

  const waitText = async (text: string, timeout = 25000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const ok = await page.evaluate((t) => {
        const b = document.body.innerText || "";
        return b.toUpperCase().includes(t.toUpperCase());
      }, text);
      if (ok) return true;
      await page.waitForTimeout(250);
    }
    return false;
  };

  const clickText = async (text: string, ms = 1200) => {
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const ok = await page.evaluate((t) => {
        const btns = Array.from(document.querySelectorAll("button"));
        const b = btns.find((x) => x.textContent && x.textContent.toUpperCase().includes(t.toUpperCase()));
        if (b) { b.click(); return true; }
        return false;
      }, text);
      if (ok) break;
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(ms);
  };

  await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle", timeout: 60000 });

  // 1. BOOT — title screen
  await waitText("ENTER GARAGE");
  await page.waitForTimeout(1200);
  await shot("01-boot-title");

  // 2. GARAGE
  await clickText("ENTER GARAGE", 3200);
  await shot("02-garage");

  // 3. VEHICLE SELECT — SERAPH R
  await clickText("SELECT VEHICLE", 2000);
  await shot("03-vehicle-select-seraph-r");

  // 4. VEHICLE SELECT — TEMPEST VX
  await clickText("NEXT", 1000);
  await shot("04-vehicle-select-tempest-vx");

  // 5. VEHICLE SELECT — MARLIN 88
  await clickText("NEXT", 1000);
  await shot("05-vehicle-select-marlin-88");

  // 6. PAINT BOOTH — editor loaded (template)
  await clickText("SELECT", 500);
  const editorReady = await (async () => {
    const start = Date.now();
    while (Date.now() - start < 30000) {
      const ready = await page.evaluate(
        `(document.body.innerText || "").toUpperCase().includes("DRAW · TEXT") || Array.from(document.querySelectorAll("canvas")).some(function(c){ return c.width > 500; })`
      );
      if (ready) return true;
      await page.waitForTimeout(400);
    }
    return false;
  })();
  console.log("editor ready:", editorReady);
  await page.waitForTimeout(1200);
  await shot("06-paint-booth-editor");

  // 7. PAINT BOOTH — with a design applied
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const draw = btns.find((b) => b.textContent && b.textContent.trim() === "Draw");
    if (draw) draw.click();
  });
  await page.waitForTimeout(1200);
  await page.evaluate(`(() => {
    const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 500; });
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const fire = function (type, x, y) {
      canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: r.left + x, clientY: r.top + y, pointerId: 1, pointerType: "mouse" }));
    };
    const pts = [];
    for (let i = 0; i < 60; i++) pts.push([r.width * (0.15 + i * 0.012), r.height * (0.25 + Math.sin(i * 0.25) * 0.12)]);
    pts.push([r.width * 0.9, r.height * 0.75]);
    fire("pointerdown", pts[0][0], pts[0][1]);
    for (const p of pts) fire("pointermove", p[0], p[1]);
    fire("pointerup", pts[pts.length - 1][0], pts[pts.length - 1][1]);
  })()`);
  await page.waitForTimeout(800);
  await shot("07-paint-booth-design");

  // 8. SAVE → REVEAL applying
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const save = btns.find((b) => b.textContent && b.textContent.trim().toLowerCase() === "save");
    if (save) save.click();
  });
  await page.waitForTimeout(1000);
  await shot("08-reveal-applying");

  // 9. REVEAL — car revealed
  await page.waitForTimeout(2400);
  await shot("09-reveal-car");

  // 10. ANALYSIS
  await page.waitForTimeout(2600);
  await shot("10-analysis");

  // 11. STREET RUN
  await clickText("TAKE IT OUT", 3000);
  await shot("11-street-run");

  // 12. FINAL BUILD CARD
  await page.waitForTimeout(10500);
  await shot("12-final-build-card");

  console.log("--- errors ---");
  console.log(JSON.stringify(errors, null, 2));

  await browser.close();
  server.kill();
  process.exit(0);
}

void main();