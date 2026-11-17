import axios from 'axios';

async function testSecurityCheck() {
  try {
    const res = await axios.post('http://localhost:3001/api/security/check-url', {
      url: 'https://github.com'
    });
    console.log('Security check response:', res.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

testSecurityCheck();
