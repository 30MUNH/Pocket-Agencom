const test = require('node:test');
const assert = require('node:assert/strict');
const { validateExternalMediaUrl } = require('../src/services/externalMediaUrl');
const options = { supabaseUrl: 'https://abc-project.supabase.co', internalBuckets: ['campaign-assets', 'avatars', 'campaign-assets-private', 'avatars-private'] };

test('accepts and canonicalizes HTTP and HTTPS external URLs', () => {
  assert.equal(validateExternalMediaUrl(' HTTPS://Images.Example.com:443/a/../photo.webp ', options), 'https://images.example.com/photo.webp');
  assert.equal(validateExternalMediaUrl('http://cdn.example/photo.png', options), 'http://cdn.example/photo.png');
});

test('rejects unsupported schemes credentials invalid encoding and controls', () => {
  for (const value of ['javascript:alert(1)', 'data:image/png;base64,abc', 'https://user:pass@images.example/x', 'https://images.example/%zz', 'https://images.example/a%2fb', 'https://images.example/ok\nhttps://evil.test']) {
    assert.throws(() => validateExternalMediaUrl(value, options), { statusCode: 400 });
  }
});

test('rejects Supabase public signed authenticated and encoded bucket object URLs', () => {
  for (const flavor of ['public', 'sign', 'authenticated']) {
    assert.throws(() => validateExternalMediaUrl(`https://abc-project.supabase.co/storage/v1/object/${flavor}/campaign-assets/user-8/a.png?token=abc`, options), { statusCode: 400 });
  }
  assert.throws(() => validateExternalMediaUrl('https://abc-project.supabase.co/storage/v1/object/public/%63ampaign-assets/a.png', options), { statusCode: 400 });
  assert.throws(() => validateExternalMediaUrl('https://abc-project.supabase.co/%73torage/v1/object/public/campaign-assets/a.png', options), { statusCode: 400 });
});

test('does not accept an internal URL from another Supabase host or infer ownership by user prefix', () => {
  assert.throws(() => validateExternalMediaUrl('https://abc-project.supabase.co/storage/v1/object/public/campaign-assets/user-12/a.png', options), { statusCode: 400 });
  assert.equal(validateExternalMediaUrl('https://abc-project.supabase.co.evil.test/storage/v1/object/public/campaign-assets/a.png', options), 'https://abc-project.supabase.co.evil.test/storage/v1/object/public/campaign-assets/a.png');
  assert.equal(validateExternalMediaUrl('https://abc-project.supabase.co:8443/storage/v1/object/public/campaign-assets/a.png', options), 'https://abc-project.supabase.co:8443/storage/v1/object/public/campaign-assets/a.png');
});
