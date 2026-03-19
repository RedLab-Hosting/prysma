import { supabase } from './supabase';

export const tenantService = {
  /**
   * Creates a new tenant (company) in the database
   */
  async createTenant(tenantData) {
    const { name, slug, customDomain, primaryColor, secondaryColor, accentColor1, accentColor2, accentColor3, features } = tenantData;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            name,
            slug,
            custom_domain: customDomain || null,
            theme: {
              primaryColor: primaryColor || '#ea580c',
              secondaryColor: secondaryColor || '#6366f1',
              accentColor1: accentColor1 || '#f59e0b',
              accentColor2: accentColor2 || '#10b981',
              accentColor3: accentColor3 || '#3b82f6',
              darkMode: false,
              fontFamily: 'Inter'
            },
            features: features || {
              delivery: true,
              pickup: true,
              zelle: true,
              pago_movil: true,
              cash: true,
              modifiers: true,
              inventory: false
            },
            branding: {
              fontFamily: 'Inter',
              logo_url: '',
              favicon_url: ''
            },
            contact_info: {
              whatsapp: '',
              instagram: '',
              facebook: '',
              address: '',
              opening_hours: {}
            },
            integrations: {
              google_analytics_id: '',
              fb_pixel_id: '',
              whatsapp_business_id: '',
              payment_gateways: {}
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating tenant:', error);
      return { data: null, error };
    }
  },

  /**
   * Fetches all tenants for the Super Admin
   */
  async getAllTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  /**
   * Updates an existing tenant
   */
  async updateTenant(id, tenantData) {
    const { data, error } = await supabase
      .from('tenants')
      .update(tenantData)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Deletes a tenant
   */
  async deleteTenant(id) {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
