import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all fake alert() calls are eliminated across frontend source files', async () => {
  const filesToCheck = [
    'src/pages/public/LandingPage.jsx',
    'src/pages/admin/ManageUsers.jsx',
    'src/pages/user/BusinessProfile.jsx',
    'src/pages/user/UserSettings.jsx',
    'src/pages/user/MarketingResult.jsx',
    'src/components/settings/SocialLinkManager.jsx',
  ];

  for (const file of filesToCheck) {
    const source = await read(file);
    assert.doesNotMatch(source, /\balert\s*\(/, `${file} should not contain raw alert() calls`);
  }
});

test('MarketingResult implements genuine markdown plan file export', async () => {
  const source = await read('src/pages/user/MarketingResult.jsx');
  assert.match(source, /handleExportPlan/);
  assert.match(source, /text\/markdown/);
  assert.match(source, /toast\.success/);
});

test('TemplateLibrary provides interactive preview and Quick Editor navigation', async () => {
  const source = await read('src/pages/user/TemplateLibrary.jsx');
  assert.match(source, /previewTemplate/);
  assert.match(source, /handleUseTemplate/);
  assert.match(source, /\/user\/quick-editor/);
});

test('ManageUsers is wired to adminApi and supports user details modal and role edit', async () => {
  const source = await read('src/pages/admin/ManageUsers.jsx');
  assert.match(source, /adminApi\.getUsers/);
  assert.match(source, /adminApi\.updateUserStatus/);
  assert.match(source, /adminApi\.updateUserRole/);
  assert.doesNotMatch(source, /INITIAL_USERS/);
});

test('UserSettings implements password change and notification toggles', async () => {
  const source = await read('src/pages/user/UserSettings.jsx');
  assert.match(source, /authApi\.changePassword/);
  assert.match(source, /currentPassword/);
  assert.match(source, /newPassword/);
  assert.match(source, /notifSettings/);
  assert.doesNotMatch(source, /\(Đang phát triển\)/);
});

test('ContentCalendar supports creating, editing, and deleting posts via scheduledPostApi', async () => {
  const source = await read('src/pages/user/ContentCalendar.jsx');
  assert.match(source, /handleOpenCreateModal/);
  assert.match(source, /handleOpenEditModal/);
  assert.match(source, /handleDeletePost/);
  assert.match(source, /scheduledPostApi\.createPost/);
  assert.match(source, /scheduledPostApi\.updatePost/);
});

test('MediaLibrary provides large preview lightbox modal with download and copy', async () => {
  const source = await read('src/pages/user/MediaLibrary.jsx');
  assert.match(source, /previewAsset/);
  assert.match(source, /Media Lightbox Preview Modal/);
  assert.match(source, /handleCopyUrl/);
});
