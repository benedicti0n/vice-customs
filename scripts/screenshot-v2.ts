import { chromium } from "playwright";
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { join } from "path";

const PORT = 4050;
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
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 220)); });
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 220)));

  const shot = async (name: string) => {
    await page.waitForTimeout(400);
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
  const canvasDraw = async () => {
    await page.evaluate(`(() => {
      const canvas = Array.from(document.querySelectorAll("canvas")).find(function (c) { return c.width > 800; });
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const fire = function (type, x, y) {
        canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse" }));
      };
      const pts = [];
      for (let i = 0; i < 50; i++) pts.push([r.left + r.width * (0.35 + i * 0.006), r.top + r.height * (0.55 + Math.sin(i * 0.22) * 0.08)]);
      fire("pointerdown", pts[0][0], pts[0][1]);
      for (const p of pts) fire("pointermove", p[0], p[1]);
      fire("pointerup", pts[pts.length - 1][0], pts[pts.length - 1][1]);
    })()`);
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

  await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle", timeout: 60000 });

  // 1 BOOT
  await waitText("ENTER GARAGE");
  await page.waitForTimeout(1500);
  await shot("v2-01-boot.png");

  // 2 GARAGE (3D)
  await clickText("ENTER GARAGE", 5000);
  await shot("v2-02-garage-3d.png");

  // 3 SELECTOR
  await clickText("SELECT VEHICLE", 3000);
  await shot("v2-03-selector.png");
  await clickText("NEXT", 1200);
  await clickText("NEXT", 1200);
  await shot("v2-04-selector-marlin.png");
  await clickText("SELECT", 3000);

  // 4 PAINT BOOTH — draw
  await page.keyboard.press("2"); // paint tool
  await page.waitForTimeout(800);
  await canvasDraw();
  await shot("v2-05-booth-painted.png");

  // 5 decal
  await page.keyboard.press("3"); // decal tool
  await page.waitForTimeout(500);
  await canvasClick(0.5, 0.52);
  await canvasClick(0.62, 0.5);
  await shot("v2-06-booth-decals.png");

  // 6 APPLY → reveal
  await clickText("APPLY LIVERY", 500);
  await page.waitForTimeout(1800);
  await shot("v2-07-reveal-applying.png");
  await page.waitForTimeout(2200);
  await shot("v2-08-reveal-car.png");

  // 7 analysis
  await waitText("BUILD ANALYSIS", 15000);
  await page.waitForTimeout(2600);
  await shot("v2-09-analysis.png");

  // 8 street run — drive
  await clickText("TAKE IT OUT", 4000);
  await page.keyboard.down("w");
  await page.waitForTimeout(1500);
  await page.keyboard.up("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(500);
  await page.keyboard.up("a");
  await shot("v2-10-street-run.png");

  // 9 card
  await page.waitForTimeout(45000 - 5000);
  await waitText("CUSTOMIZE AGAIN", 20000);
  await page.waitForTimeout(1500);
  await shot("v2-11-build-card.png");

  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
  server.kill();
  process.exit(0);
}

void main();