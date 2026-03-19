import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { productService } from '../api/productService';
import { categoryService } from '../api/categoryService';
import { orderService } from '../api/orderService';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const { tenantSlug } = useParams();
  const location = useLocation();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const hostname = window.location.hostname;
        let slug = tenantSlug;

        // Fallback detection logic for when params are empty or inside non-nested providers
        if (!slug) {
          const pathSegments = location.pathname.split('/');
          // Avoid system routes
          const firstSegment = pathSegments[1];
          if (firstSegment && !['superadmin', 'admin', 'delivery', 'login'].includes(firstSegment)) {
            slug = firstSegment;
          } else {
            slug = 'default';
          }
        }

        console.log(`Detecting tenant for slug: ${slug}, hostname: ${hostname}`);

        let query = supabase.from('tenants').select('*');
        
        if (hostname.includes('github.io')) {
             // In GitHub pages, if we don't have a slug in URL, use the repo name
             query = query.eq('slug', slug);
        } else if (hostname !== 'localhost' && !hostname.includes('prysma.app') && !hostname.includes('vercel.app')) {
            query = query.eq('custom_domain', hostname);
        } else {
            query = query.eq('slug', slug);
        }

        const { data, error: sbError } = await query.maybeSingle();

        if (sbError) throw sbError;

        if (data) {
          setTenant(data);
          
          // Configure services
          productService.setTenantId(data.id);
          categoryService.setTenantId(data.id);
          orderService.setTenantId(data.id);

          // Apply theme globally
          const root = document.documentElement;
          root.style.setProperty('--primary-color', data.theme?.primaryColor || '#ea580c');
          root.style.setProperty('--secondary-color', data.theme?.secondaryColor || '#6366f1');
          root.style.setProperty('--accent-1', data.theme?.accentColor1 || '#f59e0b');
          root.style.setProperty('--accent-2', data.theme?.accentColor2 || '#10b981');
          root.style.setProperty('--accent-3', data.theme?.accentColor3 || '#3b82f6');
          
          if (data.branding?.fontFamily) {
            root.style.setProperty('--font-family', data.branding.fontFamily);
            document.body.style.fontFamily = `'${data.branding.fontFamily}', sans-serif`;
          }

          // Force light mode for now as requested
          root.classList.remove('dark');
        } else {
          console.warn(`No tenant found for slug: ${slug}`);
          setError('Tenant not found');
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Cargando experiencia...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto border border-zinc-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Empresa no encontrada</h1>
          <p className="text-zinc-500 font-medium">
            No pudimos encontrar la configuración para esta tienda. Verifica el enlace o contacta con soporte.
          </p>
          <a href="/superadmin" className="inline-block px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm">
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  if (tenant.is_active === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white">Sitio Desactivado</h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            Este sitio web ha sido desactivado temporalmente por el administrador. 
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ 
      tenant, 
      loading, 
      productService, 
      categoryService,
      orderService, 
      features: tenant?.features || {},
      branding: tenant?.branding || {},
      contactInfo: tenant?.contact_info || {},
      integrations: tenant?.integrations || {}
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
