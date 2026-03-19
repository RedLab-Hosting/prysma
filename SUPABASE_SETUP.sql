-- SUPABASE_SETUP.sql
-- Base de datos para Prysma Fast Food V2
-- Actualizado: Idempotente (se puede ejecutar varias veces)

-- 1. Tenants Table (Empresas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    theme JSONB DEFAULT '{"primaryColor": "#ea580c", "darkMode": false, "fontFamily": "Inter"}'::jsonb,
    features JSONB DEFAULT '{
        "delivery": true, 
        "pickup": true, 
        "zelle": true, 
        "pago_movil": true, 
        "cash": true,
        "modifiers": true,
        "inventory": false
    }'::jsonb,
    settings JSONB DEFAULT '{
        "whatsapp_number": "",
        "currency_symbol": "$",
        "secondary_currency_symbol": "Bs.",
        "delivery_base_cost": 0,
        "delivery_free_threshold": 0
    }'::jsonb,
    custom_domain TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    -- Branding & Config
    branding JSONB DEFAULT '{
        "fontFamily": "Inter",
        "logo_url": "",
        "favicon_url": ""
    }'::jsonb,
    contact_info JSONB DEFAULT '{
        "whatsapp": "",
        "instagram": "",
        "facebook": "",
        "address": "",
        "opening_hours": {}
    }'::jsonb,
    integrations JSONB DEFAULT '{
        "google_analytics_id": "",
        "fb_pixel_id": "",
        "whatsapp_business_id": "",
        "payment_gateways": {}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Ensure columns exist if table was already created
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{"fontFamily": "Inter", "logo_url": "", "favicon_url": ""}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{"whatsapp": "", "instagram": "", "facebook": "", "address": "", "opening_hours": {}}'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{"google_analytics_id": "", "fb_pixel_id": "", "whatsapp_business_id": "", "payment_gateways": {}}'::jsonb;

-- 2. Profiles Table (Usuarios con Roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id), -- Null for superadmins
    role TEXT CHECK (role IN ('superadmin', 'admin', 'delivery', 'client')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    number BIGSERIAL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    customer_data JSONB,
    items JSONB,
    total DECIMAL(10,2),
    payment_data JSONB,
    delivery_driver_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 6. Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rate DECIMAL(18,8) NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    mode TEXT CHECK (mode IN ('auto', 'manual')) DEFAULT 'auto',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, currency_code)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Help functions (Using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Clean up existing policies to avoid "already exists" errors
-- (Wait for Supabase to support "CREATE OR REPLACE POLICY")
DO $$ 
BEGIN
    -- Exchange Rates
    DROP POLICY IF EXISTS "Public can see exchange rate for tenant" ON exchange_rates;
    DROP POLICY IF EXISTS "Admins can manage exchange rates" ON exchange_rates;
    
    -- Tenants
    DROP POLICY IF EXISTS "SuperAdmins can do everything on tenants" ON tenants;
    DROP POLICY IF EXISTS "Users can see their own tenant" ON tenants;
    DROP POLICY IF EXISTS "Public can see tenant by slug for client view" ON tenants;
    DROP POLICY IF EXISTS "Allow anon to manage tenants in debug" ON tenants;
    
    -- Profiles
    DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can see profiles of their tenant" ON profiles;
    DROP POLICY IF EXISTS "Allow anon to manage profiles in debug" ON profiles;
    
    -- Categories
    DROP POLICY IF EXISTS "Public can see categories for tenant" ON categories;
    DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
    
    -- Products
    DROP POLICY IF EXISTS "Public can see products for tenant" ON products;
    DROP POLICY IF EXISTS "Admins can manage products" ON products;
    
    -- Orders
    DROP POLICY IF EXISTS "Clients can see their own orders" ON orders;
    DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
END $$;

-- Policies for Exchange Rates
CREATE POLICY "Public can see exchange rate for tenant" ON exchange_rates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage exchange rates" ON exchange_rates
    FOR ALL USING (
        tenant_id = get_my_tenant_id()
        AND get_my_role() IN ('admin', 'superadmin')
    )
    WITH CHECK (
        tenant_id = get_my_tenant_id()
        AND get_my_role() IN ('admin', 'superadmin')
    );

-- 🚨 SECURITY WARNING: DEBUG POLICY
-- This allows anyone (anonymous users) to modify exchange rates.
-- REMOVE THIS BEFORE GOING TO PRODUCTION.
CREATE POLICY "DEBUG_Allow anon to manage exchange rates" ON exchange_rates
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Policies for Tenants
CREATE POLICY "SuperAdmins can do everything on tenants" ON tenants
    FOR ALL USING (is_superadmin());

CREATE POLICY "Users can see their own tenant" ON tenants
    FOR SELECT USING (id = get_my_tenant_id());

CREATE POLICY "Public can see tenant by slug for client view" ON tenants
    FOR SELECT USING (true);

-- 🚨 SECURITY WARNING: DEBUG POLICY
-- This allows anyone (anonymous users) to manage tenants.
-- REMOVE THIS BEFORE GOING TO PRODUCTION.
CREATE POLICY "DEBUG_Allow anon to manage tenants in debug" ON tenants
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Policies for Profiles
CREATE POLICY "Users can see their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can see profiles of their tenant" ON profiles
    FOR SELECT USING (
        tenant_id = get_my_tenant_id()
        AND get_my_role() IN ('admin', 'superadmin')
    );

-- 🚨 SECURITY WARNING: DEBUG POLICY
-- This allows anyone (anonymous users) to manage profiles.
-- REMOVE THIS BEFORE GOING TO PRODUCTION.
CREATE POLICY "DEBUG_Allow anon to manage profiles in debug" ON profiles
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Policies for Categories
CREATE POLICY "Public can see categories for tenant" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        tenant_id = get_my_tenant_id()
        AND get_my_role() IN ('admin', 'superadmin')
    );

-- Policies for Products
CREATE POLICY "Public can see products for tenant" ON products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        tenant_id = get_my_tenant_id()
        AND get_my_role() IN ('admin', 'superadmin')
    );

-- Policies for Orders
CREATE POLICY "Clients can see their own orders" ON orders
    FOR SELECT USING (
        customer_data->>'email' = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Tenant isolation for orders" ON orders
    FOR ALL USING (
        tenant_id = get_my_tenant_id()
        OR is_superadmin()
    );
