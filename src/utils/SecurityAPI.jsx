// Security API integration utility
// This file now calls our real backend server instead of using mock data

// API for security checks and reports

// Base URL for API calls - use environment variable or default to local development
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' // Production: relative path on same domain
  : 'http://localhost:3001/api'; // Development: local server

/**
 * Fetches a comprehensive security report for the given URL
 * @param {string} url - The URL to check
 * @returns {Promise<Object>} - The security report
 */
export const getComprehensiveSecurityReport = async (url) => {
  console.log('===== START SECURITY CHECK =====');
  console.log(`SecurityAPI: Checking URL: ${url}`);
  
  try {
    // Validate URL before sending to API
    if (!url || typeof url !== 'string' || !url.trim()) {
      console.error('SecurityAPI: Invalid URL provided:', url);
      return createErrorReport('Invalid URL provided', url);
    }
    
    // Normalize URL if needed
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      console.log(`SecurityAPI: Normalized URL to: ${url}`);
    }
    
    // Make API call to backend security service
    console.log(`SecurityAPI: Sending request to: ${API_BASE_URL}/security/check-url`);
    const response = await fetch(`${API_BASE_URL}/security/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    console.log('SecurityAPI: Response status:', response.status);
    
    if (!response.ok) {
      console.error('SecurityAPI error:', response.statusText);
      return createErrorReport(`API error: ${response.statusText}`, url);
    }

    // Get the response data
    let data;
    try {
      data = await response.json();
      console.log('SecurityAPI: Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('SecurityAPI: Failed to parse response as JSON:', parseError);
      return createErrorReport('Invalid response format', url);
    }
    
    // Process the response to ensure all required fields are present
    const enhancedData = {
      ...data,
      url: data.url || url,
      status: data.status || 'unknown',
      is_safe: data.is_safe !== undefined ? data.is_safe : false,
      security_score: data.security_score || 0,
      stats: data.stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0
      },
      timestamp: data.timestamp || new Date().toISOString(),
      // Add a summary field that will be used by the SecurityReport component
      summary: getSummaryFromStatus(data.status, data.stats)
    };
    
    console.log('SecurityAPI: Enhanced data:', JSON.stringify(enhancedData, null, 2));
    console.log('===== END SECURITY CHECK =====');
    
    return enhancedData;
  } catch (error) {
    console.error('SecurityAPI: Request failed:', error);
    return createErrorReport(`Request failed: ${error.message}`, url);
  }
};

/**
 * Generate a summary message based on status and stats
 */
function getSummaryFromStatus(status, stats) {
  console.log('Generating summary for status:', status, 'with stats:', stats);
  
  if (!status) {
    console.log('No status provided, returning default message');
    return "Unable to determine security status";
  }
  
  let summary = '';
  switch(status) {
    case 'safe':
      summary = `This URL appears to be safe (${stats?.harmless || 0} security vendors confirm)`;
      break;
    case 'suspicious':
      summary = `This URL has been flagged as suspicious by ${stats?.suspicious || 0} security vendors`;
      break;
    case 'malicious':
      summary = `WARNING: This URL has been identified as malicious by ${stats?.malicious || 0} security vendors`;
      break;
    case 'unknown':
    default:
      summary = "Unable to determine security status - exercise caution";
      break;
  }
  
  console.log('Generated summary:', summary);
  return summary;
}

/**
 * Create a standardized error report
 * @param {string} message - Error message
 * @param {string} url - The URL that was checked
 * @returns {Object} - Standardized error report
 */
function createErrorReport(message, url) {
  const report = {
    url,
    status: 'unknown',
    is_safe: false,
    security_score: 0,
    error: message,
    errorDetails: 'An error occurred during security analysis. Please try again.',
    timestamp: new Date().toISOString(),
    stats: {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0
    },
    summary: "Unable to determine security status - exercise caution"
  };
  
  console.log('SecurityAPI: Created error report:', JSON.stringify(report, null, 2));
  console.log('===== END SECURITY CHECK (ERROR) =====');
  return report;
}

/**
 * Helper function to create standardized phishing risk message
 * @param {Object} report - The security report
 * @returns {string} - Phishing risk message
 */
export const getPhishingRiskMessage = (report) => {
  if (report.error) {
    return 'Unable to analyze phishing risk due to an error';
  }
  
  if (report.status === 'malicious') {
    return 'High risk: This URL has been flagged as malicious';
  }
  
  if (report.status === 'suspicious') {
    return 'Medium risk: This URL shows suspicious characteristics';
  }
  
  if (!report.is_safe) {
    return 'High risk: This URL may be a phishing attempt';
  }
  
  if (report.security_score < 50) {
    return 'Medium risk: This URL shows some suspicious characteristics';
  }
  
  if (report.security_score < 80) {
    return 'Low risk: This URL appears mostly safe but exercise caution';
  }
  
  return 'Minimal risk: No phishing indicators detected';
};

/**
 * Helper function to generate color code based on security score
 * @param {number} score - Security score (0-100)
 * @returns {string} - CSS color code
 */
export const getSecurityScoreColor = (score) => {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning-dark)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
};