import('axios').then(async ({ default: axios }) => {
  try {
    const res = await axios.get('http://localhost:3001/api/domain-info?url=https://www.github.com');
    console.log("Domain Intel:", res.data);
  } catch (e) {
    console.error("Error:", e.message);
  }
});
