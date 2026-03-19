const https = require('https');

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWVxZW9ja290dHBzdGhxYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDU1NTMsImV4cCI6MjA4ODkyMTU1M30.xrd82gszKKysa8jFnb2aH40mBAH4nA4d3mwVZvVRLcE';

const options = {
  hostname: 'mxeeqeockottpsthqbtu.supabase.co',
  path: '/rest/v1/products?select=*',
  method: 'GET',
  headers: {
    'apikey': apiKey,
    'Authorization': 'Bearer ' + apiKey
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('All Products:', data);
  });
});
