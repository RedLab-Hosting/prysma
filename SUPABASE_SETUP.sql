-- SUPABASE_SETUP.sql
-- Base de datos para Prysma Fast Food V2

-- 1. Tenants Table (Empresas)
CREATE TABLE tenants (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Table (Usuarios con Roles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id), -- Null for superadmins
    role TEXT CHECK (role IN ('superadmin', 'admin', 'delivery', 'client')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Products Table
CREATE TABLE products (
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
CREATE TABLE orders (
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
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rate DECIMAL(10,4) NOT NULL,
    mode TEXT CHECK (mode IN ('auto', 'manual')) DEFAULT 'auto',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for exchange rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can see exchange rate for tenant" ON exchange_rates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage exchange rates" ON exchange_rates
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
        AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Help function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Tenants
CREATE POLICY "SuperAdmins can do everything on tenants" ON tenants
    FOR ALL USING (is_superadmin());

CREATE POLICY "Users can see their own tenant" ON tenants
    FOR SELECT USING (
        id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
    );

CREATE POLICY "Public can see tenant by slug for client view" ON tenants
    FOR SELECT USING (true);

-- Policies for Profiles
CREATE POLICY "Users can see their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can see profiles of their tenant" ON profiles
    FOR SELECT USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
        AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Policies for Categories
CREATE POLICY "Public can see categories for tenant" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
        AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Policies for Products
CREATE POLICY "Public can see products for tenant" ON products
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
        AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Policies for Orders
CREATE POLICY "Clients can see their own orders" ON orders
    FOR SELECT USING (
        customer_data->>'email' = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Tenant isolation for orders" ON orders
    FOR ALL USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid())
        OR is_superadmin()
    );
