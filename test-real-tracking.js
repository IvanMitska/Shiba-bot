const axios = require('axios');

async function testTracking() {
  console.log('\n=== TESTING REAL TRACKING ===\n');

  // Test both codes
  const codes = ['74V0PI16', 'a9T8-OYH'];

  for (const code of codes) {
    console.log(`\nTesting code: ${code}`);
    console.log('-'.repeat(40));

    const url = `http://localhost:3000/r/${code}`;
    console.log(`URL: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
          'Referer': 'https://google.com'
        },
        validateStatus: () => true // Accept any status code
      });

      console.log(`✅ Response Status: ${response.status}`);

      if (response.status === 200) {
        console.log('✅ Landing page loaded successfully');
        // Check if tracking script is injected
        if (response.data.includes('partnerCode')) {
          console.log('✅ Tracking script found in response');
        }
      } else if (response.status === 404) {
        console.log('❌ 404 - Partner not found');
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  // Test webapp API
  console.log('\n\nTesting WebApp API...');
  console.log('-'.repeat(40));

  try {
    const apiUrl = `http://localhost:3000/api/webapp/partner/1734337242`;
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        'X-Telegram-Init-Data': 'test'
      },
      validateStatus: () => true
    });

    console.log(`API Status: ${apiResponse.status}`);
    if (apiResponse.status === 200) {
      console.log('Statistics:', apiResponse.data.statistics);
    }
  } catch (error) {
    console.error(`API Error: ${error.message}`);
  }
}

testTracking();