/**
 * E2E tests for file upload and analysis using Puppeteer.
 *
 * Launches the Vite dev server, logs in with dev credentials,
 * and verifies that sample data, Excel upload, and CSV upload
 * all produce a visible analysis dashboard.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { spawn, type ChildProcess } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

const VITE_PORT = 54173; // use a non-standard port to avoid conflicts
const API_PORT = 3001; // Express API server port (must match vite.config proxy target)
const BASE_URL = `http://localhost:${VITE_PORT}`;
const CHROMIUM_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

let browser: Browser;
let viteServer: ChildProcess;
let apiServer: ChildProcess;

/** Wait until a server responds with 200 */
async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

beforeAll(async () => {
  const projectRoot = path.resolve(__dirname, "..");

  // Start the Express API server first
  apiServer = spawn("npx", ["tsx", "server/index.ts"], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(API_PORT) },
    stdio: "pipe",
  });
  apiServer.stderr?.on("data", (d: Buffer) =>
    process.stderr.write(`[api] ${d}`)
  );

  // Start the Vite dev server (it proxies /api to API_PORT)
  viteServer = spawn(
    "npx",
    ["vite", "--host", "--port", String(VITE_PORT), "--strictPort"],
    {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: "pipe",
    }
  );
  viteServer.stderr?.on("data", (d: Buffer) =>
    process.stderr.write(`[vite] ${d}`)
  );

  // Wait for both servers
  await Promise.all([
    waitForServer(`http://localhost:${API_PORT}/api/auth/login`, 20_000).catch(
      () => {
        // API server doesn't respond to GET /api/auth/login with 200, so just wait
      }
    ),
    waitForServer(BASE_URL, 30_000),
  ]);

  // Extra wait for API server to be fully ready
  await new Promise(r => setTimeout(r, 2000));

  browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}, 60_000);

afterAll(async () => {
  await browser?.close();
  if (viteServer) {
    viteServer.kill("SIGTERM");
  }
  if (apiServer) {
    apiServer.kill("SIGTERM");
  }
  await new Promise(r => setTimeout(r, 1000));
});

/** Helper: create a fresh page, log in, and navigate to home */
async function loginAndGoHome(): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });

  // Fill in the login form (no IDs, so use selectors)
  const inputs = await page.$$("input");
  // First input = username, second = password
  await inputs[0].type("takoyaki");
  await inputs[1].type("takoyaki");

  // Submit
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn!.click();

  // Wait for navigation to home page
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  return page;
}

/** Helper: wait for the analysis dashboard to appear */
async function waitForDashboard(page: Page, timeoutMs = 30_000) {
  // The dashboard shows "Analysis Report" or "分析レポート" text
  await page.waitForFunction(
    () => {
      const body = document.body.innerText;
      return body.includes("Analysis Report") || body.includes("分析レポート");
    },
    { timeout: timeoutMs }
  );
}

// ============================================================
// Tests
// ============================================================

