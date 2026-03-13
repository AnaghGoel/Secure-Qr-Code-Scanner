import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import '../styles/QRGenerator.css';

const PRESET_COLORS = [
  { fg: '#6366f1', bg: '#ffffff', label: 'Indigo' },
  { fg: '#8b5cf6', bg: '#ffffff', label: 'Violet' },
  { fg: '#06b6d4', bg: '#ffffff', label: 'Cyan' },
  { fg: '#10b981', bg: '#ffffff', label: 'Emerald' },
  { fg: '#ef4444', bg: '#ffffff', label: 'Red' },
  { fg: '#f59e0b', bg: '#ffffff', label: 'Amber' },
  { fg: '#0f172a', bg: '#ffffff', label: 'Dark' },
  { fg: '#ffffff', bg: '#0f172a', label: 'Inverted' },
];

const ERROR_LEVELS = ['L', 'M', 'Q', 'H'];

const QRGenerator = () => {
  const [input, setInput] = useState('');
  const [fgColor, setFgColor] = useState('#6366f1');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [errorLevel, setErrorLevel] = useState('M');
  const [margin, setMargin] = useState(2);
  const [generated, setGenerated] = useState(false);
  const [copying, setCopying] = useState(false);
  const [inputType, setInputType] = useState('url'); // url | text | wifi | contact
  
  // WiFi fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');

  // Contact fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const canvasRef = useRef(null);

  const buildQrContent = useCallback(() => {
    switch (inputType) {
      case 'wifi':
        if (!wifiSsid) return '';
        return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPass};;`;
      case 'contact':
        if (!contactName) return '';
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      default:
        return input.trim();
    }
  }, [inputType, input, wifiSsid, wifiPass, wifiSecurity, contactName, contactPhone, contactEmail]);

  const generateQR = useCallback(async () => {
    const content = buildQrContent();
    if (!content || !canvasRef.current) return;

    try {
      await QRCode.toCanvas(canvasRef.current, content, {
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      setGenerated(true);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  }, [buildQrContent, size, margin, fgColor, bgColor, errorLevel]);

  // Regenerate whenever settings change (debounced)
  useEffect(() => {
    const content = buildQrContent();
    if (!content) { setGenerated(false); return; }
    const timer = setTimeout(generateQR, 200);
    return () => clearTimeout(timer);
  }, [buildQrContent, generateQR]);

  const downloadPNG = () => {
    if (!canvasRef.current || !generated) return;
    const link = document.createElement('a');
    link.download = `trustscan-qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const downloadSVG = async () => {
    const content = buildQrContent();
    if (!content) return;
    try {
      const svg = await QRCode.toString(content, {
        type: 'svg',
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `trustscan-qr-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('SVG download error:', err);
    }
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current || !generated) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
      });
    } catch (err) {
      console.warn('Clipboard copy not supported:', err);
    }
  };

  const applyPreset = (preset) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const hasContent = buildQrContent().length > 0;

  return (
    <div className="qrgen-container">
      <div className="qrgen-header">
        <h2 className="qrgen-title">QR Code Generator</h2>
        <p className="qrgen-subtitle">Create custom, branded QR codes instantly</p>
      </div>

      <div className="qrgen-layout">
        {/* ─── Left Panel: Inputs ─────────────────────────── */}
        <div className="qrgen-inputs">

          {/* Type Selector */}
          <div className="qrgen-section">
            <label className="qrgen-label">Content Type</label>
            <div className="qrgen-type-grid">
              {[
                { key: 'url', icon: '🔗', label: 'URL' },
                { key: 'text', icon: '📝', label: 'Text' },
                { key: 'wifi', icon: '📶', label: 'Wi-Fi' },
                { key: 'contact', icon: '👤', label: 'Contact' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  className={`qrgen-type-btn ${inputType === key ? 'active' : ''}`}
                  onClick={() => setInputType(key)}
                >
                  <span className="type-icon">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Inputs per type */}
          <div className="qrgen-section">
            {inputType === 'url' && (
              <>
                <label className="qrgen-label">Website URL</label>
                <input
                  className="qrgen-input"
                  type="url"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="https://example.com"
                />
              </>
            )}

            {inputType === 'text' && (
              <>
                <label className="qrgen-label">Plain Text</label>
                <textarea
                  className="qrgen-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter any text content..."
                  rows={4}
                />
              </>
            )}

            {inputType === 'wifi' && (
              <div className="qrgen-field-group">
                <div>
                  <label className="qrgen-label">Network Name (SSID)</label>
                  <input className="qrgen-input" value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="My WiFi Network" />
                </div>
                <div>
                  <label className="qrgen-label">Password</label>
                  <input className="qrgen-input" type="password" value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="Password" />
                </div>
                <div>
                  <label className="qrgen-label">Security Type</label>
                  <select className="qrgen-select" value={wifiSecurity} onChange={e => setWifiSecurity(e.target.value)}>
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </div>
              </div>
            )}

            {inputType === 'contact' && (
              <div className="qrgen-field-group">
                <div>
                  <label className="qrgen-label">Full Name</label>
                  <input className="qrgen-input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="qrgen-label">Phone Number</label>
                  <input className="qrgen-input" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 555 123 4567" />
                </div>
                <div>
                  <label className="qrgen-label">Email Address</label>
                  <input className="qrgen-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="john@example.com" />
                </div>
              </div>
            )}
          </div>

          {/* Color Presets */}
          <div className="qrgen-section">
            <label className="qrgen-label">Color Presets</label>
            <div className="qrgen-presets">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.label}
                  className={`preset-swatch ${fgColor === p.fg && bgColor === p.bg ? 'active' : ''}`}
                  style={{ background: p.fg, border: `3px solid ${p.bg}` }}
                  onClick={() => applyPreset(p)}
                  title={p.label}
                />
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="qrgen-section">
            <div className="qrgen-color-row">
              <div>
                <label className="qrgen-label">QR Color</label>
                <div className="color-picker-wrap">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} />
                  <span className="color-hex">{fgColor}</span>
                </div>
              </div>
              <div>
                <label className="qrgen-label">Background</label>
                <div className="color-picker-wrap">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                  <span className="color-hex">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="qrgen-section">
            <label className="qrgen-label">Size: {size}px</label>
            <input
              type="range" min="128" max="512" step="32"
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="qrgen-range"
            />
          </div>

          <div className="qrgen-section">
            <label className="qrgen-label">Margin: {margin}</label>
            <input
              type="range" min="0" max="8" step="1"
              value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="qrgen-range"
            />
          </div>

          <div className="qrgen-section">
            <label className="qrgen-label">Error Correction</label>
            <div className="qrgen-ec-grid">
              {ERROR_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  className={`qrgen-ec-btn ${errorLevel === lvl ? 'active' : ''}`}
                  onClick={() => setErrorLevel(lvl)}
                  title={{ L: 'Low (7%)', M: 'Medium (15%)', Q: 'Quartile (25%)', H: 'High (30%)' }[lvl]}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="qrgen-hint">
              { { L: '7% data restore capacity', M: '15% — Recommended', Q: '25% — For logos inside', H: '30% — Maximum durability' }[errorLevel] }
            </p>
          </div>
        </div>

        {/* ─── Right Panel: Preview ────────────────────────── */}
        <div className="qrgen-preview-panel">
          <div className="qrgen-canvas-wrap">
            {!hasContent && (
              <div className="qrgen-empty">
                <div className="qrgen-empty-icon">⬛</div>
                <p>Enter content on the left to generate your QR code</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`qrgen-canvas ${!hasContent ? 'hidden' : ''}`}
              style={{ borderRadius: 8, maxWidth: '100%' }}
            />
          </div>

          {generated && hasContent && (
            <div className="qrgen-actions">
              <button className="qrgen-btn primary" onClick={downloadPNG}>
                <span>⬇</span> Download PNG
              </button>
              <button className="qrgen-btn secondary" onClick={downloadSVG}>
                <span>⬇</span> Download SVG
              </button>
              <button className="qrgen-btn ghost" onClick={copyToClipboard}>
                {copying ? '✓ Copied!' : '📋 Copy Image'}
              </button>
            </div>
          )}

          {generated && (
            <div className="qrgen-info">
              <div className="info-chip">
                <span className="chip-label">Characters</span>
                <span className="chip-value">{buildQrContent().length}</span>
              </div>
              <div className="info-chip">
                <span className="chip-label">Error Correction</span>
                <span className="chip-value">{errorLevel}</span>
              </div>
              <div className="info-chip">
                <span className="chip-label">Size</span>
                <span className="chip-value">{size}×{size}px</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
