# Secure QR Scanner

A secure QR code scanner application that checks URLs for potential security threats using the VirusTotal API.

## Features

- Scan QR codes using your device's camera
- Upload images containing QR codes
- Security analysis of scanned URLs using VirusTotal API
- Download scan reports as PDF
- Share scan results via email
- Dark mode support

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- A VirusTotal API key (sign up at [VirusTotal](https://www.virustotal.com/))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/secure-qr-scanner.git
   cd secure-qr-scanner
   ```

2. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```

3. Create a `.env` file in the root directory with your VirusTotal API key
   ```
   VT_API_KEY=your_virustotal_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

### Running the Application

1. Start both the backend server and frontend application
   ```bash
   npm start
   ```

2. For development, you can run them separately:
   ```bash
   # Start backend only
   npm run start:backend
   
   # Start frontend only
   npm run start:frontend
   ```

## Accessing the Application

- Frontend: http://localhost:5173 (or the port provided by Vite)
- Backend API: http://localhost:3001/api

## Security API Integration

This application integrates with the VirusTotal API to check the security of scanned URLs. The security analysis includes:

- Malicious URL detection
- Phishing site detection
- HTTP vs HTTPS analysis
- Vendor-specific security results

## Important Notes on API Usage

- The free VirusTotal API has usage limitations (4 requests per minute, 500 requests per day)
- API keys should be kept confidential and never committed to version control
- For production use, consider upgrading to VirusTotal's premium API

## Adding Additional Security Services

You can extend the security checking by integrating other APIs like:

1. **Google Safe Browsing API**
   - Sign up at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Safe Browsing API
   - Add your API key to the `.env` file: `GSB_API_KEY=your_key_here`

2. **PhishTank API**
   - Register at [PhishTank](https://phishtank.org/)
   - Request an API key
   - Add your API key to the `.env` file: `PHISHTANK_API_KEY=your_key_here`

## License

MIT
