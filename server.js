import express from 'express';
import cors from 'cors';
import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Configure environment variables
dotenv.config();

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// VirusTotal API setup
const VT_API_KEY = process.env.VT_API_KEY;
const VT_API_URL = 'https://www.virustotal.com/api/v3';

if (!VT_API_KEY) {
  console.warn('VirusTotal API key not found. Security analysis will not work properly.');
}

const normalizeUrl = (url) => {
  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'http://' + normalized;
    }
    const parsed = new URL(normalized);
    // Lowercase the hostname
    parsed.hostname = parsed.hostname.toLowerCase();
    // Remove trailing slash from pathname (unless it's just '/')
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    // Remove default ports
    if ((parsed.protocol === 'https:' && parsed.port === '443') ||
        (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    // Remove empty search/hash
    parsed.search = parsed.search || '';
    parsed.hash = parsed.hash || '';
    return parsed.toString();
  } catch (e) {
    return url.trim();
  }
};

// Helper to expand short URLs by following redirects (robust version)
async function expandUrl(url) {
  const tryExpand = async (method) => {
    try {
      const response = await axios({
        url,
        method,
        maxRedirects: 5,
        timeout: 5000,
        validateStatus: status => status >= 200 && status < 400 // Accept redirects
      });
      // Log all possible fields for debugging
      console.log(`[expandUrl] ${method} response.config.url:`, response.config.url);
      if (response.request) {
        if (response.request.res) {
          console.log(`[expandUrl] ${method} response.request.res.responseUrl:`, response.request.res.responseUrl);
        }
        if (response.request._redirectable) {
          console.log(`[expandUrl] ${method} response.request._redirectable._currentUrl:`, response.request._redirectable._currentUrl);
        }
      }
      // Try to get the most reliable final URL
      return (
        (response.request && response.request.res && response.request.res.responseUrl) ||
        (response.request && response.request._redirectable && response.request._redirectable._currentUrl) ||
        response.config.url ||
        url
      );
    } catch (e) {
      console.warn(`[expandUrl] ${method} failed:`, e.message);
      return null;
    }
  };
  // Try GET first, then HEAD
  let expanded = await tryExpand('get');
  if (!expanded || expanded === url) {
    expanded = await tryExpand('head');
  }
  if (!expanded) {
    console.warn('[expandUrl] All expansion attempts failed, using original:', url);
    return url;
  }
  // If the expanded URL is still the same as the input, log a warning
  if (expanded === url) {
    console.warn('[expandUrl] Expanded URL is the same as input, may not have followed redirect:', url);
  }
  return expanded;
}

