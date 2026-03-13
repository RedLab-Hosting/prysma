import React, { useState, useEffect } from 'react';
import { tenantService } from '../../api/tenantService';
import { githubService } from '../../api/githubService';
import { Plus, Building2, LayoutDashboard, Settings, Loader2, Globe, Github, Menu, X, CheckCircle2 } from 'lucide-react';

const SuperAdminView = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    slug: '', 
    primaryColor: '#ea580c',
    secondaryColor: '#6366f1',
    customDomain: '',
    features: {
      delivery: true,
      pickup: true,
      zelle: true,
      pago_movil: true,
      cash: true,
      modifiers: true,
      inventory: false
    }
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
          setNewTenant({ 
            name: '', 
            slug: '', 
            primaryColor: '#ea580c', 
            secondaryColor: '#6366f1',
            customDomain: '',
            features: {
              delivery: true,
              pickup: true,
              zelle: true,
              pago_movil: true,
              cash: true,
              modifiers: true,
              inventory: false
            }
          });
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-orange-500/30 font-sans">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[80%] md:w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[80%] md:w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-8 w-auto" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex relative z-10">
        {/* Sidebar - Desktop & Mobile Overlay */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:sticky top-0 left-0 z-40 w-72 h-screen bg-slate-900 md:bg-slate-900/50 backdrop-blur-xl border-r border-white/5 p-8 flex flex-col transition-transform duration-300 ease-in-out
        `}>
          <div className="mb-12 px-2 hidden md:block">
            <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-10 w-auto" />
          </div>

          <nav className="space-y-2 flex-1">
            <a href="#" className="flex items-center gap-3 p-3.5 bg-linear-to-r from-orange-600 to-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all">
              <LayoutDashboard size={20} /> <span className="font-semibold">Empresas</span>
            </a>
            <a href="#" className="flex items-center gap-3 p-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
              <Settings size={20} className="group-hover:rotate-45 transition-transform" /> 
              <span className="font-medium">Configuración Global</span>
            </a>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1 leading-relaxed text-center md:text-left">Soporte técnico</p>
                <button className="w-full text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors">Contactar a RedLab</button>
             </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-12 overflow-x-hidden">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Panel de Control</h1>
              <p className="text-slate-400 font-medium text-sm md:text-base">Gestiona tu ecosistema de franquicias inteligentes</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full lg:w-auto group bg-white text-slate-900 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {tenants.map((t) => (
                <div key={t.id} className="group relative bg-slate-900/40 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-4xl border border-white/5 hover:border-orange-500/30 transition-all hover:shadow-2xl hover:shadow-orange-500/10 overflow-hidden">
                  {/* Card Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-orange-500/10 to-transparent blur-2xl group-hover:opacity-100 transition-opacity opacity-0"></div>

                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-colors">
                      <Building2 className="text-slate-400 group-hover:text-orange-500 transition-colors" size={24} md:size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-[10px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-widest border border-emerald-500/20">
                        Online
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">{t.name}</h3>
                  <div className="flex flex-col gap-1 mb-6 md:mb-8">
                    <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2 truncate">
                      <Github size={14} /> /{t.slug}
                    </p>
                    {t.custom_domain && (
                      <a href={t.custom_domain} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] md:text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors truncate">
                        <Globe size={14} /> {t.custom_domain.replace('https://', '')}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full border border-slate-900 shadow-sm" style={{ backgroundColor: t.theme?.primaryColor || '#ea580c' }}></div>
                        <div className="w-4 h-4 rounded-full border border-slate-900 shadow-sm" style={{ backgroundColor: t.theme?.secondaryColor || '#6366f1' }}></div>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500">Config</span>
                    </div>
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-orange-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all border border-white/5 hover:border-orange-500">
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
          <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center p-4 z-100 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/10 relative my-8">
              {/* Modal Decoration */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="relative">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Nueva Franquicia</h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Configura el núcleo y el despliegue.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateTenant} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                      <input 
                        type="text" required placeholder="Ej: Burger House"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder:text-slate-600 font-bold transition-all"
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificador de Repo (Slug)</label>
                      <input 
                        type="text" required placeholder="burger-house"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder:text-slate-600 font-bold transition-all"
                        value={newTenant.slug}
                        onChange={(e) => setNewTenant({...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identidad Visual (Colores)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: newTenant.primaryColor }}></div>
                        </div>
                        <input 
                          type="text" value={newTenant.primaryColor}
                          onChange={(e) => setNewTenant({...newTenant, primaryColor: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <input 
                          type="color" value={newTenant.primaryColor}
                          onChange={(e) => setNewTenant({...newTenant, primaryColor: e.target.value})}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="absolute -top-2 left-4 bg-slate-900 px-2 text-[8px] font-black text-slate-600 uppercase tracking-tighter">Primario</span>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: newTenant.secondaryColor }}></div>
                        </div>
                        <input 
                          type="text" value={newTenant.secondaryColor}
                          onChange={(e) => setNewTenant({...newTenant, secondaryColor: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input 
                          type="color" value={newTenant.secondaryColor}
                          onChange={(e) => setNewTenant({...newTenant, secondaryColor: e.target.value})}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="absolute -top-2 left-4 bg-slate-900 px-2 text-[8px] font-black text-slate-600 uppercase tracking-tighter">Secundario</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Funciones del Ecosistema</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.keys(newTenant.features).map((feat) => (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => setNewTenant({
                            ...newTenant,
                            features: { ...newTenant.features, [feat]: !newTenant.features[feat] }
                          })}
                          className={`
                            flex items-center gap-2 p-3 rounded-xl border text-[10px] md:text-xs font-black transition-all
                            ${newTenant.features[feat] 
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' 
                              : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-400'}
                          `}
                        >
                          <CheckCircle2 size={14} className={newTenant.features[feat] ? 'opacity-100' : 'opacity-0'} />
                          {feat.replace('_', ' ').charAt(0).toUpperCase() + feat.replace('_', ' ').slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      type="submit" disabled={creatingRepo}
                      className="order-1 sm:order-2 flex-1 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-orange-500 hover:text-white flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/10"
                    >
                      {creatingRepo ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Sincronizando...</span>
                          </>
                      ) : (
                          'Registrar Franquicia'
                      )}
                    </button>
                    <button 
                      type="button" onClick={() => setShowModal(false)}
                      className="order-2 sm:order-1 flex-1 py-4 text-slate-500 font-bold hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                    >
                      Cancelar
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
