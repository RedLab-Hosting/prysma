import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, Truck, CheckCircle2, MapPin, Navigation, RefreshCw, User, LogOut, Phone, History, DollarSign, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Routing Machine Component for React-Leaflet
const RoutingMachine = ({ start, end }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !start || !end) return;

    try {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        lineOptions: {
          styles: [{ color: '#10b981', weight: 5, opacity: 0.8 }] // Emerald modern line
        },
        show: false, // hide the step-by-step UI box
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        createMarker: () => null // Hide routing markers, we use our own <Marker>
      }).addTo(map);

      return () => map.removeControl(routingControl);
    } catch (e) {
      console.warn("Routing machine error:", e);
    }
  }, [map, start, end]);

  return null;
};

// Helper component to smoothly center map
const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15, { animate: true });
  }, [center, map]);
  return null;
};

const DeliveryView = () => {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Tabs: 'activo', 'historial', 'ganancias'
  const [activeTab, setActiveTab] = useState('activo');

  const storeLat = tenant?.settings?.store_location?.lat || 10.4806;
  const storeLng = tenant?.settings?.store_location?.lng || -66.9036;

  const activeOrder = orders.find(o => o.status === 'entregando') || orders.find(o => o.status === 'asignado');
  const deliveredOrders = orders.filter(o => o.status === 'entregados');

  const mapCenter = activeOrder?.customer_data?.lat && activeOrder?.customer_data?.lng 
    ? [activeOrder.customer_data.lat, activeOrder.customer_data.lng]
    : [storeLat, storeLng];

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!tenant?.id || !user?.id) return;
    loadOrders();

    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `delivery_driver_id=eq.${user.id}`,
      }, () => loadOrders())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tenant, user]);

  const loadOrders = async () => {
    try {
      // Get today's beginning
      const today = new Date();
      today.setHours(0,0,0,0);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('delivery_driver_id', user.id)
        .gte('created_at', today.toISOString()) // only today's orders to save memory
        .order('created_at', { ascending: true }); 

      if (!error) setOrders(data || []);
    } catch (err) {
      console.error('Error loading delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      loadOrders();
    } catch (err) {
      alert('Error al actualizar pedido.');
    }
  };

  const getCollectionAmount = (order) => {
    if (!order) return null;
    const payment = order.payment_data || {};
    if (payment.delivery_payment === 'cash') {
      return {  amount: payment.delivery_cost_usd, currency: '$', label: 'Cobrar Delivery' };
    } else if (payment.delivery_payment === 'pago_movil') {
      return { amount: payment.delivery_cost_usd * (payment.exchange_rate || 1), currency: 'Bs', label: 'Vrificar. Pago Móvil'  };
    }
    return { amount: order.total, currency: '$', label: 'Total Pedido (Ref)' };
  };

  const collectionAmount = getCollectionAmount(activeOrder);

  // Calc earnings
  const totalEarningsUSD = deliveredOrders.reduce((sum, o) => sum + (o.payment_data?.delivery_cost_usd || 0), 0);

  return (
    <div className="h-dvh w-full relative bg-zinc-50 overflow-hidden font-sans flex flex-col">
      {/* 2. Top App Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4 pt-6 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg border border-white/20 p-3 px-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white font-black text-sm uppercase">
              {profile?.name?.[0] || 'D'}
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900 leading-tight">{profile?.name || 'Repartidor'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">En Línea</span>
              </div>
            </div>
          </div>
          <button onClick={() => logout()} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area based on Tabs */}
      <div className="flex-1 w-full relative mt-24 mb-24 overflow-y-auto no-scrollbar">
        {activeTab === 'activo' && (
           <>
              <div className="absolute inset-0 z-0 bg-zinc-900 -mt-24 mb-0">
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <MapCenterUpdater center={mapCenter} />
                  <Marker position={[storeLat, storeLng]} opacity={activeOrder ? 0.7 : 1} />
                  
                  {activeOrder?.customer_data?.lat && activeOrder?.customer_data?.lng && (
                    <>
                      <Marker position={[activeOrder.customer_data.lat, activeOrder.customer_data.lng]} />
                      <RoutingMachine start={[storeLat, storeLng]} end={[activeOrder.customer_data.lat, activeOrder.customer_data.lng]} />
                    </>
                  )}
                </MapContainer>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none z-10" />
              </div>
              
              {/* Bottom Sheet UI for Active Tab */}
              <div className="absolute bottom-0 left-0 right-0 z-40">
                {loading ? (
                  <div className="bg-white rounded-t-[32px] p-10 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                     <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-600 rounded-full animate-spin mx-auto" />
                  </div>
                ) : activeOrder ? (
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pt-3 pb-8 px-6 lg:max-w-md mx-auto">
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6" />
                    <div className="flex justify-between items-center mb-4">
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeOrder.status === 'asignado' ? 'bg-orange-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                         {activeOrder.status === 'asignado' ? 'Nuevo Pedido' : 'En Camino al Cliente'}
                       </span>
                       <span className="font-mono text-zinc-400 font-bold text-xs border border-zinc-200 px-2 py-0.5 rounded-md">
                         #{activeOrder.number || activeOrder.id?.slice(0,4)}
                       </span>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1">
                          {activeOrder.customer_data.first_name} {activeOrder.customer_data.last_name}
                        </h2>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium mt-2">
                          <MapPin size={14} style={{ color: 'var(--primary-color)' }} />
                          {activeOrder.customer_data.address || 'Sin Dirección Mapeada'}
                        </div>
                      </div>
                      <a href={`tel:${activeOrder.customer_data.phone}`} className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0 shadow-sm active:scale-90 transition-transform">
                        <Phone size={18} fill="currentColor" />
                      </a>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4 mb-4 border border-zinc-100">
                      <div className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Contenido del Pedido</div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {(activeOrder.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm font-bold text-zinc-700">
                            <span className="truncate pr-4"><span className="text-zinc-400 mr-1">{item.quantity}x</span> {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-6 px-1">
                       <div>
                          <div className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-0.5">{collectionAmount?.label}</div>
                          <div className="text-3xl font-black text-zinc-900 tracking-tighter">
                             {collectionAmount?.currency === '$' ? '$' : ''}{Number(collectionAmount?.amount || 0).toFixed(2)}{collectionAmount?.currency === 'Bs' ? ' Bs.' : ''}
                          </div>
                       </div>
                       {activeOrder.payment_data?.food_payment === 'pago_movil' && activeOrder.payment_data?.delivery_payment === 'pago_movil' && (
                         <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            Pre-Pagado ✅
                         </div>
                       )}
                    </div>

                    {activeOrder.status === 'asignado' && (
                      <button onClick={() => updateStatus(activeOrder.id, 'entregando')} className="w-full py-5 rounded-2xl text-white font-black text-base uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(24,24,27,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 bg-zinc-900">
                        <Navigation size={20} /> Iniciar Ruta
                      </button>
                    )}
                    
                    {activeOrder.status === 'entregando' && (
                      <button onClick={() => updateStatus(activeOrder.id, 'entregados')} className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black text-base uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                        <CheckCircle2 size={24} /> Marcar Entregado
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-8 text-center pb-12 lg:max-w-md mx-auto">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                       <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                       <Truck size={32} className="text-emerald-600 relative z-10" />
                    </div>
                    <h3 className="font-black text-2xl text-zinc-900 tracking-tight mb-2">Buscando pedidos</h3>
                    <p className="text-sm text-zinc-500 font-medium px-4">Mantén la aplicación abierta. Tu próximo servicio aparecerá aquí en cualquier momento.</p>
                  </motion.div>
                )}
              </div>
           </>
        )}

        {/* History Tab */}
        {activeTab === 'historial' && (
          <div className="p-6 pt-0">
             <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-6">Historial de Hoy</h2>
             {deliveredOrders.length === 0 ? (
               <div className="text-center py-20 opacity-30">
                 <Package size={48} className="mx-auto mb-4" />
                 <p className="font-black uppercase tracking-widest text-[10px]">Aún no has entregado pedidos hoy</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {deliveredOrders.map(order => (
                   <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
                     <div>
                       <div className="font-black text-sm text-zinc-900">{order.customer_data?.first_name} {order.customer_data?.last_name}</div>
                       <div className="text-[10px] text-zinc-500 font-black tracking-widest uppercase mt-1">#{order.number || order.id?.slice(0,4)}</div>
                     </div>
                     <div className="text-right">
                       <div className="font-black text-emerald-600">${(order.payment_data?.delivery_cost_usd || 0).toFixed(2)}</div>
                       <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1 flex items-center gap-1 justify-end"><CheckCircle2 size={10} /> Entregado</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'ganancias' && (
          <div className="p-6 pt-0">
             <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-6">Tus Ganancias</h2>
             <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={100} /></div>
               <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Monto Generado Hoy</div>
               <div className="text-5xl font-black tracking-tighter">${totalEarningsUSD.toFixed(2)}</div>
               <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="text-xs font-medium text-zinc-400">Total Viajes: <span className="text-white font-black">{deliveredOrders.length}</span></div>
               </div>
             </div>
             <p className="text-xs text-zinc-500 font-medium px-2 text-center">Las ganancias mostradas representan el costo de delivery acumulado. Los pagos directos a la tienda por comida no se incluyen aquí.</p>
          </div>
        )}
      </div>

      {/* 3. Bottom Tabs Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex px-2">
           <button onClick={() => setActiveTab('historial')} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab==='historial'?'text-primary':'text-zinc-400 hover:bg-zinc-50'}`} style={activeTab==='historial'?{color:'var(--primary-color)'}:{}}>
              <History size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Historial</span>
           </button>
           <button onClick={() => setActiveTab('activo')} className="flex-1 py-4 relative group">
              <div className={`absolute left-1/2 -top-6 -translate-x-1/2 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${activeTab==='activo'?'bg-primary text-white scale-110':'bg-zinc-900 text-zinc-400 scale-100 hover:scale-105'}`} style={activeTab==='activo'?{backgroundColor:'var(--primary-color)'}:{}}>
                 <MapIcon size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest absolute bottom-2 w-full text-center transition-colors ${activeTab==='activo'?'text-primary':'text-zinc-400'}`} style={activeTab==='activo'?{color:'var(--primary-color)'}:{}}>Activo</span>
           </button>
           <button onClick={() => setActiveTab('ganancias')} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab==='ganancias'?'text-emerald-600':'text-zinc-400 hover:bg-zinc-50'}`}>
              <DollarSign size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Ganancias</span>
           </button>
        </div>
      </nav>
    </div>
  );
};

export default DeliveryView;
