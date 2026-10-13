const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const zlib = require('node:zlib');
const dotenv = require('../backend/node_modules/dotenv');
const { resolveRealDbE2eTarget } = require('../backend/src/config/realDbE2eConfig');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const puppeteer = require('../node_modules/puppeteer-core');

const optedIn = process.env.PA_REAL_DB_E2E === 'true';
const backendEnvPath = path.resolve(__dirname, '../backend/.env');
dotenv.config({ path: backendEnvPath });
let backendProcess;
let frontendProcess;
let browser;
let prisma;
let appLogs = '';
const apiResponses = [];
const browserErrors = [];
const browserLifecycle = [];
const runPrefix = `pa-realdb-browser-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const email = `${runPrefix}@example.test`;

function safe(text) {
  return String(text || '').replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database URL]');
}

function listenOnFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function launch(command, args, options = {}) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  const retain = (chunk) => { appLogs = (appLogs + chunk.toString()).slice(-16000); };
  child.stdout.on('data', retain);
  child.stderr.on('data', retain);
  return child;
}

async function waitUntilReady(url, child, label) {
  const deadline = Date.now() + 45000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} exited early: ${safe(appLogs)}`);
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${label} did not become ready: ${safe(lastError?.message || appLogs)}`);
}

async function startBackend(apiPort, env, frontendOrigin) {
  backendProcess = launch(process.execPath, ['backend/scripts/start-real-db-browser-api.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...env,
      PORT: String(apiPort),
      FRONTEND_URL: [...new Set([...(env.FRONTEND_URL || '').split(',').map((value) => value.trim()).filter(Boolean), frontendOrigin])].join(','),
    },
  });
  await waitUntilReady(`http://127.0.0.1:${apiPort}/api/auth/login`, backendProcess, 'backend');
}

