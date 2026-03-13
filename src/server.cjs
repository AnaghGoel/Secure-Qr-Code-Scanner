// Backend server implementation for security API integrations
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Simple URL cache to prevent excessive API calls
const urlCache = new Map();
const CACHE_TTL = 1800000; // 30 minutes in milliseconds

// Security checking endpoint
app.post('/api/security/check-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    // Check cache first
    if (urlCache.has(url)) {
      const cachedData = urlCache.get(url);
      if (Date.now() < cachedData.expiry) {
        console.log(`Using cached result for ${url}`);
        return res.json(cachedData.data);
      }
      // Cache expired
      urlCache.delete(url);
    }

    // Get VirusTotal API key
    const VT_API_KEY = process.env.VT_API_KEY;
    
    if (!VT_API_KEY) {
      return res.status(500).json({ 
        error: 'VirusTotal API key not configured',
        status: 'unknown',
        summary: 'Security check unavailable - API key not configured'
      });
    }

    console.log(`Checking security for URL: ${url}`);

    // Analyze HTTP vs HTTPS
    const isHttps = url.toLowerCase().startsWith("https://");
    const protocolSecurity = {
      secure: isHttps,
      details: isHttps 
        ? "This URL uses HTTPS, which encrypts data between your browser and the website."
        : "Warning: This URL uses HTTP, which is not secure. Data sent to this website could be intercepted."
    };

    // Submit URL to VirusTotal for analysis
    const vtSubmitResponse = await axios.post('https://www.virustotal.com/api/v3/urls', 
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-apikey': VT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Get the analysis ID from the response
    const analysisId = vtSubmitResponse.data.data.id;
    
    // Small delay to allow VirusTotal to process the URL
    // In production, you might want to implement polling or webhooks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get analysis results
    const vtAnalysisResponse = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: {
          'x-apikey': VT_API_KEY
        }
      }
    );
    
    const vtResults = vtAnalysisResponse.data.data;
    
    // Format results for our app
    const securityData = {
      status: 'safe', // Default status
      summary: 'No security threats detected.',
      details: {
        protocol: protocolSecurity,
        virusTotal: {
          stats: vtResults.attributes.stats,
          last_analysis_date: vtResults.attributes.date,
          vendors: {},
          threat_names: []
        },
        safeBrowsing: { matches: [] },
        phishingDb: { result: 'not_found' }
      },
      timestamp: new Date().toISOString()
    };
    
    // Extract vendor results
    const vendors = Object.entries(vtResults.attributes.results)
      .filter(([_, info]) => info.category === 'malicious' || info.category === 'suspicious')
      .reduce((acc, [vendor, info]) => {
        acc[vendor] = info;
        return acc;
      }, {});
    
    securityData.details.virusTotal.vendors = vendors;
    
    // Set overall status based on VirusTotal results
    if (vtResults.attributes.stats.malicious > 0) {
      securityData.status = 'malicious';
      securityData.summary = `Detected as malicious by ${vtResults.attributes.stats.malicious} security vendors.`;
    } else if (vtResults.attributes.stats.suspicious > 0) {
      securityData.status = 'suspicious';
      securityData.summary = `Flagged as suspicious by ${vtResults.attributes.stats.suspicious} security vendors.`;
    }
    
    // Add protocol security warning if needed
    if (!protocolSecurity.secure && securityData.status === 'safe') {
      securityData.status = 'suspicious';
      securityData.summary = protocolSecurity.details;
    } else if (!protocolSecurity.secure) {
      securityData.summary += " " + protocolSecurity.details;
    }
    
    // Cache the result
    urlCache.set(url, {
      data: securityData,
      expiry: Date.now() + CACHE_TTL
    });
    
    res.json(securityData);
  } catch (error) {
    console.error('Security check error:', error);
    
    // Provide a user-friendly error response
    res.status(500).json({
      status: 'unknown',
      summary: 'Unable to assess security. Check your connection and try again.',
      details: { 
        error: error.message,
        protocol: {
          secure: false,
          details: "Unable to analyze protocol security."
        }
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Security API server running on port ${port}`);
});

module.exports = app; 