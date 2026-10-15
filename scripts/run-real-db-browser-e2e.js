const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const zlib = require('node:zlib');
const dotenv = require('../backend/node_modules/dotenv');
const { resolveRealDbE2eTarget } = require('../backend/src/config/realDbE2eConfig');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcryptjs');
const puppeteer = require('../node_modules/puppeteer-core');

const optedIn = process.env.PA_REAL_DB_E2E === 'true';
const skipAi = process.env.PA_REAL_DB_BROWSER_SKIP_AI === 'true';
const frontendDev = process.env.PA_REAL_DB_BROWSER_FRONTEND_DEV === 'true';
const backendEnvPath = path.resolve(__dirname, '../backend/.env');
dotenv.config({ path: backendEnvPath });
let backendProcess;
let frontendProcess;
let browser;
let prisma;
let testStaffNotificationIds = [];
let planId = null;
let fixtureBudgetPlanId = null;
let testAvatarAssetId = null;
let staffUser = null;
let expectedCrossUserMedia404Path = null;
let appLogs = '';
const apiResponses = [];
const browserErrors = [];
const browserWarnings = [];
const browserLifecycle = [];
const workflowFailures = [];
const runPrefix = `pa-realdb-browser-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const email = `${runPrefix}@example.test`;
let userPassword = `Browser-${crypto.randomBytes(10).toString('hex')}!`;
const staffPassword = `Staff-${crypto.randomBytes(10).toString('hex')}!`;
const adminPassword = `Admin-${crypto.randomBytes(10).toString('hex')}!`;

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
  if (testStaffNotificationIds.length) {
    await prisma.notification.deleteMany({ where: { id: { in: testStaffNotificationIds } } });
    testStaffNotificationIds = [];
  }
  const users = await prisma.user.findMany({ where: { email: { startsWith: runPrefix } }, select: { id: true } });
  const ids = users.map(({ id }) => id);
  if (!ids.length) return;
  const plans = await prisma.marketingPlan.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const planIds = plans.map(({ id }) => id);
  if (planIds.length) await prisma.expense.deleteMany({ where: { marketingPlanId: { in: planIds } } });
  await prisma.marketingPlanAsset.deleteMany({ where: { userId: { in: ids } } });
  await prisma.marketingPlan.deleteMany({ where: { userId: { in: ids } } });
  await prisma.scheduledPost.deleteMany({ where: { userId: { in: ids } } });
  const privateAssets = await prisma.mediaAsset.findMany({
    where: { userId: { in: ids }, sourceKind: 'private_storage' },
    select: { id: true, userId: true },
  });
  if (privateAssets.length) {
    await prisma.user.updateMany({ where: { id: { in: ids } }, data: { avatarMediaAssetId: null, avatarUrl: null } });
    const { createMediaAssetReferenceService } = require('../backend/src/services/mediaAssetReferenceService');
    const references = createMediaAssetReferenceService({ prismaClient: prisma });
    for (const asset of privateAssets) {
      const deletion = await references.deleteOwnedAsset(asset.userId, asset.id);
      if (deletion.pending) {
        const expiresAt = await prisma.mediaAssetAccessLease.aggregate({
          where: { mediaAssetId: asset.id },
          _max: { expiresAt: true },
        });
        const cleanupDeadline = Math.max(Date.now() + 1000, (expiresAt._max.expiresAt?.getTime() || Date.now()) + 15000);
        console.log(JSON.stringify({ event: 'waiting-for-test-avatar-signed-url-expiry', leaseExpiresAt: expiresAt._max.expiresAt?.toISOString() || null }));
        while (Date.now() < cleanupDeadline && await prisma.mediaAsset.findUnique({ where: { id: asset.id } })) {
          await references.recoverDeletingAssets({ limit: 100 });
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (await prisma.mediaAsset.findUnique({ where: { id: asset.id } })) {
          throw new Error('Test avatar remains pending after its signed URL lease expired; preserved the asset record for recovery.');
        }
      }
    }
  }
  await prisma.mediaAsset.deleteMany({ where: { userId: { in: ids }, sourceKind: 'external_url' } });
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

async function clickTextWithPointer(page, text) {
  const controls = await page.$$('button,a,[role="button"]');
  for (const control of controls) {
    const details = await control.evaluate((element) => ({
      text: element.innerText?.trim() || '',
      visible: element.getClientRects().length > 0,
      disabled: Boolean(element.disabled),
    }));
    if (details.visible && !details.disabled && details.text.includes(text)) {
      await control.click();
      return;
    }
  }
  throw new Error(`Visible enabled control not found: ${text}`);
}

async function replaceInput(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.type(selector, value);
}

async function loginAs(page, frontUrl, accountEmail, password) {
  await page.evaluate(() => localStorage.removeItem('pocket-agencom-auth'));
  await page.goto(`${frontUrl}/login`, { waitUntil: 'networkidle2' });
  await page.type('#login-email', accountEmail);
  await page.type('#login-password', password);
  await page.click('form button[type="submit"]');
  await page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 20000 });
}

async function browserApi(page, apiUrl, method, route, body) {
  return page.evaluate(async ({ apiUrl, method, route, body }) => {
    const token = JSON.parse(localStorage.getItem('pocket-agencom-auth')).state.token;
    const response = await fetch(`${apiUrl}/api${route}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let payload = null;
    try { payload = await response.json(); } catch { /* status is still useful */ }
    return { status: response.status, payload };
  }, { apiUrl, method, route, body });
}

