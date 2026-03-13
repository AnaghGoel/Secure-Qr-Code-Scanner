import React from "react";
import { useParams, Link } from "react-router-dom";

const BlogPost = () => {
  // Component rendering debug
  React.useEffect(() => {
    console.log("BlogPost component mounted");
  }, []);

  const { postId } = useParams();
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/blog" style={{ display: 'inline-block', marginBottom: '20px', color: '#4a6cb2', fontWeight: 'bold' }}>
        ← Back to Blog
      </Link>
      
      <h1>Blog Post: {postId}</h1>
      
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
        <p>This is a placeholder for the blog post content with ID: <strong>{postId}</strong></p>
        <p style={{ marginTop: '10px' }}>In the complete version, this will show the full article about QR security.</p>
      </div>
    </div>
  );
};

export default BlogPost; 