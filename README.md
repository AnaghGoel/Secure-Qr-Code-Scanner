# TrustScan — Secure QR Code Scanner

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-blue?style=for-the-badge&logo=vercel)](https://secure-qr-code-scanner.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A real-time QR code scanner, generator, and URL threat-intelligence application that protects users against malicious QR codes (*quishing*, phishing, malware distribution) using the **VirusTotal API**.

---

## 🚀 Live Demo & Video Walkthrough

- **Live Web App**: [https://secure-qr-code-scanner.vercel.app/](https://secure-qr-code-scanner.vercel.app/)
- **🎥 5-Minute Video Demonstration**: [Watch the Project Demo Video](https://drive.google.com/file/d/1bdAnLweTHEuBD8EpNU1BozdswF4k3zz7/view?usp=sharing)

---

## ✨ Features

- **Live Camera Scanning**: High-speed QR detection directly through your device camera with front/rear switching.
- **Image Upload & Drag-and-Drop**: Upload or drop existing image files containing QR codes.
- **Threat Intelligence via VirusTotal**:
  - Automatically unwraps URL shorteners and HTTP redirects to inspect destination landing pages.
  - Queries VirusTotal's multi-engine security database (~90 security vendors including Google Safe Browsing, Kaspersky, BitDefender).
  - Calculates aggregated security scores (0–100) and risk classifications (*Safe*, *Suspicious*, *Malicious*, *Unknown*).
- **QR Code Generator**: Create custom QR codes for URLs, plain text, Wi-Fi network credentials, and vCards with color presets and error-correction levels.
- **Scan History**: Persistent local scan log with status filtering, searching, and clipboard/JSON export.
- **Report Export**: Download detailed security reports as formatted PDFs or share them via email.
- **Dual-Mode Backend**: Runs as a standalone Node.js Express server locally or as a Vercel Serverless Function in production.
- **Dark Mode Support**: Seamless light/dark theme switching.

---

## 🛠️ Setup and Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **VirusTotal API Key**: Free API key available at [VirusTotal](https://www.virustotal.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AnaghGoel/Secure-Qr-Code-Scanner.git
   cd Secure-Qr-Code-Scanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:
   ```env
   VT_API_KEY=your_virustotal_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

---

## 💻 Running the Application

### Development (Frontend + Backend)
Start both the Express backend and the Vite development server concurrently:
```bash
npm start
```

Or run them individually:
```bash
# Start backend only (Express on http://localhost:3001)
npm run start:backend

# Start frontend only (Vite on http://localhost:5173)
npm run start:frontend
```

### Production Build
```bash
# Lint codebase
npm run lint

# Build production bundle
npm run build

# Preview build locally
npm run preview
```

---

## ☁️ Deployment

### Vercel Deployment
The project is preconfigured for Vercel:
- **Frontend**: Built via Vite to `dist/`.
- **Backend API**: Automatically routed through `/api/security/check-url` via Vercel Serverless Functions (`api/security/check-url.js`).
- Remember to configure `VT_API_KEY` under **Project Settings > Environment Variables** in the Vercel Dashboard.

---

## 🔒 Security Best Practices

- **Keep API Keys Confidential**: Never commit `.env` or sensitive credentials to version control.
- **Free Tier Considerations**: VirusTotal's public API rate limit is 4 requests/minute and 500 requests/day. The serverless function includes an in-memory TTL cache to prevent repeated scans of identical URLs from exhausting quota.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
