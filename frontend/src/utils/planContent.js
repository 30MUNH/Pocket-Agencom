/**
 * Normalizes marketing plan content fields so that legacy/historical plain-text strings,
 * JSON strings, and structured arrays are uniformly represented as safe arrays.
 */

function parseJsonSafe(val) {
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export function normalizePlanContent(plan) {
  if (!plan || typeof plan !== 'object') {
    return {
      contentIdeas: [],
      videoScripts: [],
      checklist: [],
      seoKeywords: [],
    };
  }

  // 1. contentIdeas
  const rawIdeas = parseJsonSafe(plan.contentIdeas);
  let contentIdeas = [];
  if (Array.isArray(rawIdeas)) {
    contentIdeas = rawIdeas.map((idea, i) => {
      if (typeof idea === 'string') {
        return { title: `Ý tưởng ${i + 1}`, description: idea, channel: 'Đa kênh' };
      }
      return {
        title: idea.title || `Ý tưởng ${i + 1}`,
        description: idea.description || '',
        channel: idea.channel || idea.format || 'Đa kênh',
        ...idea,
      };
    });
  } else if (typeof rawIdeas === 'string' && rawIdeas.trim()) {
    contentIdeas = [
      {
        title: 'Ý tưởng nội dung',
        description: rawIdeas,
        channel: 'Tổng quan',
      },
    ];
  }

  // 2. videoScripts
  const rawScripts = parseJsonSafe(plan.videoScripts);
  let videoScripts = [];
  if (Array.isArray(rawScripts)) {
    videoScripts = rawScripts.map((script, i) => {
      if (typeof script === 'string') {
        return { title: `Kịch bản ${i + 1}`, action: script, scene: i + 1 };
      }
      return {
        title: script.title || `Phân cảnh ${i + 1}`,
        action: script.action || script.content || '',
        visual: script.visual || '',
        audio: script.audio || '',
        ...script,
      };
    });
  } else if (typeof rawScripts === 'string' && rawScripts.trim()) {
    videoScripts = [
      {
        title: 'Kịch bản video',
        action: rawScripts,
        visual: '',
        audio: '',
      },
    ];
  }

  // 3. checklist
  const rawChecklist = parseJsonSafe(plan.checklist);
  let checklist = [];
  if (Array.isArray(rawChecklist)) {
    checklist = rawChecklist.map((item, i) => {
      if (typeof item === 'string') {
        return { id: i + 1, title: item, desc: '', checked: false };
      }
      return {
        id: item.id || i + 1,
        title: item.title || '',
        desc: item.desc || '',
        checked: Boolean(item.checked),
        ...item,
      };
    });
  } else if (typeof rawChecklist === 'string' && rawChecklist.trim()) {
    checklist = [
      {
        id: 1,
        title: rawChecklist,
        desc: '',
        checked: false,
      },
    ];
  }

  // 4. seoKeywords
  const rawKeywords = parseJsonSafe(plan.seoKeywords);
  let seoKeywords = [];
  if (Array.isArray(rawKeywords)) {
    seoKeywords = rawKeywords.map((k) => String(k).trim()).filter(Boolean);
  } else if (typeof rawKeywords === 'string' && rawKeywords.trim()) {
    seoKeywords = [rawKeywords];
  }

  return {
    ...plan,
    contentIdeas,
    videoScripts,
    checklist,
    seoKeywords,
  };
}

export default normalizePlanContent;
