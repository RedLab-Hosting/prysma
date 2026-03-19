import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const LoginView = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { login, loginAsDebug } = useAuth();
  const { tenant } = useTenant();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      // After login, we could check roles, but for now redirecting to admin
      navigate(`/${tenantSlug}/admin`);
    } catch (err) {
      console.error('Login error:', err);
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" style={{ backgroundColor: `var(--primary-color, #ea580c)1a` }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" style={{ backgroundColor: `var(--secondary-color, #6366f1)1a` }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 relative z-10">
          {/* Logo/Tenant Name */}
          <div className="text-center mb-8">
            <button 
              onClick={() => navigate(`/${tenantSlug}`)}
              className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-6 text-sm font-medium"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver a la tienda
            </button>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase mb-2">
              {tenant?.name || 'Prysma'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Accede a tu panel de gestión
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ejemplo.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl outline-none transition-all font-medium placeholder:text-zinc-400"
                  style={{ '--tw-border-opacity': '1', borderColor: 'transparent' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl outline-none transition-all font-medium placeholder:text-zinc-400"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:active:scale-100"
              style={{ backgroundColor: loading ? 'undefined' : 'var(--primary-color, #18181b)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar al Panel
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
            <p className="text-zinc-500 dark:text-zinc-500 text-xs font-medium">
              ¿Olvidaste tu acceso? Contacta al administrador central.
            </p>
            
            {/* Debug Bypass Button */}
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => {
                  loginAsDebug('admin');
                  navigate(`/${tenantSlug}/admin`);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors cursor-pointer opacity-30 hover:opacity-100"
              >
                Bypass Auth (Modo Desarrollo)
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-6 mx-auto opacity-20 dark:invert transition-opacity hover:opacity-100 cursor-pointer" />
        </div>
      </motion.div>
    </div>
  );
};

export default LoginView;
