const URL_PATTERN = /https?:\/\/[^\s"'<>\])}]+/gi;
const IMAGE_MARKER = /\[IMAGE_URL:\s*([^\s\]]+)\]/gi;
const PLAN_FIELDS = ['contentIdeas', 'videoScripts', 'checklist', 'playbook', 'seoKeywords', 'budgetBreakdown', 'deploymentChannels', 'existingResources', 'campaignReason', 'goal'];

function classifyUrl(value, options = {}) {
  if (typeof value !== 'string' || !value.trim()) return 'unresolved';
  let parsed;
  try { parsed = new URL(value); } catch { return 'malformed'; }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return 'malformed';
  if (options.supabaseProjectHost && parsed.hostname.toLowerCase() === options.supabaseProjectHost.toLowerCase()) {
    const parts = parsed.pathname.split('/').filter(Boolean).map((part) => {
      try { return decodeURIComponent(part); } catch { return ''; }
    });
    if (parts[0] === 'storage' && parts[1] === 'v1' && parts[2] === 'object') {
      const bucket = parts[4];
      return bucket && Array.isArray(options.buckets) && options.buckets.includes(bucket)
        ? 'internal_storage_candidate'
        : 'unresolved_internal_url';
    }
    return 'unresolved_internal_url';
  }
  return 'external_url_candidate';
}

function addUrlReferences(references, { recordType, recordId, field, value, options }) {
  if (typeof value !== 'string' || !value.trim()) return;
  const add = (url, suffix = '') => references.push({
    recordType,
    recordId: String(recordId),
    field: `${field}${suffix}`,
    classification: classifyUrl(url, options),
  });
  if (value.startsWith('http://') || value.startsWith('https://')) add(value);
  let marker;
  IMAGE_MARKER.lastIndex = 0;
  while ((marker = IMAGE_MARKER.exec(value))) add(marker[1], '[IMAGE_URL]');
  let match;
  URL_PATTERN.lastIndex = 0;
  while ((match = URL_PATTERN.exec(value))) {
    if (!value.startsWith(match[0])) add(match[0], '[embedded URL]');
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') addStructuredUrls(references, parsed, { recordType, recordId, field, options });
  } catch { /* plain text remains scanned as URLs */ }
}

function addStructuredUrls(references, value, context, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string') {
      if (/url|image|asset|media|attachment|file/i.test(key)) {
        addUrlReferences(references, { ...context, field: context.field, value: child });
      } else if (child.startsWith('http://') || child.startsWith('https://')) {
        addUrlReferences(references, { ...context, field: context.field, value: child });
      }
    } else if (child && typeof child === 'object') {
      addStructuredUrls(references, child, context, seen);
    }
  }
}

function auditRecords(records = {}, options = {}) {
  const references = [];
  const groups = [
    ['users', 'User', ['avatarUrl']],
    ['scheduledPosts', 'ScheduledPost', ['imageUrl', 'content']],
    ['businessProfiles', 'BusinessProfile', ['fileUrl', 'previewImage']],
    ['templates', 'Template', ['fileUrl', 'previewImage']],
  ];
  for (const [collection, recordType, fields] of groups) {
    for (const record of records[collection] || []) {
      for (const field of fields) {
        const value = record[field];
        addUrlReferences(references, {
          recordType, recordId: record.id, field: `${recordType}.${field}`, value, options,
        });
      }
    }
  }
  for (const user of records.users || []) {
    if (user.avatarMediaAssetId != null) references.push({ recordType: 'User', recordId: String(user.id), field: 'User.avatarMediaAssetId', classification: 'asset_id_reference' });
  }
  for (const post of records.scheduledPosts || []) {
    if (post.mediaAssetId != null) references.push({ recordType: 'ScheduledPost', recordId: String(post.id), field: 'ScheduledPost.mediaAssetId', classification: 'asset_id_reference' });
  }
  for (const plan of records.marketingPlans || []) {
    for (const field of PLAN_FIELDS) {
      addUrlReferences(references, {
        recordType: 'MarketingPlan', recordId: plan.id,
        field: `MarketingPlan.${field}`, value: plan[field], options,
      });
    }
  }
  for (const relation of records.marketingPlanAssets || []) {
    references.push({ recordType: 'MarketingPlanAsset', recordId: String(relation.marketingPlanId), field: 'MarketingPlanAsset.mediaAssetId', classification: 'asset_id_reference' });
  }
  const mediaAssets = (records.mediaAssets || []).map((asset) => ({
    id: String(asset.id),
    userId: String(asset.userId),
    classification: 'legacy_unverified',
    urlClassification: classifyUrl(asset.url, options),
  }));
  return { references, mediaAssets };
}

module.exports = { auditRecords, classifyUrl };
