# Secure QR Scanner - Portable Version

## 🚀 Quick Start Guide

This is a portable version of the Secure QR Scanner application. Follow these steps to run it anywhere:

### Prerequisites
1. **Node.js** (version 16 or higher) - Download from https://nodejs.org/
2. **npm** (comes with Node.js)
3. **Python 3.11** (optional, for enhanced features)

### Installation & Setup

#### Step 1: Extract the Archive
```bash
# Extract the zip file to your desired location
unzip secure-qr-scanner-portable.zip
cd secure-qr-scanner-portable
```

#### Step 2: Install Dependencies
```bash
# Install all required Node.js packages
npm install
```

#### Step 3: Set Up Environment (Optional)
Create a `.env` file for VirusTotal API integration:
```bash
# Create .env file
touch .env

# Add your VirusTotal API key (optional but recommended)
echo "VT_API_KEY=your_virustotal_api_key_here" >> .env
```

#### Step 4: Run the Application
```bash
# Start both frontend and backend
npm start
```

#### Step 5: Access the Website
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📁 What's Included

### Core Files
- `package.json` - Project configuration and dependencies
- `package-lock.json` - Locked dependency versions
- `server.js` - Express backend server
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration

### Source Code
- `src/` - React frontend source code
  - `App.jsx` - Main application component
  - `SimpleQrScanner.jsx` - QR scanner component
  - `components/` - Reusable React components
  - `utils/` - Utility functions and API calls
  - `styles/` - CSS styling files

### Configuration
- `.env` - Environment variables (create this)
- `.gitignore` - Git ignore rules
- `eslint.config.js` - ESLint configuration

### Documentation
- `README.md` - Original project documentation
- `PORTABLE_README.md` - This portable setup guide

## 🔧 Available Commands

```bash
# Development
npm start              # Start both frontend and backend
npm run dev           # Start frontend only (Vite)
npm run start:frontend # Start frontend only
npm run start:backend  # Start backend only

# Building
npm run build         # Build for production
npm run preview       # Preview production build

# Linting
npm run lint          # Run ESLint
```

## 🌐 Features

### QR Code Scanning
- Real-time QR code detection
- Multiple QR code formats support
- Camera integration
- File upload support

### Security Analysis
- URL validation and normalization
- VirusTotal API integration
- Security scoring (0-100)
- HTTPS verification
- Suspicious pattern detection

### Report Generation
- PDF report generation
- Security analysis results
- Detailed scan reports
- Export functionality

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes using the ports
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### 2. Dependencies Not Installed
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### 3. Permission Issues
```bash
# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
```

#### 4. Frontend Not Loading
- Clear browser cache
- Check browser console for errors
- Verify Vite is running on port 5173

#### 5. Backend API Errors
- Check server logs in terminal
- Verify all dependencies are installed
- Check if port 3001 is available

## 🔒 Security Features

### QR Code Security Analysis
- **URL Validation**: Checks if scanned URLs are valid
- **VirusTotal Integration**: Scans URLs for malware and threats
- **HTTPS Verification**: Ensures secure connections
- **Pattern Detection**: Identifies suspicious URL patterns
- **Security Scoring**: Provides 0-100 security score

### Mock Analysis
When VirusTotal API is unavailable:
- Heuristic-based security assessment
- URL pattern analysis
- Basic security checks
- Simulated threat detection

## 📊 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Node.js**: Version 16 or higher
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 1GB free space
- **Internet**: For VirusTotal API access
- **Camera**: For QR code scanning

## 🚀 Production Deployment

### Building for Production
```bash
# Build the application
npm run build

# The built files will be in the 'dist' directory
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
VT_API_KEY=your_production_api_key
```

## 📞 Support

### Getting Help
1. Check this README for common solutions
2. Verify all prerequisites are installed
3. Check terminal logs for error messages
4. Ensure ports 5173 and 3001 are available

### File Structure
```
secure-qr-scanner-portable/
├── src/                    # React frontend
├── public/                 # Static assets
├── backend/               # Backend files
├── package.json           # Dependencies
├── server.js              # Express server
├── vite.config.js         # Vite config
├── tailwind.config.js     # Tailwind config
├── .env                   # Environment variables
├── README.md              # Original documentation
└── PORTABLE_README.md     # This file
```

## 🔄 Restart Instructions

To restart the application:
1. Stop the current process (Ctrl+C)
2. Run `npm start` again
3. Access http://localhost:5173

## 📝 Notes

- The application runs on ports 5173 (frontend) and 3001 (backend)
- VirusTotal API key is optional but recommended for full security features
- All dependencies will be installed when you run `npm install`
- The application is fully self-contained and portable

---

**Version**: 0.1.0  
**Last Updated**: January 2025  
**Compatibility**: Node.js 16+, All major browsers

