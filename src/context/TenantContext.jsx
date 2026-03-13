import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { productService } from '../api/productService';
import { orderService } from '../api/orderService';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      const hostname = window.location.hostname;
      const pathSegments = window.location.pathname.split('/');
      
      try {
        let query = supabase.from('tenants').select('*');
        
        // Detection Logic:
        // 1. Custom Domain (hostname)
        // 2. GitHub Pages (hostname includes github.io, use first path segment as slug)
        // 3. Local/Main Domain (use path segment as slug)
        
        if (hostname.includes('github.io')) {
            // In GitHub Pages, the repo name is the first part of the path: user.github.io/repo-name/
            const repoSlug = pathSegments[1];
            query = query.eq('slug', repoSlug);
        } else if (hostname !== 'localhost' && !hostname.includes('prysma.app')) {
            query = query.eq('custom_domain', hostname);
        } else {
            const slug = pathSegments[1] && pathSegments[1] !== 'admin' ? pathSegments[1] : 'default';
            query = query.eq('slug', slug);
        }

        const { data, error } = await query.single();

        if (data) {
          setTenant(data);
          
          // Configure services
          productService.setTenantId(data.id);
          orderService.setTenantId(data.id);

          // Apply theme globally
          const root = document.documentElement;
          root.style.setProperty('--primary-color', data.theme?.primaryColor || '#ea580c');
          root.style.setProperty('--secondary-color', data.theme?.secondaryColor || '#6366f1');
          
          // Apply Branding Font
          if (data.branding?.fontFamily) {
            root.style.setProperty('--font-family', data.branding.fontFamily);
            document.body.style.fontFamily = `'${data.branding.fontFamily}', sans-serif`;
            
            // Dynamically load Google Font if not common
            if (!['Inter', 'Roboto', 'Arial'].includes(data.branding.fontFamily)) {
              const link = document.createElement('link');
              link.href = `https://fonts.googleapis.com/css2?family=${data.branding.fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            }
          }

          if (data.theme?.darkMode) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ 
      tenant, 
      loading, 
      productService, 
      orderService, 
      features: tenant?.features || {},
      branding: tenant?.branding || {},
      contactInfo: tenant?.contact_info || {},
      integrations: tenant?.integrations || {}
    }}>
      {!loading && (
        tenant?.is_active === false ? (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
              <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h1 className="text-3xl font-black text-white">Sitio Desactivado</h1>
              <p className="text-slate-400 font-medium leading-relaxed">
                Este sitio web ha sido desactivado temporalmente por el administrador. 
                Por favor, contacta con soporte si crees que es un error.
              </p>
              <div className="pt-4">
                <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-6 mx-auto opacity-30 grayscale" />
              </div>
            </div>
          </div>
        ) : children
      )}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
