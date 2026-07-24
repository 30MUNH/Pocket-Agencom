const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Converts formatted metric numbers (e.g., "15.2K", "1.5M", "250.000", "4.9") to numeric values.
 */
function parseFormattedNumber(rawStr) {
  if (!rawStr) return null;
  const cleaned = String(rawStr).trim().replace(/,/g, '');

  // Handle K, M, B multipliers
  const matchMultiplier = cleaned.match(/^([\d.]+)\s*([KkMmBb])?$/i);
  if (matchMultiplier) {
    const num = parseFloat(matchMultiplier[1]);
    if (isNaN(num)) return null;
    const unit = (matchMultiplier[2] || '').toUpperCase();
    if (unit === 'K') return Math.round(num * 1000);
    if (unit === 'M') return Math.round(num * 1000000);
    if (unit === 'B') return Math.round(num * 1000000000);
    return num;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Regex-based parser for text strings (e.g. og:description, JSON-LD, or DOM snippets).
 */
function parseMetricsFromText(text = '') {
  if (!text || typeof text !== 'string') return {};

  const metrics = {};

  // Extract Followers / Người theo dõi
  const followersMatch = text.match(/([\d.,]+[KkMmBb]?)\s*(?:Followers|Follower|người theo dõi|Follow|người theo dõi kênh)/i);
  if (followersMatch) {
    const parsed = parseFormattedNumber(followersMatch[1]);
    if (parsed !== null) metrics.followers = parsed;
  }

  // Extract Likes / Lượt thích
  const likesMatch = text.match(/([\d.,]+[KkMmBb]?)\s*(?:Likes|Like|lượt thích|thích|Luot thich)/i);
  if (likesMatch) {
    const parsed = parseFormattedNumber(likesMatch[1]);
    if (parsed !== null) metrics.likes = parsed;
  }

  // Extract Rating / Đánh giá
  const ratingMatch = text.match(/([\d.]+)\s*(?:\/5|\/5\.0|sao|star|đánh giá|rating)/i);
  if (ratingMatch) {
    const parsed = parseFloat(ratingMatch[1]);
    if (!isNaN(parsed) && parsed <= 5) metrics.rating = parsed;
  }

  // Extract Engagement Rate / ER
  const erMatch = text.match(/([\d.]+)\s*%\s*(?:ER|Engagement|tương tác)/i);
  if (erMatch) {
    const parsed = parseFloat(erMatch[1]);
    if (!isNaN(parsed)) metrics.engagementRate = parsed;
  }

  // Extract GMV / Total Revenue
  const gmvMatch = text.match(/([\d.,]+[KkMmBb]?)\s*(?:₫|VND|VNĐ|doanh số|GMV|Revenue|doanh thu)/i);
  if (gmvMatch) {
    const parsed = parseFormattedNumber(gmvMatch[1]);
    if (parsed !== null) metrics.gmv = parsed;
  }

  return metrics;
}

/**
 * Scrapes public metrics from a platform URL.
 * Uses 3rd-party Scraping API (ScrapingAnt / ScrapingBee) when SCRAPING_API_KEY is configured,
 * with direct Open Graph fetch fallback. Returns `{}` on failure without server crash.
 * 
 * @param {string} targetUrl - Platform link to scrape
 * @returns {Promise<Object>} Extracted metrics JSON object e.g. { followers: 15000, likes: 3000 }
 */
async function scrapePublicMetrics(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return {};
  }

  const apiKey = process.env.SCRAPING_API_KEY;
  const scrapingApiEndpoint = process.env.SCRAPING_API_ENDPOINT || 'https://api.scrapingant.com/v2/general';
  
  let htmlContent = '';

  try {
    if (apiKey) {
      console.log(`[ScraperService] Attempting Scraping API fetch for: ${targetUrl}`);
      const response = await axios.get(scrapingApiEndpoint, {
        params: {
          url: targetUrl,
          'x-api-key': apiKey,
          browser: 'true',
        },
        timeout: 15000,
      });
      htmlContent = response.data || '';
    } else {
      console.log(`[ScraperService] No SCRAPING_API_KEY set. Falling back to direct metadata fetch for: ${targetUrl}`);
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 8000,
      });
      htmlContent = response.data || '';
    }
  } catch (err) {
    console.warn(`[ScraperService Warning] Scraping fetch failed for ${targetUrl}:`, err.message);
    // Return empty object on network error or bot detection to handle gracefully
    return {};
  }

  if (!htmlContent || typeof htmlContent !== 'string') {
    return {};
  }

  try {
    const $ = cheerio.load(htmlContent);

    // Collect metadata descriptions and titles
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const pageTitle = $('title').text() || '';

    // Extract potential script JSON-LD blocks
    let jsonLdText = '';
    $('script[type="application/ld+json"]').each((_, el) => {
      jsonLdText += $(el).html() + ' ';
    });

    // Combine metadata text sources
    const combinedText = `${ogDescription} ${twitterDescription} ${metaDescription} ${ogTitle} ${pageTitle} ${jsonLdText}`;

    // Parse metrics using Regex
    const parsedMetrics = parseMetricsFromText(combinedText);

    // Also check DOM elements for direct numbers if metadata wasn't exhaustive
    if (!parsedMetrics.followers) {
      $('[class*="follower"], [id*="follower"], [data-e2e*="followers-count"]').each((_, el) => {
        const text = $(el).text();
        const found = parseMetricsFromText(text + ' followers');
        if (found.followers) parsedMetrics.followers = found.followers;
      });
    }

    if (!parsedMetrics.likes) {
      $('[class*="like"], [id*="like"], [data-e2e*="likes-count"]').each((_, el) => {
        const text = $(el).text();
        const found = parseMetricsFromText(text + ' likes');
        if (found.likes) parsedMetrics.likes = found.likes;
      });
    }

    console.log(`[ScraperService Success] Parsed metrics for ${targetUrl}:`, parsedMetrics);
    return parsedMetrics;
  } catch (err) {
    console.error(`[ScraperService Error] HTML parsing failed for ${targetUrl}:`, err.message);
    return {};
  }
}

module.exports = {
  parseFormattedNumber,
  parseMetricsFromText,
  scrapePublicMetrics,
};
