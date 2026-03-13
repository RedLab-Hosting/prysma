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
          
          // Configure services with the tenant ID
          productService.setTenantId(data.id);
          orderService.setTenantId(data.id);

          // Apply theme globally
          document.documentElement.style.setProperty('--primary-color', data.theme.primaryColor || '#ea580c');
          if (data.theme.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
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
    <TenantContext.Provider value={{ tenant, loading, productService, orderService, features: tenant?.features || {} }}>
      {!loading && children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