// Helper function to analyze a URL with VirusTotal
async function analyzeUrlWithVirusTotal(url) {
  url = normalizeUrl(url);
  try {
    console.log(`Analyzing URL with VirusTotal: ${url}`);
    
    // First, check if the URL has already been analyzed
    const urlId = Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    console.log('URL ID for lookup:', urlId);
    
    // Try to get the report directly first
    try {
      console.log('Checking if URL has existing analysis...');
      const urlReportResponse = await axios.get(
        `${VT_API_URL}/urls/${urlId}`,
        {
          headers: {
            'x-apikey': VT_API_KEY
          }
        }
      );
      
      if (urlReportResponse.data?.data) {
        const urlReport = urlReportResponse.data.data;
        const stats = urlReport.attributes.last_analysis_stats;
        const lastAnalysisResults = urlReport.attributes.last_analysis_results;
        
        console.log('Analysis stats from existing report:', stats);
        
        // More accurate status determination
        let status = 'safe';
        if (stats.malicious > 0) {
          status = 'malicious';
        } else if (stats.suspicious > 0) {
          status = 'suspicious';
        }

        return {
          url,
          status,
          is_safe: stats.malicious === 0 && stats.suspicious === 0,
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
    } catch (existingReportError) {
      console.log('No existing report found, submitting for new analysis:', existingReportError.message);
    }
    
    // Submit URL for new analysis
    console.log('Submitting URL for new analysis...');
    const submitResponse = await axios.post(
      `${VT_API_URL}/urls`,
      new URLSearchParams({ url }).toString(),
      {
        headers: {
          'x-apikey': VT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!submitResponse.data?.data) {
      throw new Error('Invalid response from VirusTotal submission');
    }

    const analysisId = submitResponse.data.data.id;
    console.log(`Analysis ID: ${analysisId}`);

    // Poll for analysis completion with increased timeout
    let analysisResponse;
    let status;
    let attempts = 0;
    const maxAttempts = 10; // Increased from 5 to 10
    const pollInterval = 3000; // Increased from 2000 to 3000ms

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      analysisResponse = await axios.get(
        `${VT_API_URL}/analyses/${analysisId}`,
        { headers: { 'x-apikey': VT_API_KEY } }
      );
      
      status = analysisResponse.data.data.attributes.status;
      console.log(`Poll ${attempts + 1}: Analysis status = ${status}`);
      
      if (status === 'completed') {
        break;
      }
      
      attempts++;
    }

    if (status !== 'completed') {
      throw new Error('Analysis did not complete in time');
    }

    // Get the final URL report
    const urlReportResponse = await axios.get(
      `${VT_API_URL}/urls/${urlId}`,
      {
        headers: {
          'x-apikey': VT_API_KEY
        }
      }
    );

    if (!urlReportResponse.data?.data) {
      throw new Error('Could not retrieve final URL report');
    }

    const urlReport = urlReportResponse.data.data;
    const stats = urlReport.attributes.last_analysis_stats;
    const lastAnalysisResults = urlReport.attributes.last_analysis_results;
    
    console.log('Final analysis stats:', stats);
    
    // More accurate status determination
    status = 'safe';
    if (stats.malicious > 0) {
      status = 'malicious';
    } else if (stats.suspicious > 0) {
      status = 'suspicious';
    }

    return {
      url,
      status,
      is_safe: stats.malicious === 0 && stats.suspicious === 0,
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
    console.error('VirusTotal API error:', error.message);
    if (error.response) {
      console.error('API response error details:', JSON.stringify(error.response.data || {}));
    }
    throw error; // Propagate the error instead of returning mock data
  }
}

// Create a mock analysis when the API fails
function createMockAnalysis(url, errorMessage) {
  console.log('Creating mock analysis for URL:', url);
  
  // Determine a minimal risk assessment based on URL characteristics
  const isHttps = url.startsWith('https://');
  const hasStrangeDomain = /[0-9]{4,}|xn--|[a-z0-9]{15,}/.test(url);
  const hasCommonTLD = /\.(com|org|net|edu|gov|io)$/i.test(url);
  const hasUncommonTLD = /\.(xyz|info|biz|club|ru|tk|cn|ga)$/i.test(url);
  const hasLongDomainName = /\/[^/]{30,}/.test(url);
  const hasSuspiciousKeywords = /(free|win|prize|congrat|urgent|verify|account|click)/i.test(url);
  
  // Better heuristic scoring for mock data
  let suspiciousPoints = 0;
  let mockStatus = 'unknown';
  let mockScore = 50;
  
  // Add points for suspicious characteristics
  if (!isHttps) suspiciousPoints += 2;
  if (hasStrangeDomain) suspiciousPoints += 2;
  if (!hasCommonTLD) suspiciousPoints += 1;
  if (hasUncommonTLD) suspiciousPoints += 2;
  if (hasLongDomainName) suspiciousPoints += 1;
  if (hasSuspiciousKeywords) suspiciousPoints += 2;
  
  // Determine mock status based on points
  if (suspiciousPoints >= 4) {
    mockStatus = 'suspicious';
    mockScore = 30 + Math.floor(Math.random() * 20); // 30-50
  } else if (suspiciousPoints >= 2) {
    mockStatus = 'suspicious';
    mockScore = 50 + Math.floor(Math.random() * 10); // 50-60
  } else if (isHttps && (hasCommonTLD || !hasUncommonTLD)) {
    mockStatus = 'safe';
    mockScore = 70 + Math.floor(Math.random() * 20); // 70-90
  }
  
  // Generate mock stats
  const harmlessCount = mockStatus === 'safe' ? 
    Math.floor(Math.random() * 30) + 40 : 
    Math.floor(Math.random() * 20) + 10;
  
  const suspiciousCount = mockStatus === 'suspicious' ? 
    Math.floor(Math.random() * 5) + 1 : 0;
  
  const maliciousCount = mockStatus === 'malicious' ? 
    Math.floor(Math.random() * 5) + 1 : 0;
  
  const undetectedCount = 100 - harmlessCount - suspiciousCount - maliciousCount;
  
  return {
    url,
    status: mockStatus,
    is_safe: mockStatus === 'safe',
    security_score: mockScore,
    error: 'Error analyzing URL with VirusTotal',
    errorDetails: errorMessage,
    isHttps,
    timestamp: new Date().toISOString(),
    stats: {
      malicious: maliciousCount,
      suspicious: suspiciousCount,
      harmless: harmlessCount,
      undetected: undetectedCount
    },
    note: 'Simulated results - VirusTotal API unavailable',
    is_simulated: true
  };
}

// Helper function to calculate security score (0-100)
function calculateSecurityScore(stats) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
  if (total === 0) return 50; // Default score if no results
  
  // Weighted calculation: harmless contributes positively, malicious and suspicious negatively
  const score = ((stats.harmless * 100) + (stats.undetected * 50)) / total;
  
  // Scale the score (0-100), with heavy penalty for malicious detections
  return Math.max(0, Math.min(100, score - (stats.malicious * 25) - (stats.suspicious * 10)));
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Fixed API endpoint to match what frontend expects
app.post('/api/security/check-url', async (req, res) => {
  console.log('Received request to check URL security:', req.body);
  const { url } = req.body;
  const normalizedUrl = normalizeUrl(url);
  console.log('[Backend] Normalized URL received:', normalizedUrl);
  
  // Expand the URL (follow redirects)
  let expandedUrl = normalizedUrl;
  try {
    expandedUrl = await expandUrl(normalizedUrl);
    console.log('[Backend] Expanded (final) URL:', expandedUrl);
  } catch (e) {
    console.warn('URL expansion error:', e.message);
  }

  if (!url) {
    console.error('URL is required but was not provided');
    return res.status(400).json({ 
      error: 'URL is required',
      status: 'unknown',
      is_safe: false,
      security_score: 0,
      timestamp: new Date().toISOString(),
      stats: {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0
      }
    });
  }
  
  try {
    // Check if URL is valid
    new URL(expandedUrl);
    console.log('URL is valid:', expandedUrl);
    
    // Basic URL security check
    let securityReport = {
      url: expandedUrl,
      status: 'safe',
      is_safe: true,
      security_score: 100,
      isHttps: expandedUrl.startsWith('https://'),
      timestamp: new Date().toISOString(),
      stats: {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0
      }
    };
    
    // VirusTotal analysis if API key is available
    if (VT_API_KEY) {
      console.log('Using VirusTotal API for analysis');
      securityReport = await analyzeUrlWithVirusTotal(expandedUrl);
      console.log('VirusTotal analysis complete:', securityReport.status);
    } else {
      console.warn('VirusTotal API key not configured. Using basic checks only.');
      securityReport.note = 'VirusTotal API key not configured. Using basic checks only.';
      securityReport.security_score = expandedUrl.startsWith('https://') ? 70 : 30;
      securityReport.status = expandedUrl.startsWith('https://') ? 'safe' : 'suspicious';
    }
    
    console.log('Sending security report:', securityReport.status);
    res.json(securityReport);
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
      stats: {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
}); 