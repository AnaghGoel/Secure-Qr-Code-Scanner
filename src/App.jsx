import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import SimpleQrScanner from "./SimpleQrScanner";
import QRGenerator from "./components/QRGenerator";
import ScanHistory from "./components/ScanHistory";

function App() {
  const [activeTab, setActiveTab] = useState("scanner");
  const [darkMode, setDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [activeBlog, setActiveBlog] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const footerRef = useRef(null);

  // Blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Understanding QR Code Security Risks",
      summary: "QR codes are everywhere, but they can pose significant security risks. Learn about the common threats and how to avoid them.",
      content: `
        <h2>Understanding QR Code Security Risks</h2>
        <p class="blog-date">Published on May 15, 2023</p>
        
        <p>QR codes have become ubiquitous in our daily lives. From restaurant menus to payment systems, product packaging to event tickets, these square barcodes offer convenient access to digital information with a simple scan. However, this convenience comes with security risks that many users aren't aware of.</p>
        
        <h3>Common QR Code Security Threats</h3>
        
        <p><strong>1. Phishing Attacks</strong><br>
        Cybercriminals can create malicious QR codes that lead to fake websites designed to steal your personal information. These phishing sites often mimic legitimate businesses but contain forms that harvest your credentials or payment details.</p>
        
        <p><strong>2. Automatic Actions</strong><br>
        QR codes can trigger automatic actions on your device, such as adding contacts, connecting to WiFi networks, or even initiating payments. If you scan a malicious QR code, it could potentially add a compromised WiFi network to your saved networks or add malicious contacts to your address book.</p>
        
        <p><strong>3. Malware Distribution</strong><br>
        Some QR codes direct users to websites that download malware onto their devices. This malware can range from spyware that monitors your activities to ransomware that locks your device until you pay a fee.</p>
        
        <p><strong>4. Payment Fraud</strong><br>
        As QR code payments become more popular, scammers have started replacing legitimate payment QR codes with their own. For example, a fraudster might place their QR code over a legitimate one on a parking meter, directing your payment to their account instead.</p>
        
        <h3>How to Protect Yourself</h3>
        
        <p><strong>Verify Before You Scan</strong><br>
        Before scanning a QR code, especially in public places, inspect it for signs of tampering. If it looks like a sticker placed over another code, or if it seems out of place, be cautious.</p>
        
        <p><strong>Check URLs Before Following</strong><br>
        When you scan a QR code, most modern scanning apps will show you the destination URL before opening it. Take a moment to review this URL and ensure it belongs to the organization or service you expect.</p>
        
        <p><strong>Use Secure Scanning Apps</strong><br>
        Choose QR scanning apps that include security features, such as preview functions and malicious URL detection. Our Secure QR Scanner is designed with these security features in mind.</p>
        
        <p><strong>Keep Your Device Updated</strong><br>
        Regular software updates often include security patches that protect against known vulnerabilities that malicious QR codes might exploit.</p>
        
        <p>By staying informed and taking these simple precautions, you can safely enjoy the convenience of QR codes without falling victim to security threats. Remember, a moment of caution can save you from significant security headaches later.</p>
      `
    },
    {
      id: 2,
      title: "How to Protect Yourself from QR Scams",
      summary: "Follow these essential guidelines to ensure your safety when scanning QR codes in public places.",
      content: `
        <h2>How to Protect Yourself from QR Scams</h2>
        <p class="blog-date">Published on June 3, 2023</p>
        
        <p>As QR codes become more prevalent in our daily interactions, scammers are finding creative ways to exploit them for malicious purposes. This growing trend of "quishing" (QR phishing) attacks requires users to be increasingly vigilant. Here's how you can protect yourself from QR code scams.</p>
        
        <h3>The Rise of QR Code Scams</h3>
        
        <p>The COVID-19 pandemic accelerated the adoption of QR codes as businesses sought contactless solutions. Unfortunately, this rapid adoption created new opportunities for cybercriminals. In 2022 alone, QR code scams increased by 438% according to cybersecurity researchers, with victims losing thousands of dollars to these schemes.</p>
        
        <h3>Essential Safety Guidelines</h3>
        
        <p><strong>Inspect Physical QR Codes</strong><br>
        When encountering a QR code in a public place, check for signs of tampering. Scammers often place their malicious QR codes over legitimate ones. Look for edges of stickers, uneven placement, or codes that seem out of place or hastily added.</p>
        
        <p><strong>Never Scan Codes from Untrusted Sources</strong><br>
        Be particularly cautious of QR codes in emails or messages from unknown senders, on unattended flyers, or in unexpected locations. Legitimate organizations rarely send unsolicited QR codes via email or text messages.</p>
        
        <p><strong>Verify the URL Before Proceeding</strong><br>
        After scanning, always examine the resulting URL before clicking through. Check for:
        <ul>
          <li>Spelling errors in the domain name (e.g., "amaz0n.com" instead of "amazon.com")</li>
          <li>Unusual domains or subdomains</li>
          <li>HTTP instead of HTTPS (indicating an unsecured connection)</li>
          <li>Shortened URLs that hide the actual destination</li>
        </ul>
        </p>
        
        <p><strong>Use a Secure QR Scanner</strong><br>
        Choose a QR code scanner with built-in security features that check for malicious links. Our Secure QR Scanner performs security checks on every scanned URL, providing warnings about potentially dangerous destinations.</p>
        
        <p><strong>Be Wary of QR Codes Requesting Personal Information</strong><br>
        Legitimate businesses rarely request sensitive information like passwords or payment details immediately after scanning a QR code. If you're directed to a page asking for such information, verify the organization through official channels before proceeding.</p>
        
        <h3>Real-World Examples to Watch For</h3>
        
        <p><strong>Parking Meter Scams</strong><br>
        Scammers place fake QR codes on parking meters, directing payments to their accounts instead of the legitimate parking service.</p>
        
        <p><strong>Restaurant Menu Scams</strong><br>
        Fake QR codes placed on restaurant tables lead to lookalike menu websites that steal payment information or install malware.</p>
        
        <p><strong>Package Delivery Scams</strong><br>
        Fake delivery notifications with QR codes claim to help you track a package but instead lead to phishing sites.</p>
        
        <p>By following these guidelines and maintaining a healthy skepticism when interacting with QR codes, you can significantly reduce your risk of falling victim to QR code scams while still enjoying the convenience they offer.</p>
      `
    },
    {
      id: 3,
      title: "The Future of QR Code Technology",
      summary: "Explore how QR codes are evolving and the innovations that will shape their use in the coming years.",
      content: `
        <h2>The Future of QR Code Technology</h2>
        <p class="blog-date">Published on July 20, 2023</p>
        
        <p>QR codes, once considered a niche technology, have firmly established themselves in the mainstream. But the simple black and white squares we recognize today are just the beginning. The future of QR code technology promises exciting innovations that will expand their capabilities and applications.</p>
        
        <h3>Evolution of QR Codes</h3>
        
        <p>QR codes (Quick Response codes) were invented in 1994 by Denso Wave, a Japanese automotive company, primarily for tracking vehicle parts during manufacturing. Their design allowed for faster scanning and greater storage capacity than traditional barcodes. Despite early adoption in Japan and parts of Asia, QR codes took longer to gain traction in Western markets until smartphone technology advanced enough to make scanning convenient.</p>
        
        <h3>Emerging QR Code Innovations</h3>
        
        <p><strong>Dynamic QR Codes</strong><br>
        Unlike static QR codes that permanently link to a specific destination, dynamic QR codes can be edited after creation. This means the same physical QR code can direct users to different content over time, making them ideal for marketing campaigns, menus that change seasonally, or any situation requiring updated information without reprinting codes.</p>
        
        <p><strong>Aesthetic QR Codes</strong><br>
        The black and white pattern is becoming a canvas for creative expression. Designers are incorporating logos, colors, and artistic elements while maintaining scannability. Companies like Spotify have pioneered this with their distinctive Spotify Codes, and we'll see more brands creating visually appealing QR codes that enhance rather than detract from packaging and marketing materials.</p>
        
        <p><strong>Secure QR Payments</strong><br>
        QR code payments are set to become more secure with the integration of biometric authentication, temporary code generation, and blockchain technology. These advancements will address current security concerns while maintaining the convenience that makes QR payments attractive.</p>
        
        <p><strong>Augmented Reality Integration</strong><br>
        QR codes are becoming gateways to augmented reality experiences. By scanning a code, users can unlock interactive 3D models, virtual try-on experiences for products, or location-based information overlaid on their real-world view. This convergence of technologies creates immersive experiences that engage users in entirely new ways.</p>
        
        <h3>Industry Applications on the Horizon</h3>
        
        <p><strong>Healthcare Revolution</strong><br>
        QR codes on medical devices, medication packaging, and patient wristbands will streamline healthcare processes. Doctors and nurses can instantly access patient histories, medication information, and equipment instructions by scanning codes. Patients can view detailed information about their prescriptions and treatment plans.</p>
        
        <p><strong>Supply Chain Transparency</strong><br>
        QR codes linked to blockchain technology will provide unprecedented transparency in supply chains. Consumers will be able to scan a product and trace its journey from source to store, verifying authenticity and ethical production claims. This will be particularly valuable for industries plagued by counterfeiting and ethical concerns.</p>
        
        <p><strong>Smart Cities Integration</strong><br>
        As cities become smarter, QR codes will play a vital role in connecting physical infrastructure with digital information. From accessing public transportation to learning about historical landmarks or receiving emergency information, QR codes will help citizens navigate and interact with their environment.</p>
        
        <p>The future of QR codes lies not just in their ability to connect us to websites but in their potential to bridge our physical and digital worlds in increasingly meaningful ways. As these technologies continue to evolve, the humble QR code may become one of the most important interfaces in our daily lives.</p>
      `
    }
  ];

  // Apply dark mode to the document
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Add animation after initial render
  useEffect(() => {
    setIsAnimated(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const openBlog = (blogId) => {
    setActiveBlog(blogPosts.find(post => post.id === blogId));
  };

  const closeBlog = () => {
    setActiveBlog(null);
  };

  const renderThemeIcon = () => {
    return darkMode ? (
      <svg className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    ) : (
      <svg className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    );
  };

  const toggleContactDetails = () => {
    setShowContactDetails(prev => {
      const willShow = !prev;
      if (!prev) {
        // If opening, scroll to footer after a short delay for animation
        setTimeout(() => {
          if (footerRef.current) {
            footerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 350); // Match the CSS transition duration
      }
      return willShow;
    });
  };

  return (
    <div className={`app-container ${isAnimated ? 'animated' : ''}`}>
      <header className="app-header">
        <div className="header-top">
          <div className="logo-container">
            <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
            <h1>Trust Scan</h1>
          </div>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {renderThemeIcon()}
          </button>
        </div>
        <p className="tagline">Scan QR codes with enhanced security and peace of mind</p>
        
        <nav className="main-nav">
          <button
            className={`nav-button ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 8 4 4 8 4"></polyline><line x1="4" y1="4" x2="10" y2="10"></line>
              <polyline points="16 4 20 4 20 8"></polyline><line x1="14" y1="10" x2="20" y2="4"></line>
              <polyline points="4 16 4 20 8 20"></polyline><line x1="4" y1="20" x2="10" y2="14"></line>
              <polyline points="16 20 20 20 20 16"></polyline><line x1="14" y1="14" x2="20" y2="20"></line>
            </svg>
            Scanner
          </button>
          <button
            className={`nav-button ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect><line x1="14" y1="14" x2="21" y2="14"></line>
              <line x1="14" y1="18" x2="21" y2="18"></line><line x1="14" y1="22" x2="21" y2="22"></line>
            </svg>
            Generate
          </button>
          <button
            className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            History
          </button>
          <button
            className={`nav-button ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Blog
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'scanner' ? (
          <SimpleQrScanner />
        ) : activeTab === 'generate' ? (
          <QRGenerator />
        ) : activeTab === 'history' ? (
          <ScanHistory />
        ) : (
          <div className="blog-section">
            {activeBlog ? (
              <div className="blog-full">
                <button className="back-button" onClick={closeBlog}>
                  <svg className="back-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  Back to blogs
                </button>
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: activeBlog.content }}></div>
              </div>
            ) : (
              <>
                <h2>QR Security Blog</h2>
                <p className="blog-intro">Learn about QR code security best practices and stay updated with the latest information</p>
                <div className="blog-grid">
                  {blogPosts.map(post => (
                    <div key={post.id} className="blog-card" onClick={() => openBlog(post.id)}>
                      <h3>{post.title}</h3>
                      <p>{post.summary}</p>
                      <button className="read-more">
                        Read More 
                        <svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer" ref={footerRef}>
        <div className="footer-content">
          <div className="footer-left">
            <svg className="logo-icon-small" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
            <p>© {new Date().getFullYear()} Secure QR Scanner</p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link" onClick={e => { e.preventDefault(); setShowPrivacy(true); }}>Privacy Policy</a>
            <a href="#" className="footer-link" onClick={e => { e.preventDefault(); setShowTerms(true); }}>Terms of Use</a>
          </div>
        </div>
        
        {showContactDetails && (
          <div className={`footer-contact-details${showContactDetails ? ' open' : ''}`}>
            <div className="contact-section">
              <h3>Contact Me</h3>
              <div className="contact-grid">
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <h4>Phone</h4>
                    <a href="tel:+919876543210">+91 98765 43210</a>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="contact-info">
                    <h4>Location</h4>
                    <address>
                      Jaypee University of Information Technology<br />
                      Waknaghat, Solan<br />
                      Himachal Pradesh, India - 173234
                    </address>
                  </div>
                </div>
              </div>
              
              <div className="social-links">
                <a href="https://www.instagram.com/anaghgoel/" target="_blank" rel="noopener noreferrer" className="social-link instagram-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#E1306C">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/anagh-goel-291a7b252/" target="_blank" rel="noopener noreferrer" className="social-link linkedin-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </footer>

      <div className="floating-contact-btn" onClick={toggleContactDetails} title="Contact">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </div>

      {showPrivacy && (
        <section className="policy-section">
          <div className="policy-container">
            <h2>Privacy Policy</h2>
            <p>
  Our QR Code Scanner values your privacy. We do not collect or store any personal data from your scans. When you scan a QR code or enter a URL, the information is processed in real-time using the VirusTotal API to check for malicious content. No data is saved on our servers.
</p>
<p>
  We use VirusTotal, a trusted third-party service by Google, to perform security analysis. You can review their privacy practices at <a href="https://support.virustotal.com/hc/en-us/articles/115002168385-Privacy-Policy" target="_blank" rel="noopener noreferrer">VirusTotal Privacy Policy</a>.
</p>
<p>
  Your input is only used temporarily to fetch the scan result and is discarded immediately after. We implement secure communication protocols to protect your data during transmission.
</p>
<p>
  By using our service, you agree to this privacy policy. We may update this content from time to time, and any changes will be reflected on this page.
</p>
            <button className="close-btn" onClick={() => setShowPrivacy(false)}>Close</button>
          </div>
        </section>
      )}
      {showTerms && (
        <section className="policy-section">
          <div className="policy-container">
            <h2>Terms of Use</h2>
            <p>
  By using our QR Code Scanner, you agree to use the service responsibly and only for lawful purposes. You must not use this tool to scan or distribute harmful, illegal, or malicious content.
</p>
<p>
  The scanning results provided by the VirusTotal API are for informational purposes only. While we strive to provide accurate and up-to-date data, we do not guarantee the completeness, reliability, or safety of the results.
</p>
<p>
  We are not liable for any loss, damage, or consequences arising from the use of this service or the content of any QR code or URL scanned through our tool.
</p>
<p>
  We reserve the right to update or modify these Terms of Use at any time without prior notice. Continued use of the service after changes means you accept and agree to the updated terms.
</p>
<p>
  If you do not agree to these terms, please discontinue use of the QR Code Scanner.
</p>

            <button className="close-btn" onClick={() => setShowTerms(false)}>Close</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
