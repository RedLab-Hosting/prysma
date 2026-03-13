import { supabase } from './supabase';

export const tenantService = {
  /**
   * Creates a new tenant (company) in the database
   */
  async createTenant(tenantData) {
    const { name, slug, customDomain, primaryColor, secondaryColor, features } = tenantData;

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
            settings: {
              whatsapp_number: "",
              currency_symbol: "$",
              secondary_currency_symbol: "Bs.",
              delivery_base_cost: 0,
              delivery_free_threshold: 0
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
  }
};
