import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { 
  Plus, Package, Clock, DollarSign, Settings, RefreshCw, 
  BarChart3, ChevronRight, Edit2, Trash2, Eye, EyeOff, Search, Menu, X, CheckCircle2 
} from 'lucide-react';
import { exchangeRateService } from '../../api/exchangeRateService';
import { motion, AnimatePresence } from 'framer-motion';
import ProductModal from '../../components/Admin/ProductModal';

const AdminDashboardView = () => {
  const { tenant, productService } = useTenant();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [exchangeRate, setExchangeRate] = useState({ rate: 36.50, mode: 'auto', currency_code: 'USD' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [orderStatusFilter, setOrderStatusFilter] = useState('entrantes');

  useEffect(() => {
    if (tenant) {
      loadAdminData();
    }
  }, [tenant]);

  const currencySymbols = { 'USD': '$', 'EUR': '€', 'COP': '$' };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-VE', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const handleCurrencyChange = async (code) => {
    if (!tenant?.id) return;
    try {
      const data = await exchangeRateService.getRate(tenant.id, code);
      if (data) {
        setExchangeRate(data);
      } else {
        let defaultRate = 36.50;
        if (code === 'EUR') defaultRate = 39.50;
        if (code === 'COP') defaultRate = 0.0085;
        setExchangeRate({ rate: defaultRate, mode: 'auto', currency_code: code });
      }
    } catch (err) {
      console.error("Error fetching rate for", code, err);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const rate = await exchangeRateService.getRate(tenant.id);
      if (rate) setExchangeRate(rate);

      // Enhanced mock orders
      setOrders([
        { id: '01', customer: 'Juan Pérez', items: 'Hamburguesas • Pizzas', totalUSD: 24.50, status: 'entrantes', time: '5 mins' },
        { id: '02', customer: 'Maria García', items: 'Bebidas • Postres', totalUSD: 12.00, status: 'pendiente', time: '15 mins' },
        { id: '03', customer: 'Carlos Ruiz', items: 'Pizzas', totalUSD: 18.50, status: 'asignado', time: '2 mins' },
        { id: '04', customer: 'Ana López', items: 'Hamburguesas', totalUSD: 9.00, status: 'entregando', time: 'Active' },
        { id: '05', customer: 'Pedro Soto', items: 'Completo', totalUSD: 45.00, status: 'entregados', time: 'Ayer' },
      ]);

      // Enhanced mock products
      setProducts([
        { 
          id: 'p1', 
          sku: 'HAM-001', 
          name: 'Classic Burger', 
          category: 'Hamburguesas', 
          price: 8.50, 
          is_available: true, 
          images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400'],
          modifiers: [{ name: 'Extra Queso', extraPrice: 1.50 }]
        },
        { 
          id: 'p2', 
          sku: 'PIZ-002', 
          name: 'Pepperoni Pizza', 
          category: 'Pizzas', 
          price: 12.00, 
          is_available: true, 
          images: ['https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400'],
          modifiers: []
        },
        { 
          id: 'p3', 
          sku: 'BEB-003', 
          name: 'Coca-Cola', 
          category: 'Bebidas', 
          price: 1.50, 
          is_available: false, 
          images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400'],
          modifiers: []
        },
      ]);
    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const [orders, setOrders] = useState([]);

  const handleSyncRate = async () => {
    if (!tenant?.id) return;
    try {
      setLoading(true);
      await exchangeRateService.syncAllRates(tenant.id);
      const updated = await exchangeRateService.getRate(tenant.id, exchangeRate.currency_code);
      if (updated) setExchangeRate(updated);
      // Removed success alert as requested
    } catch (err) {
      console.error("Error syncing rates", err);
      alert('Error al sincronizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = (formData) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
    } else {
      setProducts([...products, { ...formData, id: `p${Date.now()}` }]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const toggleAvailability = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, is_available: !p.is_available } : p));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredProducts = sortedProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveConfig = () => {
    // Save to tenant or individual service
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // alert('Configuración guardada correctamente');
    }, 800);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-10 px-2 lg:px-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl rotate-3 flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
            <Settings className="animate-spin-slow" size={20} />
          </div>
          <h2 className="font-black text-zinc-900 tracking-tighter text-xl">Prysma <span className="text-[10px] text-zinc-400 font-bold block bg-zinc-100 px-2 rounded-full w-fit">ADMIN</span></h2>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-zinc-400 border border-zinc-100 rounded-xl">
          <X size={20} />
        </button>
      </div>
      
      <nav className="space-y-1.5 flex-1">
        {[
          { id: 'pedidos', label: 'Pedidos', icon: Clock, subItems: [
            { id: 'entrantes', label: 'Entrantes' },
            { id: 'pendiente', label: 'Pendiente' },
            { id: 'asignado', label: 'Asignado' },
            { id: 'entregando', label: 'Entregando' },
            { id: 'entregados', label: 'Entregados' }
          ]},
          { id: 'productos', label: 'Productos', icon: Package },
          { id: 'config', label: 'Configuración', icon: Settings },
          { id: 'reportes', label: 'Reportes', icon: BarChart3 }
        ].map(item => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => {
                setActiveTab(item.id);
                if (!item.subItems) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl font-black text-sm transition-all relative overflow-hidden group ${
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white translate-x-1' 
                  : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'pedidos' && (
                <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}>3</span>
              )}
              {activeTab === item.id && (
                <motion.div layoutId="active-nav" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" style={{ backgroundColor: 'var(--primary-color)' }} />
              )}
            </button>
            
            {item.subItems && activeTab === item.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pl-12 space-y-1 mt-1"
              >
                {item.subItems.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setOrderStatusFilter(sub.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === sub.id 
                        ? 'text-primary bg-primary/5' 
                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                    }`}
                    style={orderStatusFilter === sub.id ? { color: 'var(--primary-color)', backgroundColor: 'var(--primary-color)10' } : {}}
                  >
                    {sub.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-zinc-100">
        <div className="bg-zinc-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-200 rounded-xl overflow-hidden">
             {tenant?.branding?.logo_url && <img src={tenant.branding.logo_url} className="w-full h-full object-cover" />}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs truncate text-zinc-900">{tenant?.name || 'Invitado'}</p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{tenant?.slug || 'demo'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg" style={{ backgroundColor: 'var(--primary-color)' }} />
          <h2 className="font-black text-zinc-900 tracking-tighter">Prysma Admin</h2>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 border border-zinc-100 rounded-xl text-zinc-500">
          <Menu size={24} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 bg-white border-r border-zinc-200 p-8 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white p-8 z-60 md:hidden border-l border-zinc-100"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 p-4 md:p-12 lg:p-16 max-w-7xl mx-auto w-full overflow-hidden">
        {activeTab === 'pedidos' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">
                  Pedidos: <span className="text-primary capitalize" style={{ color: 'var(--primary-color)' }}>{orderStatusFilter}</span>
                </h1>
                <p className="text-zinc-500 font-medium">Gestiona las órdenes activas de tu local con precisión quirúrgica.</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live: Conectado
              </div>
            </header>
            
            <div className="grid grid-cols-1 gap-4">
              {orders.filter(o => o.status === orderStatusFilter).map(order => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-zinc-100 flex flex-col md:flex-row items-center justify-between group hover:border-primary transition-all cursor-pointer hover:-translate-y-1">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-400 text-lg border border-zinc-200">#{order.id}</div>
                    <div>
                      <h3 className="font-black text-zinc-900 text-lg">{order.customer}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-full">{order.items}</span>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold">{order.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto mt-6 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-50">
                    <div className="text-right">
                      <div className="font-black text-2xl text-zinc-900">${order.totalUSD.toFixed(2)}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">{(order.totalUSD * exchangeRate.rate).toFixed(2)} Bs.</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div 
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                        style={{ 
                          backgroundColor: 'var(--primary-color)10', 
                          color: 'var(--primary-color)',
                          borderColor: 'var(--primary-color)20'
                        }}
                      >
                        {orderStatusFilter}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status === orderStatusFilter).length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <Clock size={64} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">No hay pedidos en esta sección</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'productos' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
              <div className="flex-1">
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">Menú y Productos</h1>
                <p className="text-zinc-500 font-medium">Define tu oferta gastronómica con imágenes potentes y precios dinámicos.</p>
                
                {/* Statistics Bar */}
                <div className="flex gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-zinc-100 rounded-2xl text-zinc-500"><Package size={20} /></div>
                    <div>
                      <div className="text-xl font-black">{products.length}</div>
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Productos</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500"><CheckCircle2 size={20} /></div>
                    <div>
                      <div className="text-xl font-black">{products.filter(p => p.is_available).length}</div>
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Disponibles</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar producto..."
                    className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary w-full sm:w-64 transition-all font-bold text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all" 
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  <Plus size={16} strokeWidth={3} /> Nuevo Producto
                </button>
              </div>
            </header>

            <div className="bg-white rounded-[32px] border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th 
                        className="p-4 md:p-6 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                        onClick={() => handleSort('name')}
                      >
                        Producto {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="p-4 md:p-6 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                        onClick={() => handleSort('category')}
                      >
                        Categoría {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="p-4 md:p-6 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                        onClick={() => handleSort('price')}
                      >
                        Precio {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-4 md:p-6 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">Estado</th>
                      <th className="p-4 md:p-6 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shrink-0">
                              {(p.images?.[0] || p.image_url) ? (
                                <img src={p.images?.[0] || p.image_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-black text-xs">IMG</div>
                              )}
                            </div>
                            <div>
                              <span className="font-black text-zinc-900 block">{p.name}</span>
                              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5 tracking-wider">SKU: {p.sku || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1.5 bg-zinc-100 rounded-xl text-[10px] font-black uppercase text-zinc-600 tracking-wider">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-6 font-black text-zinc-900 text-lg">${p.price.toFixed(2)}</td>
                        <td className="p-6">
                          <button 
                            onClick={() => toggleAvailability(p.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.is_available ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {p.is_available ? 'Disponible' : 'Agotado'}
                          </button>
                        </td>
                        <td className="p-4 md:p-6 text-right">
                          <div className="flex justify-end gap-2 md:gap-3">
                            <button 
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-2 md:p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 rounded-xl transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 md:p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-20 text-center">
                          <div className="flex flex-col items-center justify-center opacity-20">
                            <Search size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-[0.2em] text-sm">No se encontraron productos</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">Configuración</h1>
              <p className="text-zinc-500 font-medium">Personaliza los parámetros financieros y visuales de tu marca.</p>
            </header>

            <section className="bg-white p-6 md:p-10 rounded-[40px] border border-zinc-100 space-y-12">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500"><DollarSign size={24} /></div>
                    Tasa de Cambio (BCV)
                  </h3>
                  
                  <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
                    {['USD', 'EUR', 'COP'].map((code) => (
                      <button
                        key={code}
                        onClick={() => handleCurrencyChange(code)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${
                          exchangeRate.currency_code === code 
                            ? 'bg-zinc-900 text-white' 
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        <span className="opacity-30 tracking-normal">{currencySymbols[code] || '$'}</span>
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-100 flex items-center justify-between mb-6 group">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-zinc-400 font-black text-xl">{currencySymbols[exchangeRate.currency_code]}</span>
                      <span className="text-5xl font-black text-zinc-900 tracking-tighter">{exchangeRate.rate.toFixed(2)}</span>
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Bs.</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <Clock size={12} className="text-zinc-300" />
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        Actualizado: {formatDate(exchangeRate.last_updated)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSyncRate}
                    className="p-4 bg-white rounded-2xl border border-zinc-100 text-primary hover:rotate-180 transition-all duration-700 active:scale-90"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
                
                <div className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="font-black text-sm text-zinc-900 uppercase tracking-tight">Control de Tasa Manual</div>
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">Sobrescribe el valor oficial del BCV</div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={exchangeRate.mode === 'manual'} 
                        onChange={() => setExchangeRate({
                          ...exchangeRate, 
                          mode: exchangeRate.mode === 'manual' ? 'auto' : 'manual'
                        })}
                      />
                      <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary" style={{ backgroundColor: exchangeRate.mode === 'manual' ? 'var(--primary-color)' : '' }}></div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {exchangeRate.mode === 'manual' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-white rounded-2xl border border-zinc-100"
                      >
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Ajuste de precisión (Bs.)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01"
                            value={exchangeRate.rate}
                            onChange={(e) => setExchangeRate({...exchangeRate, rate: parseFloat(e.target.value) || 0})}
                            className="w-full bg-zinc-50 border border-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary font-black text-2xl tracking-tighter transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSaveConfig}
                  disabled={loading}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={20} />}
                  Guardar Configuración
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </main>

      {/* Advanced Product Modal */}
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default AdminDashboardView;

