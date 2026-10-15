const { AppError } = require('../middleware/errorHandler');

function configuredSupabaseHost(supabaseUrl) {
  if (!supabaseUrl) return null;
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.host.toLowerCase();
  } catch {
    return null;
  }
}

function isSupabaseStorageObject(parsed, expectedHost) {
  let segments;
  try { segments = parsed.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part)); }
  catch { return true; }
  if (segments.length < 4 || segments[0] !== 'storage' || segments[1] !== 'v1' || segments[2] !== 'object') return false;
  const knownSupabaseDomain = parsed.hostname.toLowerCase().endsWith('.supabase.co');
  if (parsed.host.toLowerCase() !== expectedHost && !knownSupabaseDomain) return false;
  // All Supabase Storage object flavors are internal. Decode bucket exactly once
  // so encoded bucket spellings cannot evade the origin/path check.
  try {
    const bucket = decodeURIComponent(segments[4] || segments[3] || '');
    return Boolean(bucket);
  } catch {
    return true;
  }
}

function validateExternalMediaUrl(input, options = {}) {
  if (typeof input !== 'string' || !input.trim() || /[\u0000-\u001f\u007f\\]/.test(input)) {
    throw new AppError('A valid external HTTP or HTTPS media URL is required.', 400);
  }
  const raw = input.trim();
  if (/%(?![0-9a-f]{2})/i.test(raw)) throw new AppError('The media URL contains invalid encoding.', 400);
  let parsed;
  try { parsed = new URL(raw); } catch { throw new AppError('A valid external HTTP or HTTPS media URL is required.', 400); }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new AppError('Only credential-free HTTP or HTTPS media URLs are supported.', 400);
  }
  if (isSupabaseStorageObject(parsed, configuredSupabaseHost(options.supabaseUrl ?? process.env.SUPABASE_URL))) {
    throw new AppError('Supabase Storage URLs cannot be registered as external media.', 400);
  }
  try {
    const segments = parsed.pathname.split('/');
    for (const segment of segments) {
      const decoded = decodeURIComponent(segment);
      if (/[\\/\u0000-\u001f\u007f]/.test(decoded) || decoded === '.' || decoded === '..' || /%(?:2f|5c)/i.test(decoded)) {
        throw new Error('unsafe path');
      }
    }
  } catch {
    throw new AppError('The media URL contains an unsafe path encoding.', 400);
  }
  parsed.hash = '';
  return parsed.href;
}

module.exports = { validateExternalMediaUrl, isSupabaseStorageObject };
