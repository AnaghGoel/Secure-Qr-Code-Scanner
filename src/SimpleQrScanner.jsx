import React, { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import jsQR from "jsqr";
import { generatePDF, shareViaEmail, formatDate } from "./utils/ScanReport";
import { getComprehensiveSecurityReport } from "./utils/SecurityAPI";
import SecurityReport from "./components/SecurityReport";
import { addScanToHistory } from "./utils/scanHistory";

const SimpleQrScanner = () => {
  const [scanResult, setScanResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [scanMode, setScanMode] = useState("camera"); // camera or upload or direct
  const [securityStatus, setSecurityStatus] = useState(null); // null, safe, suspicious, or malicious
  const [securityDetails, setSecurityDetails] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraId, setCameraId] = useState("");
  const [cameras, setCameras] = useState([]);
  const [mounted, setMounted] = useState(true);
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef(null);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [securityReport, setSecurityReport] = useState(null);
  const [isSecurityAnalysisLoading, setIsSecurityAnalysisLoading] = useState(false);
  const [showSecurityReport, setShowSecurityReport] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: "Secure QR Scanner",
    email: "support@secureqrscanner.com",
    phone: "+1 (555) 123-4567",
    website: "https://secureqrscanner.com",
    message: "Report suspicious URLs or contact us for support."
  });
  
  // Note: In a production app, you would use environment variables and a backend proxy
  // to keep your API key secure. This is just for demonstration purposes.
  const VT_API_KEY = ""; // Put your API key here

  // Track component mount state to prevent state updates after unmount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize the scanner once when component mounts
  useEffect(() => {
    if (!mounted) return;

    const qrcodeRegionId = "qr-reader";
    
    // Delay initialization slightly to ensure DOM is ready
    const initTimer = setTimeout(() => {
      if (!mounted) return;

      // List all available cameras first
      Html5Qrcode.getCameras()
        .then(devices => {
          if (!mounted) return;
          
          if (devices && devices.length) {
            setCameras(devices);
            // Use the first camera by default
            setCameraId(devices[0].id);
            console.log("Cameras found:", devices);
          } else {
            console.log("No cameras found");
          }
        })
        .catch(err => {
          if (!mounted) return;
          console.error("Error getting cameras:", err);
        })
        .finally(() => {
          if (!mounted) return;
          
          // Initialize scanner regardless of camera detection result
          try {
            // Check if element exists before initializing
            const element = document.getElementById(qrcodeRegionId);
            if (element) {
              const html5QrCode = new Html5Qrcode(qrcodeRegionId);
              setScanner(html5QrCode);
              console.log("Scanner initialized");
            } else {
              console.error("QR reader element not found in DOM");
              setErrorMessage("Scanner initialization failed. Please refresh the page.");
            }
          } catch (err) {
            console.error("Error creating scanner:", err);
            setErrorMessage("Scanner initialization failed. Please refresh the page.");
          }
        });
    }, 500); // Short delay to ensure DOM is ready

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      if (scanner) {
        try {
          // Only stop if scanning is active
          if (scanning) {
            try {
              scanner.stop().catch(error => console.error("Failed to stop scanner on unmount:", error));
            } catch (error) {
              console.error("Error stopping scanner on unmount:", error);
            }
          }
        } catch (error) {
          console.error("Error in cleanup:", error);
        }
      }
    };
  }, [mounted]);

  // Start camera scanning when cameraId changes or when we switch to camera mode
  useEffect(() => {
    if (!mounted) return;
    
    if (scanMode === "camera" && scanner && cameraId && !scanning) {
      setCameraLoading(true);
      startCameraScanning();
    }
    
    return () => {
      // Ensure we clean up before re-initializing
      if (scanner && scanning) {
        stopScanning();
      }
    };
  }, [cameraId, scanMode, scanner, scanning, mounted]);

  const startCameraScanning = async () => {
    if (!mounted) return;
    
    if (!scanner) {
      console.error("Scanner not initialized");
      setErrorMessage("Scanner not ready. Please refresh the page.");
      setCameraLoading(false);
      return;
    }

    if (scanning) {
      console.log("Already scanning");
      return;
    }

    setErrorMessage("");
    setScanResult(""); // Clear any previous result
    setCameraLoading(true);
    
    try {
      // Simple configuration for reliable QR scanning
      const config = {
        fps: 5, // Lower FPS for more reliable scanning
        qrbox: 250, // Simple square format instead of complex object
        rememberLastUsedCamera: true,
      };

      // Use explicitly selected camera ID if available, otherwise fallback to environment facing mode
      const cameraConfig = (cameras.length > 1 && cameraId) ? cameraId : { facingMode: 'environment' };
      
      console.log("Starting camera with config:", cameraConfig);
      
      // Clean up any previous scanning session
      if (scanner.isScanning) {
        await scanner.stop();
      }
      
      scanner.start(
        cameraConfig,
        config,
        (decodedText) => {
          if (!mounted) return;
          console.log("QR Code scanned:", decodedText);
          
          // Set the result and check security
          setScanResult(decodedText);
          setErrorMessage("");
          checkUrlSecurity(decodedText);
        },
        (error) => {
          // This is called for processing errors, not for initialization
          console.debug("QR processing message:", error);
        }
      )
      .then(() => {
        if (!mounted) return;
        console.log("Camera started successfully");
        setScanning(true);
        setCameraLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("Camera start error:", error);
        
        // Try alternate method with specific camera ID if available
        if (cameraId && cameras.length > 0) {
          console.log("Trying alternate camera method with specific ID");
          startWithSpecificCamera();
        } else {
          setErrorMessage("Camera access failed. Please check your browser permissions and try again.");
          setCameraLoading(false);
        }
      });
    } catch (error) {
      if (!mounted) return;
      console.error("Error in startCameraScanning:", error);
      setErrorMessage("Scanner initialization failed. Please try again or use the upload option.");
      setCameraLoading(false);
    }
  };
  
  // Alternative method to try when the primary method fails
  const startWithSpecificCamera = () => {
    if (!scanner || !mounted) return;
    
    try {
      const config = {
        fps: 5,
        qrbox: 250,
      };
      
      const cameraConstraints = { deviceId: { exact: cameraId } };
      
      scanner.start(
        cameraConstraints,
        config,
        (decodedText) => {
          if (!mounted) return;
          console.log("QR Code scanned (alt method):", decodedText);
          setScanResult(decodedText);
          setErrorMessage("");
          checkUrlSecurity(decodedText);
        },
        (error) => {
          console.debug("QR processing message (alt):", error);
        }
      )
      .then(() => {
        if (mounted) {
          console.log("Camera started successfully (alt method)");
          setScanning(true);
          setCameraLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error("Alternative camera method also failed:", error);
          setErrorMessage("Camera access failed. Please try the upload option instead.");
          setCameraLoading(false);
        }
      });
    } catch (error) {
      if (mounted) {
        console.error("Error in alternative camera method:", error);
        setErrorMessage("Camera initialization failed. Please try the upload option.");
        setCameraLoading(false);
      }
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    if (!mounted) return;
    
    if (decodedText && decodedText !== scanResult) {
      console.log("Scan success:", decodedText, decodedResult);
      setScanResult(decodedText);
      setErrorMessage("");
      
      // If the result is a URL, check its security
      checkUrlSecurity(decodedText);
      
      // We don't pause scanning to allow for continuous scanning
      // This allows the user to scan multiple QR codes sequentially
    }
  };
  
  const onScanFailure = (errorMessage) => {
    if (!mounted) return;
    
    // Don't log every failure - these happen when no QR code is in view
    if (errorMessage && errorMessage !== "No QR code found") {
      console.debug("Scan error:", errorMessage);
    }
  };

  const stopScanning = () => {
    if (!mounted) return;
    
    if (!scanner) {
      console.log("No scanner to stop");
      return;
    }
    
    if (!scanning) {
      console.log("Not currently scanning");
      return;
    }
    
    try {
      scanner.stop()
        .then(() => {
          if (!mounted) return;
          console.log("Scanner stopped");
          setScanning(false);
        })
        .catch(error => {
          if (!mounted) return;
          console.error("Failed to stop scanner:", error);
          // Reset the scanning state even if there was an error
          setScanning(false);
        });
    } catch (error) {
      if (!mounted) return;
      console.error("Error stopping scanner:", error);
      // Reset the scanning state even if there was an error
      setScanning(false);
    }
  };

  const isUrl = (text) => {
    try {
      return Boolean(new URL(text));
    } catch (e) {
      return false;
    }
  };

  // Improved URL normalization
  const normalizeUrl = (url) => {
    try {
      let normalized = url.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = 'https://' + normalized;
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

  const checkUrlSecurity = async (url) => {
    const normalizedUrl = normalizeUrl(url);
    console.log("[Frontend] Normalized URL sent to backend:", normalizedUrl);
    setIsSecurityAnalysisLoading(true);

    try {
      const report = await getComprehensiveSecurityReport(normalizedUrl);
      console.log("Received security report:", report);
      
      if (report) {
        setSecurityReport(report);
        setShowSecurityReport(true);
        setSecurityStatus(report.status);
        setSecurityDetails(report.summary);
        // ── Save scan to history ──────────────────────────
        addScanToHistory(report, url);
      } else {
        console.error("No security report received");
        setSecurityStatus("unknown");
        setSecurityMessage("Could not assess security of this URL");
      }
    } catch (error) {
      console.error("Error checking URL security:", error);
      setSecurityStatus("unknown");
      setSecurityMessage("Error checking URL security");
    } finally {
      setIsSecurityAnalysisLoading(false);
    }
  };

  const handleTabChange = (mode) => {
    if (mode === scanMode) return;
    
    // Stop scanning if switching away from camera mode
    if (scanMode === "camera" && scanner) {
      try {
        stopScanning();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    
    setScanMode(mode);
    
    // Reset scan result when changing tabs
    setScanResult("");
    setSecurityReport(null);
    setShowSecurityReport(false);
    setSecurityStatus(null);
    setSecurityDetails(null);
    
    // Start camera if switching to camera mode
    if (mode === "camera" && scanner) {
      startScanning();
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    const file = e.target.files?.[0] || fileInputRef.current?.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Reset states
    setScanResult("");
    setSecurityStatus(null);
    setSecurityDetails(null);
    setErrorMessage("");
    setLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!mounted) return;
      
      try {
        const result = event.target?.result;
        if (!result) {
          throw new Error("Failed to read file");
        }
        
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          if (!mounted) return;
          
          // Create a canvas to draw the image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setErrorMessage("Your browser doesn't support canvas operations required for QR scanning.");
            setLoading(false);
            return;
          }
          
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data for QR code scanning
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Use jsQR to find QR codes in the image
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Success! We found a QR code
            setScanResult(code.data);
            checkUrlSecurity(code.data);
          } else {
            setErrorMessage("No QR code found in the image. Please try a different image.");
          }
          
          setLoading(false);
        };
        
        img.onerror = () => {
          if (!mounted) return;
          setErrorMessage("Failed to process the image. Please try a different image.");
          setLoading(false);
        };
        
        img.src = result;
      } catch (error) {
        if (!mounted) return;
        console.error("Error scanning QR code from image:", error);
        setErrorMessage("Failed to scan QR code from the image. Please try again.");
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      if (!mounted) return;
      setErrorMessage("Failed to read the file. Please try again.");
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const getSecurityClass = () => {
    switch (securityStatus) {
      case "safe": return "secure";
      case "suspicious": return "warning";
      case "malicious": return "danger";
      default: return "";
    }
  };

  const getSecurityIcon = () => {
    switch (securityStatus) {
      case "safe": return "";
      case "suspicious": return "⚠️";
      case "malicious": return "🛑";
      case "unknown": return "❓";
      default: return "🔍";
    }
  };

  const getSecurityMessage = () => {
    switch (securityStatus) {
      case "safe": 
        return "This content appears to be safe";
      case "suspicious": 
        return `This content looks suspicious (${securityDetails?.suspicious} flags)`;
      case "malicious": 
        return `This content appears to be malicious (${securityDetails?.malicious} flags)`;
      case "unknown":
        return "Unable to determine security status";
      default: 
        return "Analyzing content security...";
    }
  };

  const switchCamera = () => {
    if (!mounted) return;
    
    if (cameras.length <= 1) {
      console.log("No additional cameras available");
      return;
    }
    
    // Find the index of the current camera
    const currentIndex = cameras.findIndex(camera => camera.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    
    // Stop the current camera
    if (scanning) {
      stopScanning();
    }
    
    // Set the new camera
    setCameraId(cameras[nextIndex].id);
    console.log(`Switching to camera: ${cameras[nextIndex].label || "Camera " + (nextIndex + 1)}`);
  };

  // Render method sections
  const renderSecurityInfo = () => {
    if (!scanResult || !securityStatus) return null;
    
    let statusClass = "";
    let statusIcon = "";
    
    switch (securityStatus) {
      case "safe":
        statusClass = "security-safe";
        statusIcon = "";
        break;
      case "suspicious":
        statusClass = "security-suspicious";
        statusIcon = "⚠️";
        break;
      case "malicious":
        statusClass = "security-malicious";
        statusIcon = "🚫";
        break;
      case "not-url":
        statusClass = "security-neutral";
        statusIcon = "ℹ️";
        break;
      default:
        statusClass = "security-neutral";
        statusIcon = "🔍";
    }
    
    return (
      <div className={`security-check ${statusClass}`}>
        <div className="security-header">
          <span className="security-icon">{statusIcon}</span>
          <h3>Security Check</h3>
        </div>
        <p>{securityDetails}</p>
      </div>
    );
  };

  // ── Drag-and-drop handlers ─────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Simulate a file input change event
      const syntheticEvent = { target: { files: [file] }, preventDefault: () => {} };
      handleFileUpload(syntheticEvent);
    }
  }, [handleFileUpload]);

  const renderUploadUI = () => {
    return (
      <div className="upload-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: "none" }}
          accept="image/*"
        />
        <div 
          className={`upload-area ${isDraggingOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">{isDraggingOver ? '⬇️' : '📁'}</div>
          <div className="upload-text">
            {isDraggingOver ? 'Drop your image here!' : 'Click or drag & drop an image with a QR code'}
          </div>
          {!isDraggingOver && (
            <button className="upload-button">Upload Image</button>
          )}
        </div>
        
        {loading && (
          <div className="loading-container">
            <div className="loader">
              <div className="loader-spinner" />
              <p>Processing image...</p>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
      </div>
    );
  };

  const handleDownloadPDF = async () => {
    setIsSharingPdf(true);
    try {
      // When we have a security report, use that for the PDF
      if (securityReport) {
        const updatedReport = {
          ...securityReport,
          reportRef: reportRef,
          isSharingPdf: true
        };
        setSecurityReport(updatedReport);
      }
      
      const filename = await generatePDF(reportRef, scanResult, securityStatus);
      if (filename) {
        console.log(`PDF saved as ${filename}`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsSharingPdf(false);
      
      // Update the report with sharing status change
      if (securityReport) {
        const updatedReport = {
          ...securityReport,
          isSharingPdf: false
        };
        setSecurityReport(updatedReport);
      }
    }
  };

  const handleShareEmail = () => {
    try {
      // Use the security report summary if available
      const details = securityReport ? securityReport.summary : securityDetails;
      const status = securityReport ? securityReport.status : securityStatus;
      
      const success = shareViaEmail(scanResult, status, details);
      if (success) {
        console.log("Email client opened successfully");
      } else {
        // Only show alert if user actually cancelled (not if they just closed the prompt)
        console.log("Email sharing was cancelled or failed");
      }
    } catch (error) {
      console.error("Error sharing via email:", error);
      alert("Failed to open email client. Please try again or use another sharing method.");
    }
  };

  const toggleContactInfo = () => {
    setShowContactInfo(!showContactInfo);
  };

  const renderShareOptions = () => {
    if (!scanResult) return null;
    return (
      <div className="share-container">
        <button 
          className="share-button pdf"
          onClick={handleDownloadPDF}
          disabled={isSharingPdf}
        >
          {isSharingPdf ? "Generating..." : "Download as PDF"}
        </button>
        <button 
          className="share-button email"
          onClick={handleShareEmail}
        >
          Share via Email
        </button>
        <button 
          className="share-button contact"
          onClick={toggleContactInfo}
        >
          Contact Support
        </button>
      </div>
    );
  };

  const renderContactInfo = () => {
    if (!showContactInfo) return null;
    
    return (
      <div className="contact-overlay">
        <div className="contact-container">
          <div className="contact-header">
            <h3>Contact Information</h3>
            <button 
              className="close-btn"
              onClick={() => setShowContactInfo(false)}
            >
              ×
            </button>
          </div>
          <div className="contact-content">
            <div className="contact-item">
              <strong>Organization:</strong> {contactInfo.name}
            </div>
            <div className="contact-item">
              <strong>Email:</strong> {contactInfo.email}
            </div>
            <div className="contact-item">
              <strong>Phone:</strong> {contactInfo.phone}
            </div>
            <div className="contact-item">
              <strong>Website:</strong> <a href={contactInfo.website} target="_blank" rel="noopener noreferrer">{contactInfo.website}</a>
            </div>
            <div className="contact-message">
              {contactInfo.message}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScanReport = () => {
    if (!scanResult) return null;
    
    // Security status styling
    let securityClass = "";
    let securityIcon = "";
    
    switch (securityStatus) {
      case "safe":
        securityClass = "safe";
        securityIcon = "";
        break;
      case "suspicious":
        securityClass = "suspicious";
        securityIcon = "⚠️";
        break;
      case "malicious":
        securityClass = "malicious";
        securityIcon = "🚫";
        break;
      case "not-url":
        securityClass = "";
        securityIcon = "ℹ️";
        break;
      default:
        securityClass = "";
        securityIcon = "🔍";
    }
    
    return (
      <div className="scan-report" ref={reportRef}>
        <div className="scan-report-header">
          <div className="scan-report-title">QR Code Scan Report</div>
          <div className="scan-report-date">{formatDate(new Date())}</div>
        </div>
        
        <div className="scan-report-content">
          <div className="scan-report-row">
            <div className="scan-report-label">Scan Result:</div>
            <div className="scan-report-value">{scanResult}</div>
          </div>
          
          {isUrl(scanResult) && (
            <div className="scan-report-row">
              <div className="scan-report-label">URL:</div>
              <div className="scan-report-value">
                <a href={scanResult} target="_blank" rel="noopener noreferrer">
                  {scanResult}
                </a>
              </div>
            </div>
          )}
          
          {securityStatus && (
            <div className="scan-report-row">
              <div className="scan-report-label">Security Status:</div>
              <div className="scan-report-value">
                <span className={`security-badge ${securityClass}`}>
                  {securityStatus}
                </span>
              </div>
            </div>
          )}
          
          {securityDetails && (
            <div className={`scan-report-security ${securityClass}`}>
              <strong>Security Details:</strong> {securityDetails}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDirectUrlCheck = async (e) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    let urlToCheck = normalizeUrl(directUrl);
    console.log("[Frontend] Normalized URL sent to backend:", urlToCheck);
    setNormalizedUrlForDebug(urlToCheck); // For UI display
    setIsSecurityAnalysisLoading(true);
    
    try {
      // Call the API to get the security report
      const report = await getComprehensiveSecurityReport(urlToCheck);
      console.log("Received security report for direct URL:", report);
      
      if (report) {
        setScanResult(urlToCheck); // Set the scan result to the URL
        setSecurityReport(report);
        setShowSecurityReport(true);
        setSecurityStatus(report.status);
        setSecurityDetails(report.summary);
      } else {
        console.error("No security report received");
        setSecurityStatus("unknown");
        setSecurityMessage("Could not assess security of this URL");
      }
    } catch (error) {
      console.error("Error checking URL security:", error);
      setSecurityStatus("unknown");
      setSecurityMessage("Error checking URL security");
    } finally {
      setIsSecurityAnalysisLoading(false);
    }
  };

  const renderDirectUrlUI = () => {
    return (
      <div className="direct-url-container">
        <form onSubmit={handleDirectUrlCheck} className="url-input-form">
          <div className="url-input-group">
            <input
              type="text"
              className="url-input"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
            />
            <button 
              type="submit" 
              className="url-check-button"
              disabled={isSecurityAnalysisLoading}
            >
              {isSecurityAnalysisLoading ? "Checking..." : "Check URL"}
            </button>
          </div>
          
          <p className="url-input-hint">
            Enter any URL to check its security status without scanning a QR code.
          </p>
        </form>
        
        {scanResult && !showSecurityReport && (
          <div className="direct-url-result">
            <h3>URL Detected</h3>
            <p>{scanResult}</p>
            <div className="action-buttons">
              <button 
                className="check-security-btn" 
                onClick={handleStartSecurityCheck}
                disabled={isSecurityAnalysisLoading}
              >
                {isSecurityAnalysisLoading ? "Analyzing..." : "Check Security"}
              </button>
            </div>
          </div>
        )}
        
        {!scanResult && !isSecurityAnalysisLoading && (
          <div className="help-container">
            <div className="help-header">
              <h3>Need Assistance?</h3>
            </div>
            <div className="help-content">
              <p>If you've encountered a suspicious URL or need help with our QR scanner:</p>
              <ul>
                <li>Contact our security team at <a href="mailto:security@secureqrscanner.com">security@secureqrscanner.com</a></li>
                <li>Call our support line: +1 (555) 123-4567</li>
                <li>Visit our <a href="https://secureqrscanner.com/faq" target="_blank" rel="noopener noreferrer">FAQ page</a> for common questions</li>
              </ul>
              <button className="help-button" onClick={toggleContactInfo}>
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add a state for normalizedUrlForDebug
  const [normalizedUrlForDebug, setNormalizedUrlForDebug] = useState("");

  return (
    <div className="scanner-container">
      <div className="scan-options">
        <button 
          className={`scan-option ${scanMode === 'camera' ? 'active' : ''}`}
          onClick={() => handleTabChange('camera')}
        >
          📷 Camera
        </button>
        <button 
          className={`scan-option ${scanMode === 'upload' ? 'active' : ''}`}
          onClick={() => handleTabChange('upload')}
        >
          📁 Upload Image
        </button>
        <button 
          className={`scan-option ${scanMode === 'direct' ? 'active' : ''}`}
          onClick={() => handleTabChange('direct')}
        >
          🔗 Enter URL
        </button>
      </div>

      <div className="scanner-content">
        {scanMode === "camera" ? (
          <div className="scanner-box">
            {cameras.length > 1 && (
              <button
                className="camera-switch-button"
                onClick={switchCamera}
                aria-label="Switch Camera"
              >
                <span role="img" aria-label="Switch Camera">🔄</span>
              </button>
            )}
            <div 
              id="qr-reader" 
              style={{ 
                width: '100%', 
                maxWidth: '600px', 
                height: '450px',
                margin: '0 auto',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px'
              }} 
            />
            {cameraLoading && (
              <div className="loader">
                <div className="loader-spinner"></div>
                <p>Starting camera...</p>
              </div>
            )}
          </div>
        ) : scanMode === "upload" ? (
          renderUploadUI()
        ) : (
          renderDirectUrlUI()
        )}

        {isSecurityAnalysisLoading && (
          <div className="security-loading">
            <div className="loader">Analyzing security...</div>
          </div>
        )}

        {scanResult && (
          <div className="result-container">
            <h3>Scan Result:</h3>
            <div className="result-box">
              <p className="result-text">{scanResult}</p>
              <div className="result-actions">
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                {isUrl(scanResult) && (
                  <a
                    href={scanResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-link"
                  >
                    Open ↗
                  </a>
                )}
              </div>
            </div>
            
            {/* Show the legacy security info if no comprehensive report is available */}
            {!showSecurityReport && securityStatus && renderSecurityInfo()}
            
            {/* Show the comprehensive security report when available */}
            {showSecurityReport && securityReport && (
              <div className="security-report-wrapper">
                <SecurityReport 
                  securityReport={securityReport} 
                  onBack={() => setShowSecurityReport(false)}
                />
              </div>
            )}
            
            {/* Show legacy share options if no comprehensive report */}
            {!showSecurityReport && renderShareOptions()}
            
            {/* Legacy scan report for PDF generation */}
            <div style={{ display: 'none' }}>
              {renderScanReport()}
            </div>
          </div>
        )}

        <div className="security-tips">
          <h3>Security Tips</h3>
          <ul>
            <li>Always verify the URL before visiting links from QR codes</li>
            <li>Be cautious of QR codes in public places or from unknown sources</li>
            <li>Check that links use HTTPS rather than HTTP</li>
            <li>Consider using a QR scanner with security features (like this one!)</li>
          </ul>
        </div>
      </div>

      {renderContactInfo()}

      {/* In the UI, display the normalized URL for debugging */}
      {normalizedUrlForDebug && (
        <div className="debug-url">Normalized URL sent to backend: <code>{normalizedUrlForDebug}</code></div>
      )}
    </div>
  );
};

export default SimpleQrScanner; 