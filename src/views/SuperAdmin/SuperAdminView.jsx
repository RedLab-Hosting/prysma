import React, { useState, useEffect } from 'react';
import { tenantService } from '../../api/tenantService';
import { githubService } from '../../api/githubService';
import { Plus, Building2, LayoutDashboard, Settings, Loader2, Globe, Github, Menu, X, CheckCircle2, Power, Edit3, Trash2, RefreshCw } from 'lucide-react';

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
  const [editingTenant, setEditingTenant] = useState(null); // The tenant being edited
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, branding, business, integrations

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
        // 1. Create Repository on GitHub (Template Generation)
        const repoName = newTenant.slug;
        await githubService.createCompanyRepo(repoName, `Prysma store for ${newTenant.name}`);
        
        // 2. Automate GitHub Secrets Setup
        // We do this immediately after repo creation
        await githubService.setupTenantSecrets(repoName);

        // 3. Automate GitHub Pages Deployment (Source: Actions)
        // Small delay to allow GH to process the repo
        setTimeout(async () => {
          await githubService.enablePages(repoName);
          await githubService.dispatchWorkflow(repoName);
        }, 3000);

        // 4. Create entry in Supabase
        const updatedTenant = { 
            ...newTenant, 
            customDomain: `https://${githubService.owner.toLowerCase()}.github.io/${repoName}/` 
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

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      const { data, error } = await tenantService.updateTenant(editingTenant.id, {
        name: editingTenant.name,
        custom_domain: editingTenant.custom_domain,
        theme: editingTenant.theme,
        features: editingTenant.features,
        branding: editingTenant.branding,
        contact_info: editingTenant.contact_info,
        integrations: editingTenant.integrations,
        is_active: editingTenant.is_active
      });

      if (!error) {
        setShowEditModal(false);
        fetchTenants();
      } else {
        alert('Error actualizando: ' + error.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const toggleTenantStatus = async (tenant) => {
    const newStatus = !tenant.is_active;
    const { error } = await tenantService.updateTenant(tenant.id, { is_active: newStatus });
    if (!error) {
      fetchTenants();
    }
  };

  const handleRepairTenant = async (tenant) => {
    if (!confirm(`¿Deseas sincronizar los secretos y el despliegue de ${tenant.name}?`)) return;
    
    setLoading(true);
    try {
      await githubService.setupTenantSecrets(tenant.slug);
      await githubService.enablePages(tenant.slug);
      
      // Manually trigger the first build
      await githubService.dispatchWorkflow(tenant.slug);
      
      alert('Sincronización completada. El despliegue se ha iniciado en GitHub.');
    } catch (err) {
      alert('Error en sincronización: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
      const { error } = await tenantService.deleteTenant(id);
      if (!error) fetchTenants();
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
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setEditingTenant(t);
                          setShowEditModal(true);
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-white/5"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => toggleTenantStatus(t)}
                        className={`p-2.5 rounded-xl transition-all border ${
                          t.is_active 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                        }`}
                        title={t.is_active ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={16} />
                      </button>
                      <button 
                        onClick={() => handleRepairTenant(t)}
                        className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-500 hover:text-blue-500 rounded-xl transition-all border border-white/5"
                        title="Sincronizar Repositorio (Fix)"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTenant(t.id)}
                        className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-white/5"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        {/* Modal Editar Empresa */}
        {showEditModal && editingTenant && (
          <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center p-4 z-100 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-white/10 relative my-8 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 md:p-10 pb-0 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2 line-clamp-1">{editingTenant.name}</h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Configuración avanzada de la franquicia.</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex px-6 md:px-10 mt-6 border-b border-white/5 overflow-x-auto gap-4 no-scrollbar">
                {[
                  { id: 'general', label: 'General', icon: <LayoutDashboard size={16} /> },
                  { id: 'branding', label: 'Branding', icon: <LayoutDashboard size={16} /> }, // Using generic icon for now
                  { id: 'business', label: 'Negocio', icon: <Building2 size={16} /> },
                  { id: 'integrations', label: 'Integraciones', icon: <Globe size={16} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-orange-500 text-orange-500' 
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                <form id="edit-tenant-form" onSubmit={handleUpdateTenant} className="space-y-8">
                  {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                          <input 
                            type="text" required
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.name}
                            onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado del Sitio</label>
                          <button
                            type="button"
                            onClick={() => setEditingTenant({...editingTenant, is_active: !editingTenant.is_active})}
                            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all ${
                              editingTenant.is_active 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            }`}
                          >
                            <Power size={18} />
                            {editingTenant.is_active ? 'Sitio Activo' : 'Sitio Desactivado'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Colores del Tema</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Primary and Secondary Color Pickers */}
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <input 
                              type="color" 
                              className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                              value={editingTenant.theme?.primaryColor || '#ea580c'}
                              onChange={(e) => setEditingTenant({
                                ...editingTenant, 
                                theme: { ...(editingTenant.theme || {}), primaryColor: e.target.value }
                              })}
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Primario</span>
                              <span className="text-white font-mono text-sm">{editingTenant.theme?.primaryColor || '#ea580c'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <input 
                              type="color" 
                              className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                              value={editingTenant.theme?.secondaryColor || '#6366f1'}
                              onChange={(e) => setEditingTenant({
                                ...editingTenant, 
                                theme: { ...(editingTenant.theme || {}), secondaryColor: e.target.value }
                              })}
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Secundario</span>
                              <span className="text-white font-mono text-sm">{editingTenant.theme?.secondaryColor || '#6366f1'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Funciones del Módulo</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(editingTenant.features || {}).map((feat) => (
                            <button
                              key={feat}
                              type="button"
                              onClick={() => setEditingTenant({
                                ...editingTenant,
                                features: { ...(editingTenant.features || {}), [feat]: !editingTenant.features?.[feat] }
                              })}
                              className={`px-6 py-3 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                                editingTenant.features?.[feat]
                                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                                  : 'bg-white/5 border-white/10 text-slate-500'
                              }`}
                            >
                              {editingTenant.features?.[feat] && <CheckCircle2 size={14} />}
                              {feat.charAt(0).toUpperCase() + feat.slice(1).replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'branding' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipografía (Google Fonts)</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                          value={editingTenant.branding?.fontFamily || 'Inter'}
                          onChange={(e) => setEditingTenant({
                            ...editingTenant,
                            branding: { ...(editingTenant.branding || {}), fontFamily: e.target.value }
                          })}
                        >
                          <option value="Inter">Inter (Sleek Sans)</option>
                          <option value="Roboto">Roboto (Classic Sans)</option>
                          <option value="Montserrat">Montserrat (Modern Sans)</option>
                          <option value="Playfair Display">Playfair Display (Premium Serif)</option>
                          <option value="Outfit">Outfit (Clean Geometric)</option>
                          <option value="Space Grotesk">Space Grotesk (Tech Quirky)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL del Logo (Light/Dark)</label>
                          <input 
                            type="text"
                            placeholder="https://.../logo.png"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.branding?.logo_url || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              branding: { ...(editingTenant.branding || {}), logo_url: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL del Favicon</label>
                          <input 
                            type="text"
                            placeholder="https://.../favicon.ico"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.branding?.favicon_url || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              branding: { ...(editingTenant.branding || {}), favicon_url: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'business' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp de Pedidos</label>
                          <input 
                            type="text" placeholder="+584120000000"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.contact_info?.whatsapp || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              contact_info: { ...(editingTenant.contact_info || {}), whatsapp: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instagram (@usuario)</label>
                          <input 
                            type="text" placeholder="@burgerhouse"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.contact_info?.instagram || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              contact_info: { ...(editingTenant.contact_info || {}), instagram: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Física</label>
                        <textarea 
                          rows="2"
                          placeholder="Calle principal, CC Sambil, Nivel 2..."
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all resize-none"
                          value={editingTenant.contact_info?.address || ''}
                          onChange={(e) => setEditingTenant({
                            ...editingTenant,
                            contact_info: { ...(editingTenant.contact_info || {}), address: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'integrations' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-4">
                         <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4 items-center">
                            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
                               <Globe size={20} />
                            </div>
                            <p className="text-xs text-blue-200 leading-relaxed font-medium">
                               Conecta herramientas de terceros para medir el éxito de la franquicia.
                            </p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Google Analytics (UA/G-)</label>
                          <input 
                            type="text" placeholder="G-XXXXXXXXXX"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.integrations?.google_analytics_id || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              integrations: { ...(editingTenant.integrations || {}), google_analytics_id: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Facebook Pixel ID</label>
                          <input 
                            type="text" placeholder="1234567890"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-white font-bold transition-all"
                            value={editingTenant.integrations?.fb_pixel_id || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              integrations: { ...(editingTenant.integrations || {}), fb_pixel_id: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-10 bg-slate-800/50 border-t border-white/5 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cerrar
                  </button>
                  <button 
                    form="edit-tenant-form"
                    type="submit"
                    className="flex-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-orange-500/20"
                  >
                    Guardar Cambios
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminView;