async function cleanup() {
  if (!prisma) return;
  const users = await prisma.user.findMany({ where: { email: { startsWith: runPrefix } }, select: { id: true } });
  const ids = users.map(({ id }) => id);
  if (!ids.length) return;
  const plans = await prisma.marketingPlan.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const planIds = plans.map(({ id }) => id);
  if (planIds.length) await prisma.expense.deleteMany({ where: { marketingPlanId: { in: planIds } } });
  await prisma.marketingPlan.deleteMany({ where: { userId: { in: ids } } });
  await prisma.scheduledPost.deleteMany({ where: { userId: { in: ids } } });
  await prisma.mediaAsset.deleteMany({ where: { userId: { in: ids } } });
  await prisma.supportTicket.deleteMany({ where: { userId: { in: ids } } });
  await prisma.supportTicket.deleteMany({ where: { assignedStaffId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.aiQuotaUsage.deleteMany({ where: { userId: { in: ids } } });
  await prisma.socialPlatform.deleteMany({ where: { userId: { in: ids } } });
  await prisma.template.deleteMany({ where: { createdById: { in: ids } } });
  await prisma.businessProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

function stop(child) {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 8000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGTERM');
  });
}

async function clickText(page, text) {
  const found = await page.evaluate((label) => {
    const candidates = [...document.querySelectorAll('button,a,[role="button"]')];
    const match = candidates.find((element) => element.innerText?.trim().includes(label) && element.getClientRects().length);
    if (!match) return false;
    match.click();
    return true;
  }, text);
  if (!found) throw new Error(`Visible control not found: ${text}`);
}

async function replaceInput(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.type(selector, value);
}

async function main() {
  if (!optedIn) throw new Error('Real browser E2E is disabled. Set PA_REAL_DB_E2E=true explicitly.');
  const appEnv = dotenv.parse(fs.readFileSync(backendEnvPath));
  const target = resolveRealDbE2eTarget({ optedIn, env: process.env, appEnv });
  const backup = spawnSync(process.execPath, ['backend/scripts/backup-real-db.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PA_REAL_DB_E2E: 'true' },
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (backup.stdout) process.stdout.write(backup.stdout);
  if (backup.stderr) process.stderr.write(safe(backup.stderr));
  if (backup.error || backup.status !== 0) throw new Error(`Pre-browser backup failed: ${safe(backup.error?.message || 'backup process failed')}`);

  const backupLine = backup.stdout.trim().split('\n').at(-1);
  const backupInfo = JSON.parse(backupLine);
  if (!backupInfo.verified || !fs.existsSync(backupInfo.file)) throw new Error('Pre-browser backup did not verify.');
  const snapshot = JSON.parse(zlib.gunzipSync(fs.readFileSync(backupInfo.file)).toString('utf8'));
  if (snapshot.target.database !== target.database || snapshot.target.schema !== target.schema) throw new Error('Backup target does not match configured database.');

  const env = { ...process.env, PA_REAL_DB_E2E: 'true', NODE_ENV: 'development', FREE_ONLY_MODE: 'true', AI_ALLOW_PAID_MODELS: 'false' };
  delete env.PA_TEST_DATABASE_URL;
  const apiPort = await listenOnFreePort();
  const frontPort = await listenOnFreePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const frontUrl = `http://127.0.0.1:${frontPort}`;
  const outputDir = `/tmp/pocket-agencom-db-backups/browser-${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

  try {
    await startBackend(apiPort, env, frontUrl);
    const build = spawnSync('npm', ['run', 'build', '--prefix', 'frontend'], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...env, VITE_API_URL: `${apiUrl}/api` },
      encoding: 'utf8',
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
    });
    if (build.stdout) process.stdout.write(build.stdout);
    if (build.stderr) process.stderr.write(build.stderr);
    if (build.error || build.status !== 0) throw new Error(`Frontend production build failed: ${safe(build.error?.message || 'build exited nonzero')}`);

    frontendProcess = launch(process.execPath, [path.resolve(__dirname, '../frontend/node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(frontPort), '--strictPort'], {
      cwd: path.resolve(__dirname, '../frontend'),
      env,
    });
    await waitUntilReady(`${frontUrl}/register`, frontendProcess, 'Vite frontend');

    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('close', () => browserLifecycle.push('page closed'));
    browser.on('disconnected', () => browserLifecycle.push('browser disconnected'));
    page.on('response', (response) => {
      if (response.url().includes('/api/')) apiResponses.push({ status: response.status(), path: new URL(response.url()).pathname });
    });

    await page.goto(`${frontUrl}/register`, { waitUntil: 'networkidle2' });
    try {
      await page.waitForSelector('#reg-name', { timeout: 10000 });
    } catch {
      const initialState = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        body: document.body.innerText.slice(0, 1200),
        root: document.querySelector('#root')?.innerHTML.slice(0, 1200),
      }));
      await page.screenshot({ path: path.join(outputDir, 'app-load-failure.png'), fullPage: true }).catch(() => {});
      throw new Error(`Registration route failed to render: ${JSON.stringify({ initialState, browserErrors })}`);
    }
    await page.type('#reg-name', `${runPrefix} Browser User`);
    await page.type('#reg-email', email);
    await page.type('input[type="password"]', `Browser-${crypto.randomBytes(10).toString('hex')}!`);
    await page.$eval('input[type="password"]', (input) => {
      const confirm = document.querySelectorAll('input[type="password"]')[1];
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(confirm, input.value);
      confirm.dispatchEvent(new Event('input', { bubbles: true }));
      confirm.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.click('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    try {
      await page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 30000 });
    } catch {
      const visibleState = await page.evaluate(() => ({
        path: location.pathname,
        text: document.body.innerText.slice(0, 1200),
        form: [...document.querySelectorAll('input')].map((input) => ({ type: input.type, checked: input.type === 'checkbox' ? input.checked : undefined, filled: input.type !== 'checkbox' && Boolean(input.value) })),
      }));
      await page.screenshot({ path: path.join(outputDir, 'registration-failure.png'), fullPage: true }).catch(() => {});
      throw new Error(`Registration did not complete: ${JSON.stringify({ visibleState, apiResponses, browserErrors })}`);
    }
    await page.screenshot({ path: path.join(outputDir, '01-dashboard.png'), fullPage: true });

    await page.goto(`${frontUrl}/business-profile`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some((button) => button.innerText?.includes('Chỉnh sửa Hồ sơ') && button.getClientRects().length),
      { timeout: 30000 },
    );
    await page.screenshot({ path: path.join(outputDir, '02-business-profile.png'), fullPage: true });

    await page.goto(`${frontUrl}/marketing-kit`, { waitUntil: 'networkidle2' });
    try {
      await page.waitForSelector('#campaign-business-type', { timeout: 10000 });
    } catch {
      let pageState;
      try {
        pageState = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 1000) }));
      } catch (error) {
        pageState = { error: error.message };
      }
      await page.screenshot({ path: path.join(outputDir, 'marketing-kit-failure.png'), fullPage: true }).catch(() => {});
      throw new Error(`Marketing kit route did not render: ${JSON.stringify({ pageState, browserErrors, browserLifecycle, apiResponses })}`);
    }
    await page.select('#campaign-business-type', 'local');
    await page.select('#campaign-type', 'awareness');
    await page.$eval('#product-description', (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, `${runPrefix} Vietnamese coffee for local office workers`);
    await page.$eval('#target-customer', (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, 'Office workers aged 22 to 35 near the shop');
    await page.$eval('#primary-goal', (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, `${runPrefix} increase shop visits`);
    const generateResponse = page.waitForResponse((response) => response.url().endsWith('/api/marketing-plans/generate') && response.request().method() === 'POST', { timeout: 180000 })
      .catch((error) => ({ waitError: error.message }));
    await page.click('form button[type="submit"]');
    const generated = await generateResponse;
    if (generated.waitError) throw new Error(`Marketing plan request was not observed: ${generated.waitError}`);
    if (!generated.ok()) throw new Error(`Marketing plan API returned HTTP ${generated.status()}.`);
    const generatedPayload = await generated.json();
    const planId = generatedPayload?.data?.id;
    if (!planId) throw new Error('Marketing plan API did not return a persisted plan ID.');
    await page.waitForFunction(() => location.pathname.includes('/marketing-kit/result'), { timeout: 30000 });
    try {
      await page.waitForFunction(
        () => [...document.querySelectorAll('button')].some((button) => button.innerText?.includes('Lưu kế hoạch') && button.getClientRects().length),
        { timeout: 45000 },
      );
    } catch {
      const resultState = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 1200) })).catch((error) => ({ error: error.message }));
      throw new Error(`Generated plan result did not finish loading: ${JSON.stringify({ resultState, apiResponses, browserErrors })}`);
    }
    await page.screenshot({ path: path.join(outputDir, '03-marketing-plan.png'), fullPage: true });

    const saveResponse = page.waitForResponse((response) => response.url().endsWith(`/api/marketing-plans/${planId}/save`) && response.request().method() === 'POST')
      .catch((error) => ({ waitError: error.message }));
    await clickText(page, 'Lưu kế hoạch');
    const saved = await saveResponse;
    if (saved.waitError) throw new Error(`Plan save request was not observed: ${saved.waitError}`);
    if (!saved.ok()) throw new Error(`Plan save returned HTTP ${saved.status()}.`);
    await page.screenshot({ path: path.join(outputDir, '04-plan-saved.png'), fullPage: true });

    await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir });
    await clickText(page, 'Xuất file');
    const markdownDeadline = Date.now() + 10000;
    while (Date.now() < markdownDeadline && !fs.readdirSync(outputDir).some((file) => file.endsWith('.md'))) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!fs.readdirSync(outputDir).some((file) => file.endsWith('.md'))) throw new Error('Markdown export did not create a file.');

    await page.goto(`${frontUrl}/templates`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Thư viện'));
    await page.screenshot({ path: path.join(outputDir, '05-template-library.png'), fullPage: true });
    await clickText(page, 'Dùng Mẫu này');
    await page.waitForFunction(() => location.pathname === '/user/quick-editor', { timeout: 15000 });
    try {
      await page.waitForFunction(
        () => [...document.querySelectorAll('button')].some((button) => button.innerText?.includes('Lưu bản nháp') && button.getClientRects().length),
        { timeout: 30000 },
      );
    } catch {
      const editorState = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 1200) })).catch((error) => ({ error: error.message }));
      await page.screenshot({ path: path.join(outputDir, 'quick-editor-failure.png'), fullPage: true }).catch(() => {});
      throw new Error(`Quick Editor did not render after template selection: ${JSON.stringify({ editorState, browserErrors, apiResponses })}`);
    }
    await page.screenshot({ path: path.join(outputDir, '06-quick-editor.png'), fullPage: true });
    const draftResponse = page.waitForResponse((response) => response.url().endsWith('/api/scheduled-posts') && response.request().method() === 'POST')
      .catch((error) => ({ waitError: error.message }));
    await clickText(page, 'Lưu bản nháp');
    const draftSaved = await draftResponse;
    if (draftSaved.waitError || !draftSaved.ok()) throw new Error(`Quick Editor draft save failed: ${draftSaved.waitError || draftSaved.status()}`);

    await page.goto(`${frontUrl}/calendar`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Lịch nội dung') || document.body.innerText.includes('Lịch đăng'));
    await page.screenshot({ path: path.join(outputDir, '07-content-calendar.png'), fullPage: true });
    const addPost = await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => /tạo|thêm/i.test(button.innerText) && button.getClientRects().length)?.innerText.trim());
    if (addPost) {
      await clickText(page, addPost);
      await page.waitForSelector('#calendar-post-title', { timeout: 10000 });
      await page.type('#calendar-post-title', `${runPrefix} browser calendar post`);
      await page.type('#calendar-post-content', `${runPrefix} calendar caption persisted through browser`);
      await page.type('#calendar-post-image', 'https://example.test/browser-image.png');
      await page.click('form button[type="submit"]');
      await page.waitForFunction(() => !document.querySelector('#calendar-post-title'), { timeout: 15000 });
    }

    await page.goto(`${frontUrl}/media-library`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Thư viện') || document.body.innerText.includes('media'));
    await clickText(page, 'Thêm theo URL');
    await page.waitForSelector('#media-asset-name');
    await page.type('#media-asset-name', `${runPrefix} browser media asset`);
    await page.type('#media-asset-url', 'https://example.test/real-browser-media.png');
    const mediaResponse = page.waitForResponse((response) => response.url().endsWith('/api/media') && response.request().method() === 'POST')
      .catch((error) => ({ waitError: error.message }));
    await clickText(page, 'Lưu tài nguyên');
    const mediaSaved = await mediaResponse;
    if (mediaSaved.waitError || !mediaSaved.ok()) throw new Error(`Media library save failed: ${mediaSaved.waitError || mediaSaved.status()}`);
    await page.screenshot({ path: path.join(outputDir, '08-media-library.png'), fullPage: true });
    await page.goto(`${frontUrl}/help`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#help-subject');
    await page.type('#help-subject', `${runPrefix} browser support ticket`);
    await page.type('#help-message', 'Synthetic browser E2E support persistence verification.');
    const ticketResponse = page.waitForResponse((response) => response.url().endsWith('/api/support/tickets') && response.request().method() === 'POST')
      .catch((error) => ({ waitError: error.message }));
    await page.click('form button[type="submit"]');
    const ticketSaved = await ticketResponse;
    if (ticketSaved.waitError || !ticketSaved.ok()) throw new Error(`Support ticket submission failed: ${ticketSaved.waitError || ticketSaved.status()}`);
    await page.screenshot({ path: path.join(outputDir, '09-support-ticket.png'), fullPage: true });
    await page.goto(`${frontUrl}/settings`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Cài đặt') || document.body.innerText.includes('Tài khoản'));
    await page.waitForSelector('#fullName');
    await replaceInput(page, '#fullName', `${runPrefix} Browser Settings`);
    const profileResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/profile') && response.request().method() === 'PUT')
      .catch((error) => ({ waitError: error.message }));
    await page.$eval('#fullName', (input) => input.form.querySelector('button[type="submit"]').click());
    const profileSaved = await profileResponse;
    if (profileSaved.waitError || !profileSaved.ok()) throw new Error(`Settings profile update failed: ${profileSaved.waitError || profileSaved.status()}`);
    await page.screenshot({ path: path.join(outputDir, '10-settings.png'), fullPage: true });

    await stop(backendProcess);
    backendProcess = null;
    appLogs = '';
    await startBackend(apiPort, env, frontUrl);
    await page.goto(`${frontUrl}/marketing-kit/result?planId=${planId}`, { waitUntil: 'networkidle2' });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 20000 });

    prisma = new PrismaClient();
    const persisted = await prisma.marketingPlan.findUnique({ where: { id: Number(planId) } });
    if (!persisted || persisted.userId !== generatedPayload.data.userId) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!persisted || persisted.userId !== user?.id) throw new Error('Browser-generated plan did not persist after backend restart.');
    }

    const failedApi = apiResponses.filter((item) => item.status >= 500);
    if (failedApi.length) throw new Error(`Real API returned server errors: ${JSON.stringify(failedApi)}`);
    if (browserErrors.length) throw new Error(`Browser console/page errors: ${safe(browserErrors.join(' | '))}`);
    console.log(JSON.stringify({ target: { host: target.host, port: target.port, database: target.database, schema: target.schema }, runPrefix, planId, apiResponses, screenshots: outputDir, backup: backupInfo.file, verified: true }, null, 2));
  } finally {
    if (browser) {
      const browserProcess = browser.process();
      await Promise.race([browser.close().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 3000))]);
      if (browserProcess && browserProcess.exitCode === null) browserProcess.kill('SIGKILL');
    }
    await stop(frontendProcess);
    await stop(backendProcess);
    if (!prisma) prisma = new PrismaClient();
    try { await cleanup(); } finally { await prisma.$disconnect(); }
  }
}

main().catch((error) => {
  console.error(`Real browser E2E failed: ${safe(error.stack || error)}`);
  if (appLogs) console.error(`Application logs:\n${safe(appLogs)}`);
  process.exitCode = 1;
});
