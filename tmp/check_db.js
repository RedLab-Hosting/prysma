import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data: tenants, error: tError } = await supabase.from('tenants').select('id, name, slug')
  console.log('Tenants:', tenants || tError)

  if (tenants && tenants.length > 0) {
    const tenantId = tenants[0].id
    const { data: categories, error: cError } = await supabase.from('categories').select('*').eq('tenant_id', tenantId)
    console.log(`Categories for ${tenants[0].name}:`, categories || cError)

    const { data: products, error: pError } = await supabase.from('products').select('*').eq('tenant_id', tenantId)
    console.log(`Products for ${tenants[0].name}:`, products || pError)
  }
}

check()
