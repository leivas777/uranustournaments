// quick-test.js
const axios = require('axios');

async function quickTest() {
  const tests = [
    'http://localhost:3001/test',
    'http://localhost:3001/health',
    'http://localhost:3001/api',
    'http://localhost:3001/api/tournaments',
    'http://localhost:3001/api/cep/test'
  ];

  for (const url of tests) {
    try {
      const response = await axios.get(url, { timeout: 3000 });
      console.log(`✅ ${url}: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${url}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${url}: ${error.message}`);
      }
    }
  }
}

quickTest();