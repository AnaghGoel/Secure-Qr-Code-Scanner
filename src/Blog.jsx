import React from "react";
import { Link } from "react-router-dom";

const Blog = () => {
  // Component rendering debug
  React.useEffect(() => {
    console.log("Blog component mounted");
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>QR Security Blog</h1>
      <p style={{ marginBottom: '20px' }}>
        Learn about secure QR code practices and how to protect yourself from scams.
      </p>
      
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Understanding QR Code Security Risks</h2>
        <p>QR codes are everywhere, but they can pose significant security risks.</p>
        <Link to="/blog/understanding-qr-risks" style={{ color: '#4a6cb2', fontWeight: 'bold' }}>Read more →</Link>
      </div>
    </div>
  );
};

export default Blog; 