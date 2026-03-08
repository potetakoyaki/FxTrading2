import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../docs/images');
const TEST_FILE = path.resolve(__dirname, '../ReportHistory-10009822126.xlsx');
const APP_URL = 'http://localhost:3000';
const LOGIN_ID = 'takoyaki';
const LOGIN_PW = 'takoyaki';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickButtonByText(page, text) {
  const clicked = await page.evaluate(target => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const found = buttons.find(btn =>
      (btn.textContent || '').replace(/\s+/g, ' ').includes(target)
    );
    if (!found) return false;
    found.click();
    return true;
  }, text);
  return clicked;
}

async function scrollToRatio(page, ratio) {
  const scrollY = await page.evaluate(targetRatio => {
    const doc = document.documentElement;
    const body = document.body;
    const fullHeight = Math.max(
      doc.scrollHeight,
      body ? body.scrollHeight : 0,
      doc.offsetHeight,
      body ? body.offsetHeight : 0
    );
    const viewport = window.innerHeight;
    const maxScroll = Math.max(0, fullHeight - viewport);
    const y = Math.round(maxScroll * targetRatio);
    window.scrollTo({ top: y, behavior: 'instant' });
    return y;
  }, ratio);
  await sleep(1400);
  return scrollY;
}

async function waitForDashboard(page, timeout = 60000) {
  await page.waitForFunction(() => {
    const hasDashTitle = Array.from(document.querySelectorAll('h2')).some(h =>
      /分析レポート|Analysis Report/i.test(h.textContent || '')
    );
    const hasTradesLabel = /trades analyzed|トレード分析済み/i.test(
      document.body.textContent || ''
    );
    return hasDashTitle || hasTradesLabel;
  }, { timeout });
}

async function takeScreenshots() {
  console.log('Starting Puppeteer...');
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEST_FILE)) {
    throw new Error(`Test file not found: ${TEST_FILE}`);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 1800 }
  });

  const page = await browser.newPage();

  try {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Try normal login first
    const hasLoginForm = await page.$('input[type="password"]');
    if (hasLoginForm) {
      const textInputs = await page.$$('input[type="text"], input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      if (textInputs[0] && passwordInput) {
        await textInputs[0].click({ clickCount: 3 });
        await textInputs[0].type(LOGIN_ID, { delay: 30 });
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(LOGIN_PW, { delay: 30 });
        await clickButtonByText(page, 'ログイン');
        await sleep(1500);
      }
    }

    // Fallback: local auth seed for local dev without buyer API
    const onLoginPage = await page.evaluate(() =>
      window.location.pathname.includes('/login')
    );
    if (onLoginPage) {
      console.log('Login API unavailable. Seeding local auth for screenshot capture...');
      await page.evaluate(user => {
        localStorage.setItem(
          'fx-doctor-auth',
          JSON.stringify({ username: user, isAdmin: false })
        );
      }, LOGIN_ID);
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForFunction(
      () =>
        !!document.querySelector('input[accept*=".csv"]') ||
        !!document.querySelector('#btn-sample-data') ||
        (document.body.textContent || '').includes('アップロード'),
      { timeout: 20000 }
    );

    // 1. トップ画面 (アップロードエリア)
    console.log('Taking screenshot: 1_top.png');
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1500);
    await page.screenshot({ path: path.join(IMAGES_DIR, '1_top.png') });

    console.log(`Uploading test file: ${TEST_FILE}`);
    const fileInput =
      (await page.$('input[accept*=".csv"]')) ||
      (await page.$('input[type="file"]'));
    if (!fileInput) {
      const currentUrl = page.url();
      await page.screenshot({ path: path.join(IMAGES_DIR, 'debug_no_file_input.png') });
      throw new Error(`File input not found on page: ${currentUrl}`);
    }
    await fileInput.uploadFile(TEST_FILE);
    await sleep(1200);

    const clickedAnalyze = await clickButtonByText(page, '分析する');
    if (!clickedAnalyze) {
      throw new Error('Analyze button not found.');
    }

    console.log('Waiting for analysis to complete...');
    try {
      await waitForDashboard(page, 60000);
    } catch {
      await page.screenshot({ path: path.join(IMAGES_DIR, 'debug_analysis_timeout.png') });
      throw new Error('Analysis did not reach dashboard view within timeout.');
    }
    await sleep(2200);

    // 2. 戦略スコアとKPI
    console.log('Taking screenshot: 2_score_kpi.png');
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);
    await page.screenshot({ path: path.join(IMAGES_DIR, '2_score_kpi.png') });

    // 3. リスク診断と弱点ランキング
    console.log('Taking screenshot: 3_risk_weakness.png');
    const y3 = await scrollToRatio(page, 0.35);
    console.log(`Scrolled to Y=${y3} for 3_risk_weakness.png`);
    await page.screenshot({ path: path.join(IMAGES_DIR, '3_risk_weakness.png') });

    // 4. 改善提案
    console.log('Taking screenshot: 4_proposals.png');
    const y4 = await scrollToRatio(page, 0.52);
    console.log(`Scrolled to Y=${y4} for 4_proposals.png`);
    await page.screenshot({ path: path.join(IMAGES_DIR, '4_proposals.png') });

    // 5. 詳細分析パネル群
    console.log('Taking screenshot: 5_advanced.png');
    const y5 = await scrollToRatio(page, 0.7);
    console.log(`Scrolled to Y=${y5} for 5_advanced.png`);
    await page.screenshot({ path: path.join(IMAGES_DIR, '5_advanced.png') });

    // 6. モンテカルロシミュレーション
    console.log('Taking screenshot: 6_monte_carlo.png');
    const y6 = await scrollToRatio(page, 0.86);
    console.log(`Scrolled to Y=${y6} for 6_monte_carlo.png`);
    await page.screenshot({ path: path.join(IMAGES_DIR, '6_monte_carlo.png') });

    console.log('All screenshots captured successfully!');
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
