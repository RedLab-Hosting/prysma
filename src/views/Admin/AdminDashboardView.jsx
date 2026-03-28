import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { 
  Plus, Package, Clock, DollarSign, Settings, RefreshCw, 
  BarChart3, ChevronRight, Edit2, Trash2, Eye, EyeOff, Search, Menu, X, CheckCircle2, Truck, Navigation, UserPlus 
} from 'lucide-react';
import { exchangeRateService } from '../../api/exchangeRateService';
import { supabase } from '../../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ProductModal from '../../components/Admin/ProductModal';
import ReceiptTicket from '../../components/Common/ReceiptTicket';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const AdminDashboardView = () => {
  const { tenant, productService, orderService, categoryService } = useTenant();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [exchangeRate, setExchangeRate] = useState({ rate: 36.50, mode: 'auto', currency_code: 'USD' });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [orderStatusFilter, setOrderStatusFilter] = useState('entrantes');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);

  // Delivery config state
  const [deliveryConfig, setDeliveryConfig] = useState({
    kmRate: tenant?.settings?.delivery_km_rate || 1,
    chargeUsd: tenant?.settings?.delivery_charge_usd || 1,
    storeLat: tenant?.settings?.store_location?.lat || '',
    storeLng: tenant?.settings?.store_location?.lng || '',
  });

  useEffect(() => {
    if (tenant) {
      loadAdminData();

      // Real-time subscription for new/updated orders
      const channel = supabase
        .channel(`admin-orders-${tenant.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenant.id}`,
        }, (payload) => {
          setOrders(currentOrders => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...currentOrders];
            } else if (payload.eventType === 'UPDATE') {
              return currentOrders.map(o => o.id === payload.new.id ? payload.new : o);
            }
            return currentOrders;
          });
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
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

      // Load categories and products
      const [catsData, prodsData] = await Promise.all([
        categoryService.getAll(),
        productService.getAll()
      ]);
      setCategories(catsData || []);
      setProducts(prodsData || []);

      // Load orders
      const ordersData = await orderService.getAll();
      setOrders(ordersData?.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) || []);

      // Load delivery drivers
      const { data: driversData } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('role', 'delivery');
      if (driversData) setDeliveryDrivers(driversData);

    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverActive = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await supabase.from('profiles').update({ is_active: newStatus }).eq('id', id);
      setDeliveryDrivers(drivers => drivers.map(d => d.id === id ? { ...d, is_active: newStatus } : d));
    } catch (err) {
      alert("Error actualizando estado del repartidor: " + err.message);
    }
  };

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !tenant?.id) return;
    try {
      const cat = await categoryService.create({ name: newCategoryName.trim(), tenant_id: tenant.id });
      setCategories([...categories, cat]);
      setNewCategoryName('');
      setIsNewCategoryOpen(false);
    } catch (err) {
      alert("Error creando categoría: " + err.message);
    }
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        const updated = await productService.update(editingProduct.id, formData);
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await productService.create({ ...formData, tenant_id: tenant?.id });
        setProducts([...products, created]);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      alert('Error guardando producto: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productService.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        alert('Error eliminando producto: ' + err.message);
      }
    }
  };

  const toggleAvailability = async (id) => {
    try {
      const product = products.find(p => p.id === id);
      const updated = await productService.update(id, { is_available: !product.is_available });
      setProducts(products.map(p => p.id === id ? { ...p, is_available: updated.is_available } : p));
    } catch (err) {
      alert('Error actualizando disponibilidad: ' + err.message);
    }
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

  const handleCaptureStoreLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeliveryConfig(prev => ({
            ...prev,
            storeLat: pos.coords.latitude,
            storeLng: pos.coords.longitude,
          }));
        },
        () => alert('No se pudo obtener la ubicación.')
      );
    }
  };

  const handleSaveConfig = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      // Save exchange rate if manual
      if (exchangeRate.mode === 'manual') {
        await exchangeRateService.updateRate(tenant.id, exchangeRate.rate, 'manual', exchangeRate.currency_code);
      }

      // Save delivery config to tenant settings
      const { supabase } = await import('../../api/supabase');
      const currentSettings = tenant.settings || {};
      const updatedSettings = {
        ...currentSettings,
        delivery_km_rate: parseFloat(deliveryConfig.kmRate) || 1,
        delivery_charge_usd: parseFloat(deliveryConfig.chargeUsd) || 1,
        store_location: deliveryConfig.storeLat && deliveryConfig.storeLng
          ? { lat: parseFloat(deliveryConfig.storeLat), lng: parseFloat(deliveryConfig.storeLng) }
          : currentSettings.store_location || null,
      };

      await supabase
        .from('tenants')
        .update({ settings: updatedSettings })
        .eq('id', tenant.id);

    } catch (err) {
      console.error('Error saving config:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
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
          { id: 'equipo', label: 'Equipo', icon: UserPlus },
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
              {orders.filter(o => o.status === orderStatusFilter).map(order => {
                const customer = order.customer_data || {};
                const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                const pData = order.payment_data || {};
                const exchange = pData.exchange_rate || exchangeRate.rate;
                
                let finalBs = 0;
                let finalUSD = 0;
                
                // Compatibility fallback
                if (!pData.food_payment) {
                   finalUSD = (pData.subtotal_usd || 0) + (pData.delivery_cost_usd || 0) || order.total || 0;
                   finalBs = finalUSD * exchange;
                } else {
                   if (pData.food_payment === 'pago_movil') finalBs += (pData.subtotal_usd || 0) * exchange;
                   else finalUSD += (pData.subtotal_usd || 0);
                   
                   if (pData.delivery_payment === 'pago_movil') finalBs += (pData.delivery_cost_usd || 0) * exchange;
                   else finalUSD += (pData.delivery_cost_usd || 0);
                }

                return (
                  <div key={order.id} className="bg-white p-6 rounded-3xl border border-zinc-100 flex flex-col md:flex-row items-center justify-between group hover:border-primary transition-all">
                    <div 
                      className="flex items-center gap-6 w-full md:w-auto cursor-pointer flex-1"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-400 text-lg border border-zinc-200">
                        #{order.number || order.id?.slice(0,4)}
                      </div>
                      <div>
                        <h3 className="font-black text-zinc-900 text-lg">{customer.first_name} {customer.last_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-50 px-2 flex py-0.5 rounded-full">{itemsCount} items</span>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold">{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto mt-6 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-50">
                      <div className="text-right">
                        {finalUSD > 0 && <div className="font-black text-2xl text-zinc-900">${finalUSD.toFixed(2)}</div>}
                        {finalBs > 0 && <div className={`font-bold uppercase tracking-[0.2em] ${finalUSD > 0 ? 'text-[10px] text-zinc-400' : 'text-xl text-zinc-900'}`}>{finalBs.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs.</div>}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <select 
                            value={order.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              await orderService.updateStatus(order.id, newStatus);
                              setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                            }}
                            className="px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 outline-none cursor-pointer"
                          >
                            {['entrantes', 'pendiente', 'asignado', 'entregando', 'entregados'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          
                          {order.payment_data?.delivery_type === 'delivery' && ['pendiente', 'entrantes'].includes(order.status) && (
                            <select 
                              onChange={async (e) => {
                                const driverId = e.target.value;
                                if (driverId) {
                                  await orderService.assignDriver(order.id, driverId);
                                  setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'asignado', delivery_driver_id: driverId } : o));
                                }
                              }}
                              className="px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-zinc-900 text-white outline-none cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Asignar Motorizado</option>
                              {deliveryDrivers.filter(d => d.is_active).map(d => (
                                <option key={d.id} value={d.id}>{d.name || d.first_name || d.email || 'Repartidor'}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase"
                        >
                          <Eye size={12} /> Ver Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsNewCategoryOpen(true)}
                    className="bg-zinc-100 text-zinc-900 px-4 flex-1 sm:flex-none py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all"
                  >
                    + Categoría
                  </button>
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="bg-primary text-white px-6 py-3 flex-1 sm:flex-none rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all" 
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    <Plus size={16} strokeWidth={3} /> Producto
                  </button>
                </div>

              {/* New Category Inline Form */}
              <AnimatePresence>
                {isNewCategoryOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex flex-col sm:flex-row gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200"
                  >
                    <input 
                      type="text"
                      placeholder="Nombre de nueva categoría (ej: Promociones)"
                      className="flex-1 bg-white border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsNewCategoryOpen(false)} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={20} />
                      </button>
                      <button onClick={handleCreateCategory} className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase hover:bg-black transition-all">
                        Guardar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

        {activeTab === 'equipo' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">Equipo Delivery</h1>
                <p className="text-zinc-500 font-medium">Gestiona el personal motorizado y aprueba su ingreso al sistema.</p>
              </div>
            </header>

            <div className="bg-white rounded-[32px] border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50/50 border-b border-zinc-100">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Repartidor</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">Contacto</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right whitespace-nowrap">Estado / Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {deliveryDrivers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-20 text-center opacity-20">
                          <UserPlus size={64} className="mx-auto mb-4" />
                          <p className="font-black uppercase tracking-[0.2em] text-sm">No hay repartidores registrados</p>
                        </td>
                      </tr>
                    ) : (
                      deliveryDrivers.map(driver => (
                        <tr key={driver.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-400 text-lg border border-zinc-200 uppercase">
                                {(driver.name || driver.email || 'D')[0]}
                              </div>
                              <span className="font-black text-zinc-900 block text-lg">{driver.name || driver.first_name || 'Sin Nombre'}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-zinc-500 font-mono font-medium">{driver.phone || driver.email || 'N/A'}</span>
                          </td>
                          <td className="p-6 text-right">
                            <button 
                              onClick={() => toggleDriverActive(driver.id, driver.is_active)}
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 ml-auto ${
                                driver.is_active 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 border border-rose-100'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${driver.is_active ? 'bg-emerald-500 group-hover:bg-rose-500' : 'bg-rose-500 group-hover:bg-emerald-500'}`} />
                              {driver.is_active ? 'Activo' : 'Inactivo'}
                            </button>
                            {driver.is_active ? (
                               <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2">Haz clic para Suspender</p>
                            ) : (
                               <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-2">Haz clic para Aprobar</p>
                            )}
                          </td>
                        </tr>
                      ))
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

              {/* Delivery Cost Configuration */}
              <div className="pt-8 border-t border-zinc-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-orange-50 rounded-xl text-orange-500"><Truck size={24} /></div>
                  <h3 className="text-xl font-black">Costo de Delivery</h3>
                </div>

                <div className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cada X kilómetros</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0.1"
                        value={deliveryConfig.kmRate}
                        onChange={(e) => setDeliveryConfig({...deliveryConfig, kmRate: e.target.value})}
                        className="w-full bg-white border border-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary font-black text-xl tracking-tighter"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cobrar (USD)</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        value={deliveryConfig.chargeUsd}
                        onChange={(e) => setDeliveryConfig({...deliveryConfig, chargeUsd: e.target.value})}
                        className="w-full bg-white border border-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary font-black text-xl tracking-tighter"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Ubicación de la Tienda</label>
                    <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 relative z-10">
                      <MapContainer 
                        center={deliveryConfig.storeLat && deliveryConfig.storeLng ? [deliveryConfig.storeLat, deliveryConfig.storeLng] : [10.4806, -66.9036]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker 
                          position={deliveryConfig.storeLat && deliveryConfig.storeLng ? [deliveryConfig.storeLat, deliveryConfig.storeLng] : null} 
                          setPosition={(pos) => setDeliveryConfig({...deliveryConfig, storeLat: pos[0], storeLng: pos[1]})} 
                        />
                      </MapContainer>
                      
                      <button
                        type="button"
                        onClick={handleCaptureStoreLocation}
                        className="absolute bottom-4 right-4 z-1000 bg-white py-2 px-4 rounded-full shadow-xl border border-zinc-200 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2 font-bold text-sm"
                        style={{ color: 'var(--primary-color)' }}
                      >
                        <Navigation size={18} />
                        Ubicación Actual
                      </button>
                    </div>
                  </div>
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
        categories={categories}
      />

      {/* Embedded Receipt Ticket Modal explicitly for Admin */}
      {selectedOrder && (
        <ReceiptTicket
          order={selectedOrder}
          tenantName={tenant?.name}
          exchangeRate={exchangeRate.rate}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardView;

