const https = require('https');

const supabaseUrl = 'https://mxeeqeockottpsthqbtu.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWVxZW9ja290dHBzdGhxYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDU1NTMsImV4cCI6MjA4ODkyMTU1M30.xrd82gszKKysa8jFnb2aH40mBAH4nA4d3mwVZvVRLcE';

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mxeeqeockottpsthqbtu.supabase.co',
      path: '/rest/v1' + path,
      method: method,
      headers: {
        'apikey': apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seed() {
  try {
    console.log('Checking for demo tenant...');
    let tenants = await request('/tenants?slug=eq.demo', 'GET');
    let tenant;
    
    if (tenants.length === 0) {
      console.log('Creating demo tenant...');
      tenant = (await request('/tenants', 'POST', {
        name: 'Demo Company',
        slug: 'demo',
        theme: { primaryColor: '#ea580c', darkMode: false, fontFamily: 'Inter' }
      }))[0];
    } else {
      tenant = tenants[0];
    }
    console.log('Tenant:', tenant.id);

    console.log('Checking for categories...');
    let categories = await request(`/categories?tenant_id=eq.${tenant.id}`, 'GET');
    let category;
    if (categories.length === 0) {
      console.log('Creating category...');
      category = (await request('/categories', 'POST', {
        tenant_id: tenant.id,
        name: 'Hamburguesas',
        icon: '🍔'
      }))[0];
    } else {
      category = categories[0];
    }
    console.log('Category:', category.id);

    console.log('Checking for products...');
    let products = await request(`/products?tenant_id=eq.${tenant.id}`, 'GET');
    if (products.length === 0) {
      console.log('Creating product...');
      await request('/products', 'POST', {
        tenant_id: tenant.id,
        category_id: category.id,
        name: 'Classic Burger',
        price: 8.50,
        description: 'Carne 200g, queso cheddar, lechuga, tomate y salsa especial.',
        is_available: true
      });
    }
    console.log('Seed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

seed();