describe("E2E: Upload & Analysis", () => {
  it("should log in successfully", async () => {
    const page = await loginAndGoHome();
    const url = page.url();
    expect(url).toContain("/"); // should not be /login
    expect(url).not.toMatch(/\/login$/);
    await page.close();
  }, 30_000);

  it("should load analysis from sample data button", async () => {
    const page = await loginAndGoHome();

    // Click the sample data button
    const sampleBtn = await page.waitForSelector("#btn-sample-data");
    await sampleBtn!.click();

    // Wait for dashboard to appear
    await waitForDashboard(page);

    // Verify key dashboard elements are visible
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(
      bodyText.includes("trades analyzed") ||
        bodyText.includes("trades analyzed")
    ).toBe(true);

    // Verify the strategy score gauge SVG is rendered
    const svgCount = await page.$$eval("svg", els => els.length);
    expect(svgCount).toBeGreaterThan(0);

    await page.close();
  }, 30_000);

  it("should upload and analyze MT5 Excel file", async () => {
    const page = await loginAndGoHome();

    const excelPath = path.resolve(
      __dirname,
      "..",
      "ReportHistory-10009822126.xlsx"
    );
    expect(fs.existsSync(excelPath)).toBe(true);

    // Get the hidden file input and upload the Excel file
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await fileInput!.uploadFile(excelPath);

    // Wait for the file info panel to appear (shows file name)
    await page.waitForFunction(
      () => document.body.innerText.includes("ReportHistory"),
      { timeout: 10_000 }
    );

    // Click the analyze button (the button in the selected-file panel)
    // It's the button with the emerald/green background that says "分析する" or "Analyze"
    const analyzeBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.find(
        b =>
          b.textContent?.includes("分析") || b.textContent?.includes("Analyze")
      );
    });
    expect(analyzeBtn).toBeTruthy();
    await (
      analyzeBtn as unknown as puppeteer.ElementHandle<HTMLButtonElement>
    ).click();

    // Wait for dashboard
    await waitForDashboard(page, 30_000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(
      bodyText.includes("trades analyzed") ||
        bodyText.includes("trades analyzed")
    ).toBe(true);

    // Should have parsed multiple trades
    const tradeCountMatch = bodyText.match(/(\d+)\s*trades analyzed/);
    if (tradeCountMatch) {
      expect(parseInt(tradeCountMatch[1])).toBeGreaterThan(5);
    }

    await page.close();
  }, 60_000);

  it("should upload and analyze MT4 CSV data", async () => {
    const page = await loginAndGoHome();

    // Create a temporary MT4-style CSV file
    const mt4CSV = [
      "Ticket,Open Time,Close Time,Type,Size,Item,Open Price,Close Price,Commission,Swap,Profit",
      "12345,2024.01.15 10:30:00,2024.01.15 14:30:00,buy,0.10,EURUSD,1.08500,1.08750,0.00,0.00,25.00",
      "12346,2024.01.16 09:00:00,2024.01.16 12:00:00,sell,0.20,USDJPY,148.500,148.200,0.00,0.00,40.13",
      "12347,2024.01.17 11:00:00,2024.01.17 16:30:00,buy,0.15,GBPUSD,1.27000,1.26800,-0.50,0.00,-30.00",
      "12348,2024.01.18 08:30:00,2024.01.18 11:30:00,sell,0.10,EURUSD,1.08900,1.08700,0.00,-0.12,20.00",
      "12349,2024.01.19 13:00:00,2024.01.19 17:00:00,buy,0.25,USDJPY,149.000,148.600,0.00,0.00,-100.00",
      "12350,2024.01.22 10:00:00,2024.01.22 15:00:00,sell,0.10,GBPUSD,1.27200,1.27000,0.00,0.00,30.00",
      "12351,2024.01.23 09:30:00,2024.01.23 14:00:00,buy,0.20,EURUSD,1.08600,1.09000,0.00,0.00,80.00",
      "12352,2024.01.24 11:00:00,2024.01.24 16:00:00,sell,0.15,USDJPY,148.800,149.100,-0.30,0.00,-45.00",
      "12353,2024.01.25 08:00:00,2024.01.25 12:30:00,buy,0.10,GBPUSD,1.26900,1.27100,0.00,0.00,20.00",
      "12354,2024.01.26 10:30:00,2024.01.26 15:00:00,sell,0.30,EURUSD,1.09100,1.08800,0.00,0.00,90.00",
    ].join("\n");

    const tmpPath = path.resolve(__dirname, "..", "tmp-mt4-test.csv");
    fs.writeFileSync(tmpPath, mt4CSV, "utf-8");

    try {
      const fileInput = await page.$('input[type="file"]');
      expect(fileInput).not.toBeNull();
      await fileInput!.uploadFile(tmpPath);

      // Wait for file to be selected
      await page.waitForFunction(
        () => document.body.innerText.includes("tmp-mt4-test.csv"),
        { timeout: 10_000 }
      );

      // Click analyze button
      const analyzeBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.find(
          b =>
            b.textContent?.includes("分析") ||
            b.textContent?.includes("Analyze")
        );
      });
      await (
        analyzeBtn as unknown as puppeteer.ElementHandle<HTMLButtonElement>
      ).click();

      // Wait for dashboard
      await waitForDashboard(page, 30_000);

      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(
        bodyText.includes("trades analyzed") ||
          bodyText.includes("trades analyzed")
      ).toBe(true);

      // Should show 10 trades
      const tradeCountMatch = bodyText.match(/(\d+)\s*trades analyzed/);
      if (tradeCountMatch) {
        expect(parseInt(tradeCountMatch[1])).toBe(10);
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }

    await page.close();
  }, 60_000);

  it("should reject unsupported file types", async () => {
    const page = await loginAndGoHome();

    // Create a temp .txt file
    const tmpPath = path.resolve(__dirname, "..", "tmp-bad-file.txt");
    fs.writeFileSync(tmpPath, "this is not a valid trade file", "utf-8");

    try {
      const fileInput = await page.$('input[type="file"]');
      // Note: the input has accept=".csv,.xlsx,.xls,.xml,.htm,.html"
      // but we can still set the file programmatically
      await fileInput!.uploadFile(tmpPath);

      // Wait a moment for the error to appear
      await new Promise(r => setTimeout(r, 1500));

      // The app should show an error message (unsupported file type)
      // The file input's accept attribute should prevent selection in real browsers,
      // but in programmatic upload it may or may not trigger the error handler.
      // This test verifies the UI doesn't crash.
      const bodyText = await page.evaluate(() => document.body.innerText);
      // The file should NOT appear in the selected file panel (no analyze button)
      // or an error should be shown
      const hasAnalyzeBtn = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.some(
          b =>
            b.textContent?.includes("分析する") ||
            b.textContent?.includes("Analyze")
        );
      });
      // Either the file was rejected (no analyze button) or an error is shown
      expect(
        !hasAnalyzeBtn ||
          bodyText.includes("サポートされていない") ||
          bodyText.includes("unsupported") ||
          bodyText.includes("Unsupported")
      ).toBe(true);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }

    await page.close();
  }, 30_000);
});
