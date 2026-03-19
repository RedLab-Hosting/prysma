import { supabase } from './supabase';

/**
 * Service to manage exchange rates (BCV) for tenants.
 */
export const exchangeRateService = {
  /**
   * Fetches the current exchange rate for a tenant.
   */
  async getRate(tenantId, currencyCode = 'USD') {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('currency_code', currencyCode)
      .order('last_updated', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    const result = data && data.length > 0 ? data[0] : null;
    if (result && typeof result.rate === 'string') {
      result.rate = parseFloat(result.rate);
    }
    return result;
  },

  /**
   * Updates or creates the exchange rate for a tenant.
   */
  async updateRate(tenantId, rate, mode = 'auto', currencyCode = 'USD') {
    const { data, error } = await supabase
      .from('exchange_rates')
      .upsert(
        { 
          tenant_id: tenantId, 
          rate, 
          mode, 
          currency_code: currencyCode,
          last_updated: new Date().toISOString()
        },
        { onConflict: 'tenant_id,currency_code' }
      )
      .select();

    if (error) {
      console.error("Supabase updateRate error:", error);
      throw error;
    }
    
    const result = data && data.length > 0 ? data[0] : null;
    if (result) {
      result.rate = parseFloat(result.rate);
    }
    return result;
  },

  /**
   * Fetches the current official rate from BCV (www.bcv.org.ve).
   */
  async fetchBCVRate(currencyCode = 'USD') {
    const targetUrl = 'https://www.bcv.org.ve/';
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      
      const html = await response.text();
      const targetId = currencyCode === 'EUR' ? 'euro' : (currencyCode === 'COP' ? null : 'dolar');
      
      if (!targetId) {
        throw new Error(`BCV no provee tasa de ${currencyCode} directamente.`);
      }

      // Refined regex: look for the ID, then the currency code, then the value
      const specificRegex = new RegExp(`id="${targetId}"[\\s\\S]+?<span>\\s*${currencyCode}\\s*<\\/span>[\\s\\S]+?<strong>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i');
      let match = html.match(specificRegex);
      
      // Fallback 1: Just the ID
      if (!match) {
        const idRegex = new RegExp(`id="${targetId}"[\\s\\S]+?<strong>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i');
        match = html.match(idRegex);
      }
      
      // Fallback 2: Just the Code text
      if (!match) {
        const codeRegex = new RegExp(`<span>\\s*${currencyCode}\\s*<\\/span>[\\s\\S]+?<strong>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i');
        match = html.match(codeRegex);
      }
      
      if (match && match[1]) {
        const rateStr = match[1].replace(',', '.').trim();
        const rate = parseFloat(parseFloat(rateStr).toFixed(2));
        if (!isNaN(rate)) return rate;
      }
      
      throw new Error(`No se pudo encontrar la tasa de ${currencyCode} en el BCV`);
    } catch (error) {
      console.error(`Error fetching BCV ${currencyCode} rate:`, error);
      // fallback values if scraping fails
      if (currencyCode === 'COP') return 0.0085; // Experimental fallback for Bs/COP
      return currencyCode === 'EUR' ? 39.50 : 36.50;
    }
  },

  /**
   * Syncs both USD and EUR rates from BCV.
   */
  async syncAllRates(tenantId) {
    const results = await Promise.all([
      this.syncRate(tenantId, 'USD'),
      this.syncRate(tenantId, 'EUR')
    ]);
    // Return the one the user is currently viewing, or just the first one
    return results[0]; 
  },

  /**
   * Logic to trigger update for a specific currency
   */
  async syncRate(tenantId, currencyCode = 'USD') {
    const current = await this.getRate(tenantId, currencyCode);
    
    // Only check mode if the record exists
    if (current && current.mode === 'manual') return current;

    const newRate = await this.fetchBCVRate(currencyCode);
    return await this.updateRate(tenantId, newRate, 'auto', currencyCode);
  }
};