async function loadMediaPreview(page, name) {
  await page.waitForFunction((label) => Boolean([...document.querySelectorAll('[role="img"], img')]
    .find((element) => element.getAttribute('aria-label') === label || element.alt === label)), { timeout: 20000 }, name);
  await page.evaluate((label) => {
    const image = [...document.querySelectorAll('[role="img"], img')]
      .find((element) => element.getAttribute('aria-label') === label || element.alt === label);
    image?.scrollIntoView({ block: 'center' });
  }, name);
  await page.waitForFunction((label) => [...document.images].some((img) => img.alt === label)
    || [...document.querySelectorAll('[role="img"]')].some((element) => element.getAttribute('aria-label') === label && element.innerText.includes('Ảnh không khả dụng')),
  { timeout: 30000 }, name);
  const previewState = await page.evaluate((label) => {
    const image = [...document.images].find((img) => img.alt === label);
    const placeholder = [...document.querySelectorAll('[role="img"]')]
      .find((element) => element.getAttribute('aria-label') === label);
    return {
      imageFound: Boolean(image),
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0),
      imageStatus: image ? { complete: image.complete, naturalWidth: image.naturalWidth } : null,
      placeholderText: placeholder?.innerText || null,
    };
  }, name);
  if (!previewState.imageFound) throw new Error(`Authorized Media Library preview was unavailable: ${JSON.stringify(previewState)}`);
  await page.waitForFunction((label) => [...document.images].some((img) => img.alt === label && img.complete && img.naturalWidth > 0), { timeout: 30000 }, name);
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
    if (skipAi) {
      env.OPENROUTER_API_KEY = '';
      env.GROQ_API_KEY = '';
      env.GEMINI_API_KEY = '';
      env.CLOUDFLARE_API_TOKEN = '';
    }
  delete env.PA_TEST_DATABASE_URL;
  const apiPort = await listenOnFreePort();
  const frontPort = await listenOnFreePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const frontUrl = `http://127.0.0.1:${frontPort}`;
  const outputDir = `/tmp/pocket-agencom-db-backups/browser-${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  prisma = new PrismaClient();
  console.log(JSON.stringify({ event: 'real-browser-e2e-start', target: { host: target.host, port: target.port, database: target.database, schema: target.schema }, runPrefix, aiSkipped: skipAi, backup: backupInfo.file, outputDir }));

  try {
    await startBackend(apiPort, env, frontUrl);
    const build = frontendDev ? { status: 0 } : spawnSync('npm', ['run', 'build', '--prefix', 'frontend'], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...env, NODE_ENV: 'production', VITE_API_URL: `${apiUrl}/api` },
      encoding: 'utf8',
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
    });
    if (build.stdout) process.stdout.write(build.stdout);
    if (build.stderr) process.stderr.write(build.stderr);
    if (build.error || build.status !== 0) throw new Error(`Frontend production build failed: ${safe(build.error?.message || 'build exited nonzero')}`);

    frontendProcess = launch(process.execPath, [path.resolve(__dirname, '../frontend/node_modules/vite/bin/vite.js'), frontendDev ? 'dev' : 'preview', '--host', '127.0.0.1', '--port', String(frontPort), '--strictPort'], {
      cwd: path.resolve(__dirname, '../frontend'),
      env: { ...env, VITE_API_URL: `${apiUrl}/api` },
    });
    await waitUntilReady(`${frontUrl}/register`, frontendProcess, 'Vite frontend');

    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        const text = message.text();
        if (text.includes('Cannot update a component') || text.includes('Encountered two children with the same key')) browserWarnings.push(text);
        else browserErrors.push(text);
      }
    });
    page.on('requestfailed', (request) => {
      if ((request.url().startsWith(frontUrl) || request.url().startsWith(apiUrl)) && request.failure()?.errorText !== 'net::ERR_ABORTED') {
        browserErrors.push(`Local request failed: ${new URL(request.url()).pathname}`);
      }
    });
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
    await page.type('input[type="password"]', userPassword);
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

    const testOwner = await prisma.user.findUnique({ where: { email }, include: { businessProfile: true } });
    if (!testOwner?.businessProfile) throw new Error('Browser-registered user has no persisted business profile.');
    staffUser = await prisma.user.create({
      data: {
        name: `${runPrefix} Staff`,
        email: `${runPrefix}-staff@example.test`,
        passwordHash: await bcrypt.hash(staffPassword, 10),
        role: 'staff',
        status: 'active',
      },
    });

    const avatarPath = path.join(outputDir, 'synthetic-browser-avatar.png');
    fs.writeFileSync(avatarPath, await page.screenshot({ type: 'png' }), { mode: 0o600 });
    await page.goto(`${frontUrl}/settings`, { waitUntil: 'networkidle2' });
    const avatarInput = await page.$('input[type="file"]');
    if (!avatarInput) throw new Error('Avatar upload file input did not render.');
    const avatarUploadResponse = page.waitForResponse((response) => response.url().endsWith('/api/upload/avatar') && response.request().method() === 'POST', { timeout: 30000 });
    const avatarProfileResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/profile') && response.request().method() === 'PUT', { timeout: 30000 });
    await avatarInput.uploadFile(avatarPath);
    const avatarUpload = await avatarUploadResponse;
    if (!avatarUpload.ok()) throw new Error(`Avatar upload returned HTTP ${avatarUpload.status()}.`);
    const avatarUpdated = await avatarProfileResponse;
    if (!avatarUpdated.ok()) throw new Error(`Avatar profile update returned HTTP ${avatarUpdated.status()}.`);
    const persistedAvatarOwner = await prisma.user.findUnique({ where: { id: testOwner.id }, select: { avatarMediaAssetId: true } });
    testAvatarAssetId = persistedAvatarOwner.avatarMediaAssetId;
    const avatarAsset = testAvatarAssetId && await prisma.mediaAsset.findUnique({ where: { id: testAvatarAssetId } });
    if (!avatarAsset || avatarAsset.userId !== testOwner.id || avatarAsset.sourceKind !== 'private_storage' || avatarAsset.storageBucket !== 'avatars-private') {
      throw new Error('Avatar upload did not persist an owned private Storage asset.');
    }
    const ownerAvatarAccess = await browserApi(page, apiUrl, 'GET', `/media/${testAvatarAssetId}/access`);
    if (ownerAvatarAccess.status !== 200 || !ownerAvatarAccess.payload?.data?.url) throw new Error('Avatar owner access did not return an authorized preview URL.');
    const ownerAvatarPreview = await page.evaluate((url) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ loaded: true, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({ loaded: false, width: 0, height: 0 });
      image.src = url;
    }), ownerAvatarAccess.payload.data.url);
    if (!ownerAvatarPreview.loaded || ownerAvatarPreview.width < 1 || ownerAvatarPreview.height < 1) {
      throw new Error('Authorized avatar preview did not render in the browser.');
    }
    await page.screenshot({ path: path.join(outputDir, '01a-private-avatar.png'), fullPage: true });

    await loginAs(page, frontUrl, staffUser.email, staffPassword);
    const staffAvatarAccess = await browserApi(page, apiUrl, 'GET', `/admin/users/${testOwner.id}/avatar-access`);
    if (staffAvatarAccess.status !== 200 || !staffAvatarAccess.payload?.data?.url) throw new Error('Staff avatar access was not authorized for the linked avatar.');
    const staffAvatarPreview = await page.evaluate((url) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ loaded: true, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({ loaded: false, width: 0, height: 0 });
      image.src = url;
    }), staffAvatarAccess.payload.data.url);
    if (!staffAvatarPreview.loaded || staffAvatarPreview.width < 1 || staffAvatarPreview.height < 1) {
      throw new Error('Staff avatar signed URL did not render image bytes.');
    }
    await loginAs(page, frontUrl, email, userPassword);

    const analyticsResponse = await browserApi(page, apiUrl, 'GET', '/analytics/my-business');
    if (analyticsResponse.status !== 200 || !analyticsResponse.payload?.success) throw new Error(`Dashboard analytics returned HTTP ${analyticsResponse.status}.`);
    await page.goto(`${frontUrl}/dashboard`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 15000 });
    await page.screenshot({ path: path.join(outputDir, '01b-dashboard-analytics.png'), fullPage: true });

    const socialUrl = `https://instagram.com/${runPrefix}`;
    const socialCreate = await browserApi(page, apiUrl, 'PUT', '/auth/business-profile', {
      businessName: `${runPrefix} business`,
      socialLinks: [{ platform: 'instagram', url: socialUrl }],
    });
    if (socialCreate.status !== 200) throw new Error(`Social account create returned HTTP ${socialCreate.status}.`);
    const socialAsset = await prisma.socialPlatform.findFirst({ where: { userId: testOwner.id, platform: 'instagram', url: socialUrl } });
    if (!socialAsset) throw new Error('Social account create was not persisted in PostgreSQL.');
    try {
      await page.goto(`${frontUrl}/settings`, { waitUntil: 'networkidle2' });
      await clickText(page, 'Liên kết Mạng xã hội');
      await page.waitForFunction((url) => [...document.querySelectorAll('a[href]')].some((link) => {
        try { return new URL(link.href).href === new URL(url).href; } catch { return false; }
      }), { timeout: 15000 }, socialUrl);
      page.once('dialog', (dialog) => dialog.accept());
      const socialDeleteResponse = page.waitForResponse((response) => response.url().endsWith(`/api/social-platforms/${socialAsset.id}`) && response.request().method() === 'DELETE');
      await clickText(page, 'Ngắt kết nối');
      const socialDeleted = await socialDeleteResponse;
      if (!socialDeleted.ok() || await prisma.socialPlatform.findUnique({ where: { id: socialAsset.id } })) throw new Error('Social account delete did not persist.');
    } catch (error) {
      const state = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 900) })).catch(() => null);
      await page.screenshot({ path: path.join(outputDir, 'social-settings-failure.png'), fullPage: true }).catch(() => {});
      workflowFailures.push(`Social account browser list/delete failed: ${safe(error.message)} (${JSON.stringify(state)})`);
    }

    await page.goto(`${frontUrl}/settings`, { waitUntil: 'networkidle2' });
    await clickText(page, 'Bảo mật');
    await page.waitForSelector('#currentPassword');
    const changedPassword = `Changed-${crypto.randomBytes(10).toString('hex')}!`;
    await page.type('#currentPassword', userPassword);
    await page.type('#newPassword', changedPassword);
    await page.type('#confirmPassword', changedPassword);
    const passwordResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/change-password') && response.request().method() === 'PUT');
    await clickText(page, 'Cập nhật Mật khẩu');
    const passwordUpdated = await passwordResponse;
    if (!passwordUpdated.ok()) throw new Error(`Password change returned HTTP ${passwordUpdated.status()}.`);
    userPassword = changedPassword;
    await loginAs(page, frontUrl, email, userPassword);

    await page.goto(`${frontUrl}/settings`, { waitUntil: 'networkidle2' });
    await clickText(page, 'Thông báo');
    const initialPreference = await page.$eval('button[role="switch"]', (button) => button.getAttribute('aria-checked'));
    await page.click('button[role="switch"]');
    await page.waitForFunction((value) => document.querySelector('button[role="switch"]')?.getAttribute('aria-checked') !== value, { timeout: 5000 }, initialPreference);
    const toggledPreference = await page.$eval('button[role="switch"]', (button) => button.getAttribute('aria-checked'));
    await page.reload({ waitUntil: 'networkidle2' });
    await clickText(page, 'Thông báo');
    const persistedPreference = await page.$eval('button[role="switch"]', (button) => button.getAttribute('aria-checked'));
    if (persistedPreference !== toggledPreference) throw new Error('Local notification preference did not persist after browser reload.');

    try {
      const budgetPlan = await prisma.marketingPlan.create({
        data: {
          userId: testOwner.id,
          businessProfileId: testOwner.businessProfile.id,
          goal: `${runPrefix} budget workflow fixture`,
          campaignType: 'awareness',
          budget: 100000,
          status: 'saved',
        },
      });
      fixtureBudgetPlanId = budgetPlan.id;
      await page.goto(`${frontUrl}/marketing-kit/result?planId=${budgetPlan.id}`, { waitUntil: 'networkidle2' });
      await page.waitForFunction(() => document.body.innerText.toLocaleLowerCase('vi').includes('quản lý ngân sách & chi tiêu'), { timeout: 30000 });
      await page.type('input[placeholder="Ví dụ: 5000000"]', '1250');
      await page.type('input[placeholder="Nhập ghi chú chi tiết..."]', `${runPrefix} expense browser fixture`);
      const expenseResponse = page.waitForResponse((response) => response.url().endsWith('/api/expenses') && response.request().method() === 'POST');
      await clickText(page, 'Ghi nhận chi phí');
      const expenseSaved = await expenseResponse;
      if (!expenseSaved.ok()) throw new Error(`Expense create returned HTTP ${expenseSaved.status()}.`);
      const expense = await prisma.expense.findFirst({ where: { marketingPlanId: budgetPlan.id, note: `${runPrefix} expense browser fixture` } });
      if (!expense || Number(expense.amount) !== 1250) throw new Error('Expense create did not persist in PostgreSQL.');
      await page.waitForFunction((note) => document.body.innerText.includes(note), { timeout: 10000 }, expense.note);
      await page.screenshot({ path: path.join(outputDir, '01c-budget-expense.png'), fullPage: true });
    } catch (error) {
      const state = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 1000) })).catch(() => null);
      await page.screenshot({ path: path.join(outputDir, 'budget-expense-failure.png'), fullPage: true }).catch(() => {});
      workflowFailures.push(`Budget/expense browser create failed: ${safe(error.message)} (${JSON.stringify(state)})`);
    }

    await page.goto(`${frontUrl}/business-profile`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some((button) => button.innerText?.includes('Chỉnh sửa Hồ sơ') && button.getClientRects().length),
      { timeout: 30000 },
    );
    await page.screenshot({ path: path.join(outputDir, '02-business-profile.png'), fullPage: true });

    if (!skipAi) {
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
    planId = generatedPayload?.data?.id;
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

    await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir });
    await clickText(page, 'Xuất file');
    const markdownDeadline = Date.now() + 10000;
    while (Date.now() < markdownDeadline && !fs.readdirSync(outputDir).some((file) => file.endsWith('.md'))) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!fs.readdirSync(outputDir).some((file) => file.endsWith('.md'))) throw new Error('Markdown export did not create a file.');

    const priorNotificationMax = await prisma.notification.aggregate({ _max: { id: true } });
    const saveResponse = page.waitForResponse((response) => response.url().endsWith(`/api/marketing-plans/${planId}/save`) && response.request().method() === 'POST')
      .catch((error) => ({ waitError: error.message }));
    await clickText(page, 'Lưu kế hoạch');
    const saved = await saveResponse;
    if (saved.waitError) throw new Error(`Plan save request was not observed: ${saved.waitError}`);
    if (!saved.ok()) throw new Error(`Plan save returned HTTP ${saved.status()}.`);
    const newStaffNotifications = await prisma.notification.findMany({
      where: {
        id: { gt: priorNotificationMax._max.id || 0 },
        title: 'Plan ready for review',
        message: 'Marketing plan from user requires staff review.',
      },
      select: { id: true },
    });
    testStaffNotificationIds = newStaffNotifications.map(({ id }) => id);
    await page.screenshot({ path: path.join(outputDir, '04-plan-saved.png'), fullPage: true });

    const refineResponse = await browserApi(page, apiUrl, 'POST', `/marketing-plans/${planId}/refine`, {
      instruction: 'Điều chỉnh kế hoạch để nhấn mạnh ưu đãi dùng thử tại cửa hàng trong tuần đầu tiên.',
    });
    const refinedPlan = await prisma.marketingPlan.findUnique({ where: { id: Number(planId) } });
    if (refineResponse.status !== 200 || !refineResponse.payload?.data?.revisionSummary || !refinedPlan?.contentIdeas) {
      throw new Error(`Real Marketing Plan refinement failed (HTTP ${refineResponse.status}).`);
    }

    const imagePromptResponse = await browserApi(page, apiUrl, 'POST', '/marketing-plans/generate-image-prompt', {
      postContent: `${runPrefix}: cà phê Việt Nam dùng thử cho nhân viên văn phòng quanh cửa hàng.`,
      platform: 'Instagram',
      businessProfileId: testOwner.businessProfile.id,
    });
    const generatedImagePrompt = imagePromptResponse.payload?.data?.imagePrompt;
    if (imagePromptResponse.status !== 200 || typeof generatedImagePrompt !== 'string' || generatedImagePrompt.trim().length < 20) {
      throw new Error(`Real image-prompt generation failed (HTTP ${imagePromptResponse.status}).`);
    }

    const generatedImage = await browserApi(page, apiUrl, 'POST', '/media/generate-image', {
      prompt: generatedImagePrompt,
      aspectRatio: '1:1',
      platform: 'Instagram',
      businessProfileId: testOwner.businessProfile.id,
    });
    const generatedImageAssetId = generatedImage.payload?.data?.mediaAssetId;
    if (generatedImage.status !== 201 || !generatedImageAssetId) {
      throw new Error(`Real FLUX image generation or private-storage persistence failed (HTTP ${generatedImage.status}).`);
    }
    const imageAsset = await prisma.mediaAsset.findUnique({ where: { id: Number(generatedImageAssetId) } });
    if (!imageAsset || imageAsset.userId !== testOwner.id || imageAsset.sourceKind !== 'private_storage'
      || imageAsset.storageBucket !== 'campaign-assets-private' || !imageAsset.storagePath
      || imageAsset.url !== null || imageAsset.sizeBytes <= 0) {
      throw new Error('Generated FLUX image did not persist as an owned private Storage MediaAsset.');
    }

    const inlineAccess = await browserApi(page, apiUrl, 'GET', `/media/${generatedImageAssetId}/access`);
    if (inlineAccess.status !== 200 || !inlineAccess.payload?.data?.temporary || !inlineAccess.payload?.data?.url
      || new Date(inlineAccess.payload.data.expiresAt).getTime() < Date.now() + 8 * 60 * 1000) {
      throw new Error('Generated image did not return a 10-minute owner-only signed preview URL.');
    }
    const imageDownload = await fetch(inlineAccess.payload.data.url);
    const imageBytes = Buffer.from(await imageDownload.arrayBuffer());
    const isPng = imageBytes.length >= 8 && imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = imageBytes.length >= 3 && imageBytes[0] === 255 && imageBytes[1] === 216 && imageBytes[2] === 255;
    if (!imageDownload.ok || !imageDownload.headers.get('content-type')?.startsWith('image/')
      || imageBytes.length !== imageAsset.sizeBytes || (!isPng && !isJpeg)) {
      throw new Error('Signed preview did not return the persisted generated image bytes.');
    }
    const attachmentAccess = await browserApi(page, apiUrl, 'GET', `/media/${generatedImageAssetId}/access?download=true`);
    if (attachmentAccess.status !== 200 || !attachmentAccess.payload?.data?.url) {
      throw new Error('Generated image download signing was rejected for its owner.');
    }
    const attachment = await fetch(attachmentAccess.payload.data.url);
    const attachmentBytes = Buffer.from(await attachment.arrayBuffer());
    if (!attachment.ok || !attachment.headers.get('content-disposition')?.toLowerCase().includes('attachment')
      || attachmentBytes.length !== imageAsset.sizeBytes) {
      throw new Error('Owner signed download did not return the generated image as an attachment.');
    }

    await page.goto(`${frontUrl}/media-library`, { waitUntil: 'networkidle2' });
    await loadMediaPreview(page, imageAsset.name);
    const previewAccessCount = apiResponses.filter(({ path }) => path === `/api/media/${generatedImageAssetId}/access`).length;
    await page.reload({ waitUntil: 'networkidle2' });
    await loadMediaPreview(page, imageAsset.name);
    const refreshedAsset = await prisma.mediaAsset.findUnique({ where: { id: Number(generatedImageAssetId) } });
    const refreshedAccessCount = apiResponses.filter(({ path }) => path === `/api/media/${generatedImageAssetId}/access`).length;
    if (!refreshedAsset || refreshedAsset.id !== imageAsset.id || refreshedAsset.url !== null
      || refreshedAccessCount <= previewAccessCount) {
      throw new Error('Generated MediaAsset or authorized preview did not survive a browser refresh.');
    }
    await page.screenshot({ path: path.join(outputDir, '03a-private-ai-image-preview.png'), fullPage: true });

    const scheduledImagePost = await browserApi(page, apiUrl, 'POST', '/scheduled-posts', {
      title: `${runPrefix} generated image schedule`,
      content: 'Bài đăng thử nghiệm ảnh AI riêng tư.',
      platform: 'Instagram',
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      businessProfileId: testOwner.businessProfile.id,
      mediaAssetId: generatedImageAssetId,
    });
    const attachedPost = await prisma.scheduledPost.findFirst({ where: { userId: testOwner.id, title: `${runPrefix} generated image schedule` } });
    if (scheduledImagePost.status !== 201 || scheduledImagePost.payload?.data?.mediaAssetId !== generatedImageAssetId
      || attachedPost?.mediaAssetId !== generatedImageAssetId || attachedPost.imageUrl !== null) {
      throw new Error(`Scheduled-post attachment did not persist the private asset ID (HTTP ${scheduledImagePost.status}).`);
    }

    await loginAs(page, frontUrl, staffUser.email, staffPassword);
    expectedCrossUserMedia404Path = `/api/media/${generatedImageAssetId}/access`;
    const crossUserImageAccess = await browserApi(page, apiUrl, 'GET', `/media/${generatedImageAssetId}/access`);
    if (crossUserImageAccess.status !== 404 || crossUserImageAccess.payload?.data?.url) {
      throw new Error(`A different user's media access returned HTTP ${crossUserImageAccess.status}, expected 404.`);
    }
    await loginAs(page, frontUrl, email, userPassword);
    console.log(JSON.stringify({
      event: 'real-ai-private-image-verified',
      provider: generatedImage.payload.data.provider,
      model: generatedImage.payload.data.model,
      mediaAssetId: generatedImageAssetId,
      imageBytes: imageAsset.sizeBytes,
      previewRefresh: true,
      download: true,
      scheduledPostId: attachedPost.id,
      crossUserDenied: true,
    }));
    }

    await page.goto(`${frontUrl}/templates`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Thư viện'));
    await page.screenshot({ path: path.join(outputDir, '05-template-library.png'), fullPage: true });
    const quickEditorAiResponse = skipAi ? null : page.waitForResponse(
      (response) => response.url().endsWith('/api/marketing-plans/generate-post') && response.request().method() === 'POST',
      { timeout: 180000 },
    ).catch(async (error) => ({
      waitError: error.message,
      pageState: await page.evaluate(() => ({
        path: location.pathname,
        textareaLength: document.querySelector('textarea')?.value.length || 0,
        buttons: [...document.querySelectorAll('button')].map((button) => button.innerText.trim()).filter(Boolean).slice(0, 12),
      })).catch(() => null),
      apiResponses: apiResponses.slice(-20),
      browserErrors: browserErrors.slice(-10),
    }));
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
    const quickEditorContext = await page.evaluate(() => {
      const state = window.history.state?.usr || {};
      return {
        stateKeys: Object.keys(state),
        hasTemplate: Boolean(state.template),
        hasTrend: Boolean(state.trend),
        initialContentLength: typeof state.initialContent === 'string' ? state.initialContent.length : 0,
      };
    });
    console.log(JSON.stringify({ event: 'quick-editor-context', ...quickEditorContext }));
    if (skipAi) {
      if (quickEditorContext.initialContentLength < 40) throw new Error('Quick Editor template content was missing.');
    } else {
      await clickTextWithPointer(page, 'Bắt trend với AI');
      const quickEditorAi = await quickEditorAiResponse;
      if (quickEditorAi.waitError) throw new Error(`Quick Editor AI request was not observed: ${JSON.stringify(quickEditorAi)}`);
      if (!quickEditorAi.ok()) throw new Error(`Quick Editor AI generation returned HTTP ${quickEditorAi.status()}.`);
      const quickEditorPayload = await quickEditorAi.json();
      const quickEditorContent = quickEditorPayload?.data?.content;
      if (typeof quickEditorContent !== 'string' || quickEditorContent.trim().length < 40) {
        throw new Error('Quick Editor AI returned no meaningful post content.');
      }
      await page.waitForFunction((content) => document.querySelector('textarea')?.value === content, { timeout: 15000 }, quickEditorContent);
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
      const originalTitle = `${runPrefix} browser calendar post`;
      const editedTitle = `${runPrefix} edited calendar post`;
      await page.type('#calendar-post-title', originalTitle);
      await page.type('#calendar-post-content', `${runPrefix} calendar caption persisted through browser`);
      await page.type('#calendar-post-image', 'https://example.test/browser-image.png');
      await page.click('form button[type="submit"]');
      await page.waitForFunction(() => !document.querySelector('#calendar-post-title'), { timeout: 15000 });
      const calendarDb = new PrismaClient();
      try {
        const owner = await calendarDb.user.findUnique({ where: { email }, select: { id: true } });
        const created = await calendarDb.scheduledPost.findFirst({ where: { userId: owner.id, title: originalTitle } });
        if (!created) throw new Error('Calendar create did not persist in PostgreSQL.');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForFunction((title) => [...document.querySelectorAll('p')].some((item) => item.innerText === title && item.getClientRects().length), { timeout: 15000 }, originalTitle);
        const opened = await page.evaluate((title) => {
          const chip = [...document.querySelectorAll('p')].find((item) => item.innerText === title && item.getClientRects().length);
          chip?.click();
          return !!chip;
        }, originalTitle);
        if (!opened) throw new Error('Created calendar post not visible after refresh.');
        await clickText(page, 'Sửa');
        await page.waitForSelector('#calendar-post-title');
        await replaceInput(page, '#calendar-post-title', editedTitle);
        await replaceInput(page, '#calendar-post-content', `${runPrefix} edited caption`);
        const editResponse = page.waitForResponse((response) => response.url().endsWith(`/api/scheduled-posts/${created.id}`) && response.request().method() === 'PATCH');
        await page.click('form button[type="submit"]');
        if (!(await editResponse).ok()) throw new Error('Calendar edit request failed.');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForFunction((title) => [...document.querySelectorAll('p')].some((item) => item.innerText === title && item.getClientRects().length), { timeout: 15000 }, editedTitle);
        const updated = await calendarDb.scheduledPost.findUnique({ where: { id: created.id } });
        if (updated.title !== editedTitle || !updated.content.startsWith(`${runPrefix} edited caption`)) throw new Error(`Calendar edit mismatch: ${JSON.stringify({ expectedTitle: editedTitle, actualTitle: updated.title, actualContent: updated.content })}`);
        await page.evaluate((title) => [...document.querySelectorAll('p')].find((item) => item.innerText === title && item.getClientRects().length)?.click(), editedTitle);
        page.once('dialog', (dialog) => dialog.accept());
        const deleteResponse = page.waitForResponse((response) => response.url().endsWith(`/api/scheduled-posts/${created.id}`) && response.request().method() === 'DELETE');
        await page.click('button[title="Xóa bài viết"]');
        if (!(await deleteResponse).ok()) throw new Error('Calendar delete request failed.');
        await page.reload({ waitUntil: 'networkidle2' });
        if (await calendarDb.scheduledPost.findUnique({ where: { id: created.id } })) throw new Error('Calendar delete did not persist in PostgreSQL.');
        await page.screenshot({ path: path.join(outputDir, '07-calendar-after-delete.png'), fullPage: true });
      } finally {
        await calendarDb.$disconnect();
      }
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
    const profileResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/profile') && response.request().method() === 'PUT', { timeout: 15000 })
      .catch((error) => ({ waitError: error.message }));
    await page.click('form button[type="submit"]');
    const profileSaved = await profileResponse;
    if (profileSaved.waitError || !profileSaved.ok()) {
      await page.screenshot({ path: path.join(outputDir, 'settings-profile-failure.png'), fullPage: true }).catch(() => {});
      const state = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 1200), fullName: document.querySelector('#fullName')?.value }));
      workflowFailures.push(`Settings profile update failed: ${profileSaved.waitError || profileSaved.status()} (${JSON.stringify(state)})`);
    }
    await page.screenshot({ path: path.join(outputDir, '10-settings.png'), fullPage: true });

    await stop(backendProcess);
    backendProcess = null;
    appLogs = '';
    await startBackend(apiPort, env, frontUrl);
    let staff = null;
    let admin = null;
    let denied = null;
    let editedUser = null;
    if (!skipAi) {
    await page.goto(`${frontUrl}/marketing-kit/result?planId=${planId}`, { waitUntil: 'networkidle2' });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 20000 });

    const persisted = await prisma.marketingPlan.findUnique({ where: { id: Number(planId) } });
    const testUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!persisted || persisted.userId !== testUser?.id) throw new Error('Browser-generated plan did not persist after backend restart.');
    const staffEmail = staffUser.email;
    const adminEmail = `${runPrefix}-admin@example.test`;
    staff = staffUser;
    admin = await prisma.user.create({ data: { name: `${runPrefix} Admin`, email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10), role: 'admin', status: 'active' } });

    denied = await page.evaluate(async ({ apiUrl, id }) => {
      const token = JSON.parse(localStorage.getItem('pocket-agencom-auth')).state.token;
      const response = await fetch(`${apiUrl}/api/admin/users/${id}/role`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'staff' }) });
      return response.status;
    }, { apiUrl, id: testUser.id });
    if (denied !== 403) throw new Error(`Normal user admin mutation returned HTTP ${denied}, expected 403.`);
    if ((await prisma.user.findUnique({ where: { id: testUser.id } })).role !== 'user') throw new Error('Unauthorized role mutation changed the database.');

    await loginAs(page, frontUrl, staffEmail, staffPassword);
    try {
      await page.waitForSelector(`a[href="/staff/plan-review/${planId}"]`, { timeout: 15000 });
    } catch {
      const [queueState, staffState] = await Promise.all([
        page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 1400), links: [...document.querySelectorAll('a')].map((link) => link.getAttribute('href')).filter(Boolean) })),
        Promise.all([
          prisma.marketingPlan.findUnique({ where: { id: Number(planId) }, select: { status: true, userId: true } }),
          prisma.user.findUnique({ where: { email: staffEmail }, select: { role: true, status: true } }),
        ]),
      ]);
      throw new Error(`Staff review queue omitted test plan ${planId}: ${JSON.stringify({ queueState, plan: staffState[0], staff: staffState[1] })}`);
    }
    await page.screenshot({ path: path.join(outputDir, '13-staff-review-queue.png'), fullPage: true });
    await page.click(`a[href="/staff/plan-review/${planId}"]`);
    await page.waitForFunction((id) => location.pathname === `/staff/plan-review/${id}`, { timeout: 15000 }, planId);
    await page.waitForFunction(() => document.body.innerText.includes('Đánh dấu Đã xem'), { timeout: 15000 });
    const reviewResponse = page.waitForResponse((response) => response.url().endsWith(`/api/marketing-plans/${planId}/review`) && response.request().method() === 'PATCH').catch((error) => ({ waitError: error.message }));
    await clickText(page, 'Đánh dấu Đã xem');
    const reviewedResponse = await reviewResponse;
    if (reviewedResponse.waitError || !reviewedResponse.ok()) throw new Error(`Staff review request failed: ${reviewedResponse.waitError || reviewedResponse.status()}`);
    await page.reload({ waitUntil: 'networkidle2' });
    const reviewed = await prisma.marketingPlan.findUnique({ where: { id: Number(planId) } });
    if (reviewed.status !== 'reviewed' || reviewed.reviewedById !== staff.id) throw new Error('Staff review did not persist in PostgreSQL.');
    try {
      await page.waitForFunction(() => document.body.innerText.toLocaleLowerCase('vi').includes('đang duyệt'), { timeout: 15000 });
    } catch {
      const visible = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 1500) }));
      throw new Error(`Staff review status not visible after refresh: ${JSON.stringify(visible)}`);
    }
    await page.screenshot({ path: path.join(outputDir, '14-staff-reviewed-plan.png'), fullPage: true });

    await loginAs(page, frontUrl, adminEmail, adminPassword);
    await page.goto(`${frontUrl}/admin/users`, { waitUntil: 'networkidle2' });
    await page.type('input[placeholder="Tìm kiếm theo tên hoặc email..."]', email);
    await page.waitForFunction((value) => document.body.innerText.includes(value), { timeout: 15000 }, email);
    await page.evaluate((value) => {
      const row = [...document.querySelectorAll('tr')].find((item) => item.innerText.includes(value));
      row?.querySelector('button[title="Chỉnh sửa Vai trò / Trạng thái"]')?.click();
    }, email);
    await page.waitForFunction(() => document.body.innerText.includes('Phân quyền Người dùng'));
    const editSelects = await page.$$('form select');
    await editSelects[0].select('staff');
    await editSelects[1].select('inactive');
    await clickText(page, 'Lưu Thay đổi');
    await page.waitForFunction(() => !document.body.innerText.includes('Phân quyền Người dùng'), { timeout: 15000 });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForFunction((value) => document.body.innerText.includes(value), { timeout: 15000 }, email);
    editedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    if (editedUser.role !== 'staff' || editedUser.status !== 'inactive') throw new Error('Admin role/status edit did not persist in PostgreSQL.');
    await page.screenshot({ path: path.join(outputDir, '15-admin-user-edited.png'), fullPage: true });
    }

    if (skipAi) {
      await page.goto(`${frontUrl}/dashboard`, { waitUntil: 'networkidle2' });
      await page.click('button[aria-label="Đăng xuất"]');
      await page.waitForFunction(() => location.pathname === '/login', { timeout: 15000 });
      const authState = await page.evaluate(() => JSON.parse(localStorage.getItem('pocket-agencom-auth') || '{}').state || null);
      if (authState?.token || authState?.isAuthenticated) throw new Error('Logout left the browser session authenticated.');
    }

    const timeoutLog = appLogs.split('\n').find((line) => line.startsWith('[AI timeout config]')) || null;
    const failedApi = apiResponses.filter((item) => item.status >= 400
      && !(item.status === 403 && item.path.includes('/api/admin/users/'))
      && !(item.status === 404 && item.path === expectedCrossUserMedia404Path)
      && !(skipAi && item.status === 503 && item.path === '/api/marketing-plans/trends'));
    const verified = workflowFailures.length === 0 && failedApi.length === 0 && browserErrors.length === 0 && browserWarnings.length === 0;
    console.log(JSON.stringify({ target: { host: target.host, port: target.port, database: target.database, schema: target.schema }, runPrefix, aiSkipped: skipAi, runtimeAiTimeoutConfig: timeoutLog, planId, fixtureBudgetPlanId, avatarAssetId: testAvatarAssetId, staffId: staffUser?.id || null, adminId: staff?.id || null, roleStatusAfterAdmin: editedUser ? { role: editedUser.role, status: editedUser.status } : null, unauthorizedAdminStatus: denied, workflowFailures, failedApi, browserErrors, browserWarnings, apiResponses, screenshots: outputDir, backup: backupInfo.file, verified }, null, 2));
    if (failedApi.length) throw new Error(`Real API returned unexpected errors: ${JSON.stringify(failedApi)}`);
    if (browserErrors.length) throw new Error(`Browser console/page errors: ${safe(browserErrors.join(' | '))}`);
    if (browserWarnings.length) throw new Error(`Browser React warnings: ${safe(browserWarnings.join(' | '))}`);
    if (workflowFailures.length) throw new Error(`One or more independent browser workflows failed: ${workflowFailures.join(' | ')}`);
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
