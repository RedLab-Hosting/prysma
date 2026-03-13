import React, { useState, useEffect } from 'react';
import { tenantService } from '../../api/tenantService';
import { githubService } from '../../api/githubService';
import { Plus, Building2, LayoutDashboard, Settings, Loader2, Globe, Github } from 'lucide-react';

const SuperAdminView = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    slug: '', 
    primaryColor: '#ea580c',
    customDomain: '' 
  });

  const [creatingRepo, setCreatingRepo] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await tenantService.getAllTenants();
    if (data) setTenants(data);
    setLoading(false);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setCreatingRepo(true);
    
    try {
        // 1. Create Repository on GitHub
        const repoName = newTenant.slug;
        const repoData = await githubService.createCompanyRepo(repoName, `Prysma store for ${newTenant.name}`);
        
        // 2. Create entry in Supabase
        const updatedTenant = { 
            ...newTenant, 
            customDomain: `https://redlab-hosting.github.io/${repoName}/` // Default to GH Pages link
        };
        
        const { data, error } = await tenantService.createTenant(updatedTenant);
        
        if (!error) {
          setShowModal(false);
          fetchTenants();
          setNewTenant({ name: '', slug: '', primaryColor: '#ea580c', customDomain: '' });
        } else {
          alert('Error en Supabase: ' + error.message);
        }
    } catch (err) {
        alert('Error creando Repo en GitHub: ' + err.message);
    } finally {
        setCreatingRepo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-orange-500/30">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 p-8 hidden md:flex flex-col h-screen sticky top-0">
          <div className="mb-12 px-2">
            <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-10 w-auto" />
          </div>

          <nav className="space-y-2 flex-1">
            <a href="#" className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all">
              <LayoutDashboard size={20} /> <span className="font-semibold">Empresas</span>
            </a>
            <a href="#" className="flex items-center gap-3 p-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
              <Settings size={20} className="group-hover:rotate-45 transition-transform" /> 
              <span className="font-medium">Configuración Global</span>
            </a>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1 leading-relaxed">Soporte técnico</p>
                <button className="text-sm font-semibold text-orange-500 hover:text-orange-400">Contactar a RedLab</button>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Panel de Control</h1>
              <p className="text-slate-400 font-medium">Gestiona tu ecosistema de franquicias inteligentes</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="group bg-white text-slate-900 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform" /> 
              Registrar Empresa
            </button>
          </header>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-500/20 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-t-orange-500 rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="text-slate-500 font-medium animate-pulse">Sincronizando con Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {tenants.map((t) => (
                <div key={t.id} className="group relative bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-all hover:shadow-2xl hover:shadow-orange-500/10 overflow-hidden">
                  {/* Card Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl group-hover:opacity-100 transition-opacity opacity-0"></div>

                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-colors">
                      <Building2 className="text-slate-400 group-hover:text-orange-500 transition-colors" size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-[10px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-widest border border-emerald-500/20">
                        Online
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors">{t.name}</h3>
                  <div className="flex flex-col gap-1 mb-8">
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                      <Github size={14} /> /{t.slug}
                    </p>
                    {t.custom_domain && (
                      <a href={t.custom_domain} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        <Globe size={14} /> {t.custom_domain.replace('https://', '')}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: t.theme?.primaryColor || '#ea580c' }}></div>
                      <span className="text-xs font-bold text-slate-500">Tema Visual</span>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-orange-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all border border-white/5 hover:border-orange-500">
                      Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal Nueva Empresa */}
        {showModal && (
          <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Modal Decoration */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[80px] rounded-full"></div>

              <div className="relative">
                <h2 className="text-3xl font-black text-white mb-2">Nueva Franquicia</h2>
                <p className="text-slate-400 mb-8 font-medium">Configura el núcleo y el repositorio de despliegue.</p>
                
                <form onSubmit={handleCreateTenant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                      <input 
                        type="text" required placeholder="Ej: Burger House"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder:text-slate-600 font-bold transition-all"
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Slug ID</label>
                      <input 
                        type="text" required placeholder="burger-house"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder:text-slate-600 font-bold transition-all"
                        value={newTenant.slug}
                        onChange={(e) => setNewTenant({...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Dominio Personalizado</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-4.5 text-slate-600" size={20} />
                      <input 
                        type="text" placeholder="menu.tudominio.com"
                        className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder:text-slate-600 font-bold transition-all"
                        value={newTenant.customDomain}
                        onChange={(e) => setNewTenant({...newTenant, customDomain: e.target.value.toLowerCase()})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Identidad Visual</label>
                    <input 
                      type="color" 
                      className="w-full h-14 bg-white/5 border border-white/10 p-2 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
                      value={newTenant.primaryColor}
                      onChange={(e) => setNewTenant({...newTenant, primaryColor: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-slate-400 font-bold hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" disabled={creatingRepo}
                      className="flex-1 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-orange-500 hover:text-white flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/10"
                    >
                      {creatingRepo ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Creando...</span>
                          </>
                      ) : (
                          'Confirmar Registro'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminView;
