import axios from 'axios';

// VirusTotal API setup
const VT_API_KEY = process.env.VT_API_KEY;
const VT_API_URL = 'https://www.virustotal.com/api/v3';

// In-memory cache for serverless instance (15 min TTL) to stay within free-tier rate limits
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (item && (Date.now() - item.timestamp < CACHE_TTL_MS)) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCached(key, data) {
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

const normalizeUrl = (url) => {
  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'http://' + normalized;
    }
    const parsed = new URL(normalized);
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    if ((parsed.protocol === 'https:' && parsed.port === '443') ||
        (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    parsed.search = parsed.search || '';
    parsed.hash = parsed.hash || '';
    return parsed.toString();
  } catch (e) {
    return url.trim();
  }
};

async function expandUrl(url) {
  const tryExpand = async (method) => {
    try {
      const response = await axios({
        url,
        method,
        maxRedirects: 5,
        timeout: 4000,
        validateStatus: status => status >= 200 && status < 400
      });
      return (
        (response.request?.res?.responseUrl) ||
        (response.request?._redirectable?._currentUrl) ||
        response.config.url ||
        url
      );
    } catch (e) {
      return null;
    }
  };
  
  let expanded = await tryExpand('get');
  if (!expanded || expanded === url) {
    expanded = await tryExpand('head');
  }
  return expanded || url;
}

function calculateSecurityScore(stats) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  if (total === 0) return 50; 
  const score = ((stats.harmless * 100) + (stats.undetected * 50)) / total;
  return Math.max(0, Math.min(100, score - (stats.malicious * 25) - (stats.suspicious * 10)));
}

function determineStatusAndSafety(stats) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  if (stats.malicious > 0) {
    return { status: 'malicious', isSafe: false };
  }
  if (stats.suspicious > 0) {
    return { status: 'suspicious', isSafe: false };
  }
  if (total === 0 || (stats.harmless === 0 && stats.undetected === 0)) {
    return { status: 'unknown', isSafe: false };
  }
  return { status: 'safe', isSafe: true };
}

async function analyzeUrlWithVirusTotal(url) {
  url = normalizeUrl(url);
  try {
    const urlId = Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Check existing analysis first
    try {
      const urlReportResponse = await axios.get(
        `${VT_API_URL}/urls/${urlId}`,
        { headers: { 'x-apikey': VT_API_KEY }, timeout: 4000 }
      );
      
      if (urlReportResponse.data?.data) {
        const urlReport = urlReportResponse.data.data;
        const stats = urlReport.attributes.last_analysis_stats;
        const lastAnalysisResults = urlReport.attributes.last_analysis_results;
        
        const { status, isSafe } = determineStatusAndSafety(stats);

        return {
          url,
          status,
          is_safe: isSafe,
          security_score: calculateSecurityScore(stats),
          stats: {
            malicious: stats.malicious,
            suspicious: stats.suspicious,
            harmless: stats.harmless,
            undetected: stats.undetected
          },
          isHttps: url.startsWith('https://'),
          timestamp: new Date().toISOString(),
          details: lastAnalysisResults,
          note: 'Retrieved from existing VirusTotal analysis'
        };
      }
    } catch (e) { /* Ignore and proceed to new analysis */ }
    
    // Submit for new analysis
    const submitResponse = await axios.post(
      `${VT_API_URL}/urls`,
      new URLSearchParams({ url }).toString(),
      {
        headers: {
          'x-apikey': VT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 4000
      }
    );

    if (!submitResponse.data?.data) {
      throw new Error('Invalid response from VirusTotal submission');
    }

    const analysisId = submitResponse.data.data.id;
    let analysisResponse, analysisStatus;
    let attempts = 0;
    
    // Poll for analysis completion (shortened intervals to remain comfortably below Vercel's timeout)
    while (attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      analysisResponse = await axios.get(
        `${VT_API_URL}/analyses/${analysisId}`,
        { headers: { 'x-apikey': VT_API_KEY }, timeout: 3000 }
      );

      analysisStatus = analysisResponse.data.data.attributes.status;
      if (analysisStatus === 'completed') break;
      attempts++;
    }

    if (analysisStatus !== 'completed') {
      throw new Error('Analysis did not complete in time');
    }

    // Get final report
    const urlReportResponse = await axios.get(
      `${VT_API_URL}/urls/${urlId}`,
      { headers: { 'x-apikey': VT_API_KEY }, timeout: 4000 }
    );

    if (!urlReportResponse.data?.data) {
      throw new Error('Could not retrieve final URL report');
    }

    const urlReport = urlReportResponse.data.data;
    const stats = urlReport.attributes.last_analysis_stats;
    const lastAnalysisResults = urlReport.attributes.last_analysis_results;
    
    const { status, isSafe } = determineStatusAndSafety(stats);

    return {
      url,
      status,
      is_safe: isSafe,
      security_score: calculateSecurityScore(stats),
      stats: {
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        undetected: stats.undetected
      },
      isHttps: url.startsWith('https://'),
      timestamp: new Date().toISOString(),
      details: lastAnalysisResults,
      note: 'Based on new VirusTotal analysis'
    };
  } catch (error) {
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers (Wildcard origin without credentials per W3C specification)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ 
      error: 'URL is required',
      status: 'unknown',
      is_safe: false,
      security_score: 0,
      timestamp: new Date().toISOString(),
      stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }
    });
  }

  const normalizedUrl = normalizeUrl(url);

  // Check cache first to save VirusTotal quota
  const cachedReport = getCached(normalizedUrl);
  if (cachedReport) {
    return res.status(200).json(cachedReport);
  }

  let expandedUrl = normalizedUrl;
  try {
    expandedUrl = await expandUrl(normalizedUrl);
  } catch (e) {
    // Ignore expansion failures
  }

  try {
    new URL(expandedUrl);
    
    let securityReport = {
      url: expandedUrl,
      status: 'safe',
      is_safe: true,
      security_score: 100,
      isHttps: expandedUrl.startsWith('https://'),
      timestamp: new Date().toISOString(),
      stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }
    };
    
    if (VT_API_KEY) {
      securityReport = await analyzeUrlWithVirusTotal(expandedUrl);
    } else {
      securityReport.note = 'VirusTotal API key not configured. Using basic checks only.';
      securityReport.security_score = expandedUrl.startsWith('https://') ? 70 : 30;
      securityReport.status = expandedUrl.startsWith('https://') ? 'safe' : 'suspicious';
    }
    
    // Cache the report
    setCached(normalizedUrl, securityReport);
    if (expandedUrl !== normalizedUrl) {
      setCached(expandedUrl, securityReport);
    }

    res.status(200).json(securityReport);
  } catch (error) {
    console.error('URL check error:', error.message);
    res.status(400).json({ 
      error: 'Invalid URL or processing error',
      message: error.message,
      url: expandedUrl,
      status: 'unknown',
      is_safe: false,
      security_score: 0,
      timestamp: new Date().toISOString(),
      stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }
    });
  }
}
