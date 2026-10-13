import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.UI_TEST_BASE_URL || 'http://127.0.0.1:5173';
const SCREENSHOT_DIR = path.resolve('test-results/screenshots');
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const screenshots = [];
const checks = [];
const apiCalls = [];
const scheduledPosts = [];
const supportTickets = [];
let nextId = 1;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function record(name, passed, detail = '') {
  checks.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

function ok(data) {
  return { success: true, data };
}

async function main() {
  console.log('MODE: MOCKED UI ONLY. Every /api request is intercepted in the browser; no backend or database is started.');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  await page.setRequestInterception(true);
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), reason: request.failure()?.errorText });
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) {
      request.continue();
      return;
    }

    const method = request.method();
    const pathname = url.pathname.replace(/^\/api/, '');
    const body = request.postData() ? (() => {
      try { return JSON.parse(request.postData()); } catch { return {}; }
    })() : {};
    apiCalls.push({ method, pathname, body });
    let data = [];

    if (pathname === '/auth/me') {
      data = {
        id: 1, name: 'Kiểm thử giao diện', email: 'ui-test@example.invalid', role: 'user', status: 'active',
        businessProfile: { id: 10, businessName: 'Quán Cà phê', usp: 'Cà phê rang mới', brandVoice: 'Thân thiện' },
      };
    } else if (pathname === '/auth/login' || pathname === '/auth/register') {
      data = {
        user: { id: 1, name: 'Kiểm thử giao diện', email: body.email || 'ui-test@example.invalid', role: 'user', status: 'active' },
        token: 'ui-mock-token',
      };
    } else if (pathname === '/marketing-plans') {
      data = [{ id: 101, goal: 'Kế hoạch mẫu kiểm thử', campaignType: 'Nhận diện', status: 'saved', createdAt: new Date().toISOString() }];
    } else if (pathname === '/dashboard/monthly-spend') {
      data = { monthYear: 'Tháng này', totalMonthlySpend: 0, monthlyBudgetGoal: 50000000, budgetUtilization: 0, breakdown: { adsSpend: 0, otherSpend: 0 } };
    } else if (pathname === '/scheduled-posts') {
      if (method === 'GET') data = scheduledPosts;
      if (method === 'POST') {
        const created = { id: nextId++, ...body, createdAt: new Date().toISOString() };
        scheduledPosts.unshift(created);
        data = created;
      }
    } else if (/^\/scheduled-posts\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').at(-1));
      const index = scheduledPosts.findIndex((post) => post.id === id);
      if (method === 'PATCH' && index >= 0) {
        scheduledPosts[index] = { ...scheduledPosts[index], ...body };
        data = scheduledPosts[index];
      } else if (method === 'DELETE') {
        if (index >= 0) scheduledPosts.splice(index, 1);
        data = { deleted: true };
      }
    } else if (pathname === '/support/tickets') {
      if (method === 'GET') data = supportTickets;
      if (method === 'POST') {
        const created = { id: nextId++, ticketNumber: `TK-${nextId}`, status: 'open', ...body };
        supportTickets.unshift(created);
        data = created;
      }
    } else if (pathname.endsWith('/generate-post')) {
      data = { content: 'Nội dung bài viết mẫu để kiểm thử thao tác lưu bản nháp.' };
    } else if (pathname.endsWith('/generate-image-prompt')) {
      data = { imagePrompt: 'Studio product photography, clean background' };
    } else if (pathname.endsWith('/generate-image')) {
      data = { url: 'https://example.invalid/mock-image.png' };
    } else if (pathname.endsWith('/trends')) {
      data = [];
    } else if (pathname.startsWith('/marketing-plans/')) {
      data = { id: 101, goal: 'Kế hoạch mẫu kiểm thử', status: 'saved', contentIdeas: [], videoScripts: [], checklist: [], playbook: [], seoKeywords: [] };
    } else if (pathname.startsWith('/media')) {
      data = [];
    } else if (pathname === '/admin/users') {
      data = [];
    }

    request.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ok(data)),
    });
  });

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    record('Login page rendered', (await page.$$('input')).length >= 2);
    const registerLink = await page.$('a[href="/register"]');
    if (registerLink) {
      await registerLink.click();
      await sleep(250);
    }
    record('Registration navigation', page.url().endsWith('/register'));

    await page.evaluate(() => localStorage.setItem('pocket-agencom-auth', JSON.stringify({
      state: {
        user: { id: 1, name: 'Kiểm thử giao diện', email: 'ui-test@example.invalid', role: 'user', status: 'active', businessProfile: { id: 10, businessName: 'Quán Cà phê' } },
        token: 'ui-mock-token',
        isAuthenticated: true,
      },
      version: 0,
    })));
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('main h1', { timeout: 10000 });
    record('Dashboard rendered', (await page.$$('main h1')).length === 1);

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewport(viewport);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 250));
        window.scrollTo(0, 0);
      });
      await sleep(200);
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainHeading: Boolean(document.querySelector('main h1')),
      }));
      record(`Dashboard ${viewport.width}px`, dimensions.scrollWidth <= dimensions.width && dimensions.mainHeading, `scrollWidth ${dimensions.scrollWidth}px`);
      const filename = `after-dashboard-${viewport.width}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
      screenshots.push(filename);
    }

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/templates`, { waitUntil: 'networkidle2' });
    await sleep(450);
    const previewOpened = await page.$$eval('button', (buttons) => {
      const button = buttons.find((item) => item.innerText.includes('Xem trước'));
      if (!button) return false;
      button.click();
      return true;
    });
    if (previewOpened) await page.waitForSelector('[role="dialog"], .fixed.inset-0');
    await sleep(350);
    record('Template preview opens', (await page.$$('main h1')).length === 1 && previewOpened && (await page.$$('[role="dialog"]')).length === 1);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-templates-preview.png') });
    screenshots.push('after-templates-preview.png');
    const usedTemplate = await page.$$eval('button', (buttons) => {
      const button = buttons.find((item) => item.innerText.includes('Dùng Mẫu này trong Quick Editor'));
      if (!button) return false;
      button.click();
      return true;
    });
    if (usedTemplate) await page.waitForSelector('textarea', { timeout: 10000 });
    await sleep(450);
    const editorHasStarterText = await page.$eval('textarea', (textarea) => textarea.value.includes('ĐIỀU ĐẶC BIỆT GÌ SẮP XUẤT HIỆN'));
    record('Starter template populates Quick Editor', usedTemplate && editorHasStarterText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-quick-editor.png'), fullPage: true });
    screenshots.push('after-quick-editor.png');
    const saveDraftButton = await page.$$eval('button', (buttons) => {
      const button = buttons.find((item) => item.innerText.includes('Lưu bản nháp'));
      if (!button) return false;
      button.click();
      return true;
    });
    if (saveDraftButton) await page.waitForFunction(() => location.pathname === '/calendar', { timeout: 10000 }).catch(() => {});
    await sleep(900);
    const draftWasCreated = apiCalls.some((call) => call.method === 'POST' && call.pathname === '/scheduled-posts' && call.body.status === 'draft');
    record('Quick Editor saves a draft (mock API)', saveDraftButton && draftWasCreated, 'accepted by the browser mock; persistence is not verified');

    await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2' });
    await sleep(450);
    record('Calendar loaded from intercepted API', (await page.$$('main h1')).length === 1 && apiCalls.some((call) => call.pathname === '/scheduled-posts' && call.method === 'GET'));
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2' });
      await sleep(250);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      record(`Calendar ${width}px`, dimensions.scrollWidth <= dimensions.width, `scrollWidth ${dimensions.scrollWidth}px`);
    }
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2' });
    await sleep(450);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-calendar.png'), fullPage: true });
    screenshots.push('after-calendar.png');
    const openedCreateForm = await page.$$eval('button', (buttons) => {
      const button = buttons.find((item) => item.innerText.includes('Tạo bài viết mới'));
      if (!button) return false;
      button.click();
      return true;
    });
    if (openedCreateForm) await page.waitForSelector('#calendar-post-title');
    await sleep(350);
    record('Calendar create dialog opens', openedCreateForm && (await page.$$('[role="dialog"]')).length === 1);
    if (openedCreateForm) {
      await page.type('#calendar-post-title', 'Browser mock CRUD post');
      await page.type('#calendar-post-content', 'Content entered through the browser UI.');
      await page.click('button[type="submit"]');
      await sleep(400);
    }
    record('Calendar create submits through API (mock)', apiCalls.some((call) => call.method === 'POST' && call.pathname === '/scheduled-posts' && call.body.title === 'Browser mock CRUD post'), 'browser interaction only; database persistence is blocked');

    for (const [route, filename] of [
      ['/marketing-kit', 'after-marketing-generator.png'],
      ['/marketing-kit/result?planId=101', 'after-marketing-results.png'],
      ['/media-library', 'after-media-library.png'],
      ['/business-profile', 'after-business-profile.png'],
      ['/settings', 'after-settings.png'],
      ['/help', 'after-help-center.png'],
    ]) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
      await sleep(450);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
      screenshots.push(filename);
    }

    await page.goto(`${BASE_URL}/media-library`, { waitUntil: 'networkidle2' });
    await page.$$eval('button', (buttons) => buttons.find((button) => button.innerText.includes('Tạo ảnh AI'))?.click());
    await sleep(450);
    const imageStudioOpen = (await page.$$('[role="dialog"]')).length > 0;
    record('AI Image Studio opens', imageStudioOpen);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-image-studio.png') });
    screenshots.push('after-image-studio.png');

    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('pocket-agencom-auth'));
      stored.state.user.role = 'admin';
      localStorage.setItem('pocket-agencom-auth', JSON.stringify(stored));
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(450);
    const adminHeading = await page.$eval('main h1', (heading) => heading.innerText).catch(() => '');
    record('Admin dashboard renders', Boolean(adminHeading));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-admin-dashboard.png'), fullPage: true });
    screenshots.push('after-admin-dashboard.png');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await sleep(450);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-admin-users.png'), fullPage: true });
    screenshots.push('after-admin-users.png');

    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('pocket-agencom-auth'));
      stored.state.user.role = 'staff';
      localStorage.setItem('pocket-agencom-auth', JSON.stringify(stored));
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(450);
    const staffHeading = await page.$eval('main h1', (heading) => heading.innerText).catch(() => '');
    record('Staff dashboard renders', Boolean(staffHeading));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-staff-dashboard.png'), fullPage: true });
    screenshots.push('after-staff-dashboard.png');

    record('API stayed mocked', apiCalls.length > 0 && apiCalls.every((call) => !call.pathname.includes('localhost:5000')),
      `${apiCalls.length} intercepted calls; no backend process started`);
    record('No page runtime errors', pageErrors.length === 0, pageErrors.join(' | '));
    record('No browser console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
    record('No failed browser requests', failedRequests.length === 0, failedRequests.map((r) => `${r.url} ${r.reason}`).join(' | '));
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.resolve('test-results/ui-ux-browser-results.json'), JSON.stringify({
    mode: 'mocked-ui-only',
    baseUrl: BASE_URL,
    checks,
    screenshots,
    apiCalls,
    consoleErrors,
    pageErrors,
    failedRequests,
  }, null, 2));

  const failures = checks.filter((check) => !check.passed);
  console.log(`\n${checks.length - failures.length}/${checks.length} checks passed. Screenshots: ${screenshots.length}.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
