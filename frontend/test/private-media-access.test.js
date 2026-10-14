import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('private media access is demand-loaded and refreshes only transient component memory', async () => {
  const hook = await read('../src/hooks/useAuthorizedMediaUrl.js');
  assert.match(hook, /IntersectionObserver/);
  assert.match(hook, /rootMargin: '160px'/);
  assert.match(hook, /expiresAt.*Date\.now\(\).*30_000/);
  assert.match(hook, /setSigned\(\{ assetId, url: response\?\.url, expiresAt: response\?\.expiresAt \}\)/);
  assert.doesNotMatch(hook, /localStorage|sessionStorage|console\.(log|warn|error)/);
});

test('media library and saved plans render by asset ID without bulk signing', async () => {
  const [library, plans, api] = await Promise.all([
    read('../src/pages/user/MediaLibrary.jsx'),
    read('../src/pages/user/MarketingResult.jsx'),
    read('../src/api/mediaApi.js'),
  ]);
  assert.match(library, /<AuthorizedMediaImage[\s\S]*assetId=\{asset\.sourceKind === 'private_storage' \? asset\.id : null\}/);
  assert.match(plans, /plan\.mediaAssets\.map/);
  assert.match(plans, /assetId=\{mediaAsset\.sourceKind === 'private_storage' \? mediaAsset\.id : null\}/);
  assert.match(api, /getAssetAccess: \(id/);
  assert.doesNotMatch(library, /Promise\.all\([^)]*getAssetAccess|assets\.map\([^)]*getAssetAccess/);
});

test('generated and persisted attachment state contains media IDs instead of signed URLs', async () => {
  const [modal, editor, calendar, header, admin, adminRoutes] = await Promise.all([
    read('../src/components/media/SocialImageGeneratorModal.jsx'),
    read('../src/pages/user/QuickEditor.jsx'),
    read('../src/pages/user/ContentCalendar.jsx'),
    read('../src/components/layout/Header.jsx'),
    read('../src/pages/admin/ManageUsers.jsx'),
    read('../../backend/src/routes/adminRoutes.js'),
  ]);
  assert.match(modal, /setGeneratedResult\(\{ mediaAssetId: res\.mediaAssetId/);
  assert.doesNotMatch(modal, /setGeneratedResult\(res\)|generatedResult\.imageUrl/);
  assert.match(editor, /mediaAssetId: attachedImage\?\.mediaAssetId/);
  assert.match(calendar, /assetId=\{selectedPost\.mediaAssetId\}/);
  assert.match(header, /user\?\.avatarMediaAssetId/);
  assert.match(admin, /accessRequest=\{adminApi\.getUserAvatarAccess\}/);
  assert.match(adminRoutes, /router\.get\('\/users\/:id\/avatar-access', requireRole\('admin', 'staff'\)/);
  assert.match(adminRoutes, /router\.use\(requireRole\('admin'\)\)/);
});
