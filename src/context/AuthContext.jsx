import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Safety timeout to prevent permanent white screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const loginAsDebug = (role = 'admin') => {
    const mockUser = {
      id: 'debug-user-id',
      email: 'debug@prysma.app',
      user_metadata: { role },
      aud: 'authenticated',
      role: 'authenticated'
    };
    setUser(mockUser);
    setLoading(false);
    return mockUser;
  };

  const logout = async () => {
    // Basic sign out from Supabase
    await supabase.auth.signOut();
    // Also clear debug user if any
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginAsDebug,
      logout,
      isAuthenticated: !!user 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
