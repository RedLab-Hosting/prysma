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
    accentColor1: '#f59e0b',
    accentColor2: '#10b981',
    accentColor3: '#3b82f6',
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
  const [isSyncingCore, setIsSyncingCore] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
            accentColor1: '#f59e0b',
            accentColor2: '#10b981',
            accentColor3: '#3b82f6',
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

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    if (deleteInput !== tenantToDelete.slug) return;

    setIsDeleting(true);
    try {
      // 1. Delete associated data (Simplified for example - usually handled via RLS or Cascade)
      // Actually tenantService.deleteTenant handles this if cascade is on in DB
      const { error } = await tenantService.deleteTenant(tenantToDelete.id);
      
      if (!error) {
        setShowDeleteConfirm(false);
        setTenantToDelete(null);
        setDeleteInput('');
        fetchTenants();
      } else {
        alert('Error eliminando: ' + error.message);
      }
    } catch (err) {
      alert('Error crítico: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetupCoreSecrets = async () => {
    if (!confirm('Esto configurará automáticamente los secretos (Supabase URL/Key/Token) en el repositorio CORE (prysma) para resolver errores de despliegue. ¿Continuar?')) return;
    
    setIsSyncingCore(true);
    try {
      const results = await githubService.setupCoreSecrets();
      const failed = results.filter(r => !r.success);
      
      if (failed.length === 0) {
        // Trigger build for core
        await githubService.dispatchWorkflow('prysma');
        alert('¡Secretos del Core configurados con éxito! El despliegue se ha reiniciado.');
      } else {
        alert('Error al configurar algunos secretos: ' + failed.map(f => f.error).join(', '));
      }
    } catch (err) {
      alert('Error crítico: ' + err.message);
    } finally {
      setIsSyncingCore(false);
    }
  };

  const openDeleteModal = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteInput('');
    setShowDeleteConfirm(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 selection:bg-orange-500/30 font-sans">
      {/* Background - Simple & Flat */}
      <div className="fixed inset-0 bg-[#0f172a] z-[-1]"></div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-8 w-auto" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex relative">
        {/* Sidebar - Flat & Professional */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-slate-900 border-r border-white/5 p-6 flex flex-col transition-transform duration-200 ease-in-out
        `}>
          <div className="mb-8 px-2 hidden md:block">
            <img src="/assets/prysma_full_logo_white.svg" alt="Prysma" className="h-7 w-auto object-contain" />
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

        {/* Main Content - Improved Scale */}
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Panel de Control</h1>
              <p className="text-slate-500 font-medium text-sm">Gestiona tu ecosistema de franquicias inteligentes</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                onClick={handleSetupCoreSecrets}
                disabled={isSyncingCore}
                className="bg-slate-800 text-white hover:bg-slate-700 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5 disabled:opacity-50"
              >
                {isSyncingCore ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                Configurar Core
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-white text-slate-900 hover:bg-orange-500 hover:text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <Plus size={18} /> 
                Registrar Empresa
              </button>
            </div>
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
                <div key={t.id} className="group relative bg-[#1e293b] p-5 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all hover:bg-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-orange-500/10 transition-colors">
                      <Building2 className="text-slate-500 group-hover:text-orange-500 transition-colors" size={20} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                         t.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                       }`}>
                        {t.is_active ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">{t.name}</h3>
                  <div className="flex flex-col gap-1 mb-6">
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 truncate">
                      <Github size={12} /> /{t.slug}
                    </p>
                    {t.custom_domain && (
                      <a href={t.custom_domain} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-400 font-black transition-colors truncate">
                        <Globe size={12} /> {t.custom_domain.replace('https://', '')}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-3 h-3 rounded-full border border-slate-900 shadow-sm" style={{ backgroundColor: t.theme?.primaryColor || '#ea580c' }}></div>
                        <div className="w-3 h-3 rounded-full border border-slate-900 shadow-sm" style={{ backgroundColor: t.theme?.secondaryColor || '#6366f1' }}></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                       <button 
                        onClick={() => {
                          setEditingTenant(t);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => toggleTenantStatus(t)}
                        className={`p-2 rounded-lg transition-all border ${
                          t.is_active 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                        }`}
                        title={t.is_active ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={14} />
                      </button>
                      <button 
                        onClick={() => handleRepairTenant(t)}
                        className="p-2 bg-white/5 hover:bg-blue-500/10 text-slate-500 hover:text-blue-500 rounded-lg transition-all border border-white/5"
                        title="Fix Plan"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(t)}
                        className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-all border border-white/5"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
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
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-100 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-white/10 relative my-auto shadow-2xl">
              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">Nueva Franquicia</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Configura el núcleo y el despliegue</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-500 hover:text-white bg-white/5 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateTenant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                      <input 
                        type="text" required placeholder="Ej: Burger House"
                        className="w-full bg-slate-950/50 border border-white/10 p-3.5 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none text-white placeholder:text-slate-700 font-bold transition-all text-sm"
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificador Slug</label>
                      <input 
                        type="text" required placeholder="burger-house"
                        className="w-full bg-slate-950/50 border border-white/10 p-3.5 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none text-white placeholder:text-slate-700 font-bold transition-all text-sm"
                        value={newTenant.slug}
                        onChange={(e) => setNewTenant({...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identidad Visual</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: newTenant.primaryColor }}></div>
                        </div>
                        <input 
                          type="text" value={newTenant.primaryColor}
                          onChange={(e) => setNewTenant({...newTenant, primaryColor: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 p-3 pl-10 rounded-xl text-[10px] text-white font-mono uppercase font-bold outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input 
                          type="color" value={newTenant.primaryColor}
                          onChange={(e) => setNewTenant({...newTenant, primaryColor: e.target.value})}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="absolute -top-1.5 left-3 bg-slate-900 px-1.5 text-[7px] font-black text-slate-600 uppercase tracking-tighter">Primario</span>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: newTenant.secondaryColor }}></div>
                        </div>
                        <input 
                          type="text" value={newTenant.secondaryColor}
                          onChange={(e) => setNewTenant({...newTenant, secondaryColor: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 p-3 pl-10 rounded-xl text-[10px] text-white font-mono uppercase font-bold outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <input 
                          type="color" value={newTenant.secondaryColor}
                          onChange={(e) => setNewTenant({...newTenant, secondaryColor: e.target.value})}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="absolute -top-1.5 left-3 bg-slate-900 px-1.5 text-[7px] font-black text-slate-600 uppercase tracking-tighter">Secundario</span>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: newTenant.accentColor1 }}></div>
                        </div>
                        <input 
                          type="text" value={newTenant.accentColor1}
                          onChange={(e) => setNewTenant({...newTenant, accentColor1: e.target.value})}
                          className="w-full bg-slate-950/50 border border-white/10 p-3 pl-10 rounded-xl text-[10px] text-white font-mono uppercase font-bold outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <input 
                          type="color" value={newTenant.accentColor1}
                          onChange={(e) => setNewTenant({...newTenant, accentColor1: e.target.value})}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="absolute -top-1.5 left-3 bg-slate-900 px-1.5 text-[7px] font-black text-slate-600 uppercase tracking-tighter">Acento 1</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Funciones</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(newTenant.features).map((feat) => (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => setNewTenant({
                            ...newTenant,
                            features: { ...newTenant.features, [feat]: !newTenant.features[feat] }
                          })}
                          className={`
                            flex items-center gap-2 p-2.5 rounded-lg border text-[10px] font-bold transition-all
                            ${newTenant.features[feat] 
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' 
                              : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-400'}
                          `}
                        >
                          <CheckCircle2 size={12} className={newTenant.features[feat] ? 'opacity-100' : 'opacity-0'} />
                          {feat.replace('_', ' ').charAt(0).toUpperCase() + feat.replace('_', ' ').slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button 
                      type="submit" disabled={creatingRepo}
                      className="order-1 sm:order-2 flex-1 py-3.5 bg-white text-slate-950 font-black rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      {creatingRepo ? <><Loader2 className="animate-spin" size={18} /> Sincronizando...</> : 'Registrar Empresa'}
                    </button>
                    <button 
                      type="button" onClick={() => setShowModal(false)}
                      className="order-2 sm:order-1 flex-1 py-3.5 text-slate-500 font-bold hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-100 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 relative my-auto overflow-hidden flex flex-col max-h-[95vh]">
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white">{editingTenant.name}</h2>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Gestión de Franquicia</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-1.5 text-slate-500 hover:text-white bg-white/5 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
              </div>

              {/* Tabs Navigation - Compact */}
              <div className="flex px-5 bg-slate-900 overflow-x-auto gap-2 no-scrollbar p-1">
                {[
                  { id: 'general', label: 'General', icon: <LayoutDashboard size={14} /> },
                  { id: 'branding', label: 'Branding', icon: <Plus size={14} /> },
                  { id: 'business', label: 'Negocio', icon: <Building2 size={14} /> },
                  { id: 'integrations', label: 'Integraciones', icon: <Globe size={14} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-[11px] font-black transition-all rounded-lg flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-white/5'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content - Compact Padding */}
              <div className="p-5 flex-1 overflow-y-auto">
                <form id="edit-tenant-form" onSubmit={handleUpdateTenant} className="space-y-6">
                  {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                          <input 
                            type="text" required
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl focus:ring-1 focus:ring-orange-500 outline-none text-white font-bold transition-all text-sm"
                            value={editingTenant.name}
                            onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado</label>
                          <button
                            type="button"
                            onClick={() => setEditingTenant({...editingTenant, is_active: !editingTenant.is_active})}
                            className={`w-full p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                              editingTenant.is_active 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            }`}
                          >
                            <Power size={14} />
                            {editingTenant.is_active ? 'Online' : 'Offline'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Colores (Flat UI)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'primaryColor', label: 'Primario', val: editingTenant.theme?.primaryColor || '#ea580c' },
                            { id: 'secondaryColor', label: 'Secundario', val: editingTenant.theme?.secondaryColor || '#6366f1' },
                            { id: 'accentColor1', label: 'Acento 1', val: editingTenant.theme?.accentColor1 || '#f59e0b' }
                          ].map((c) => (
                            <div key={c.id} className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
                              <input 
                                type="color" 
                                className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer"
                                value={c.val}
                                onChange={(e) => setEditingTenant({
                                  ...editingTenant, 
                                  theme: { ...(editingTenant.theme || {}), [c.id]: e.target.value }
                                })}
                              />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase">{c.label}</span>
                                <span className="text-white font-mono text-[10px] font-bold">{c.val}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Funciones</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(editingTenant.features || {}).map((feat) => (
                            <button
                              key={feat}
                              type="button"
                              onClick={() => setEditingTenant({
                                ...editingTenant,
                                features: { ...(editingTenant.features || {}), [feat]: !editingTenant.features?.[feat] }
                              })}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black border transition-all flex items-center gap-2 ${
                                editingTenant.features?.[feat]
                                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                                  : 'bg-white/5 border-white/5 text-slate-600'
                              }`}
                            >
                              {editingTenant.features?.[feat] && <CheckCircle2 size={12} />}
                              {feat.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'branding' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipografía</label>
                        <select 
                          className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
                          value={editingTenant.branding?.fontFamily || 'Inter'}
                          onChange={(e) => setEditingTenant({
                            ...editingTenant,
                            branding: { ...(editingTenant.branding || {}), fontFamily: e.target.value }
                          })}
                        >
                          <option value="Inter">Inter (Sans)</option>
                          <option value="Outfit">Outfit (Geometric)</option>
                          <option value="Roboto">Roboto (Classic)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logo URL</label>
                          <input 
                            type="text" placeholder="https://..."
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
                            value={editingTenant.branding?.logo_url || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              branding: { ...(editingTenant.branding || {}), logo_url: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Favicon URL</label>
                          <input 
                            type="text" placeholder="https://..."
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
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
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                          <input 
                            type="text" placeholder="+58412..."
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
                            value={editingTenant.contact_info?.whatsapp || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              contact_info: { ...(editingTenant.contact_info || {}), whatsapp: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instagram</label>
                          <input 
                            type="text" placeholder="@usuario"
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
                            value={editingTenant.contact_info?.instagram || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              contact_info: { ...(editingTenant.contact_info || {}), instagram: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección</label>
                        <textarea 
                          rows="2" placeholder="Ubicación física..."
                          className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm resize-none"
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
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Google Analytics</label>
                          <input 
                            type="text" placeholder="G-XXXXXXXXXX"
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
                            value={editingTenant.integrations?.google_analytics_id || ''}
                            onChange={(e) => setEditingTenant({
                              ...editingTenant,
                              integrations: { ...(editingTenant.integrations || {}), google_analytics_id: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">FB Pixel ID</label>
                          <input 
                            type="text" placeholder="1234567890"
                            className="w-full bg-slate-950/50 border border-white/10 p-3 rounded-xl outline-none text-white font-bold text-sm"
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
              <div className="p-4 bg-slate-800/50 border-t border-white/5 flex gap-3">
                  <button 
                    type="button" onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    Cerrar
                  </button>
                  <button 
                    form="edit-tenant-form" type="submit"
                    className="flex-2 bg-white text-slate-950 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-xl font-black transition-all text-sm"
                  >
                    Guardar Cambios
                  </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm && tenantToDelete && (
          <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl p-8 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                  <Trash2 className="text-rose-500" size={32} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Acción Destructiva</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Estás a punto de eliminar permanentemente a <span className="text-white font-black">{tenantToDelete.name}</span>. Todos los productos, pedidos y configuraciones se perderán para siempre.
                </p>
                
                <div className="w-full space-y-4">
                  <div className="text-left">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 block">
                      Escribe <span className="underline">{tenantToDelete.slug}</span> para confirmar
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl focus:ring-1 focus:ring-rose-500 outline-none text-white font-bold transition-all text-center"
                      placeholder={tenantToDelete.slug}
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDeleteTenant}
                      disabled={deleteInput !== tenantToDelete.slug || isDeleting}
                      className={`
                        w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all
                        ${deleteInput === tenantToDelete.slug 
                          ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20' 
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                      `}
                    >
                      {isDeleting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirmar Eliminación'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-3 text-slate-500 font-bold hover:text-white transition-all text-sm"
                    >
                      Mejor no, cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminView;
