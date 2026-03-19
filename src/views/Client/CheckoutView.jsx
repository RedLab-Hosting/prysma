import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Navigation, Send, Truck, Store } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../../utils/whatsappUtils';

// Fix for default marker icons in Leaflet with React
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

const CheckoutView = () => {
  const navigate = useNavigate();
  const { cart, cartTotalUSD, cartCount, clearCart } = useCart();
  const { tenant, features } = useTenant();
  const [deliveryType, setDeliveryType] = useState(features.delivery ? 'delivery' : 'pickup');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [position, setPosition] = useState([10.4806, -66.9036]); // Caracas default
  const [deliveryCost, setDeliveryCost] = useState(2.00); // Mock cost
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [exchangeRate, setExchangeRate] = useState(36.50);

  useEffect(() => {
    const fetchRate = async () => {
      if (!tenant?.id) return;
      try {
        const data = await exchangeRateService.getRate(tenant.id);
        if (data) setExchangeRate(data.rate);
      } catch (err) {
        console.error("Error fetching checkout rate", err);
      }
    };
    fetchRate();
  }, [tenant]);
  const totalBS = (cartTotalUSD + (deliveryType === 'delivery' ? deliveryCost : 0)) * exchangeRate;

  useEffect(() => {
    if (cartCount === 0) {
      // navigate(-1); 
    }
  }, [cartCount]);

  const handleCaptureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = {
      ...formData,
      deliveryType,
      deliveryCostUSD: deliveryType === 'delivery' ? deliveryCost : 0,
      paymentMethod: formData.paymentMethod || 'cash'
    };

    const message = generateWhatsAppMessage(orderData, cart, cartTotalUSD, totalBS);
    
    // Alert logic as requested
    alert("¡Pedido generado! Por favor, vuelve a la página después de realizar el pago por WhatsApp para ver el seguimiento de tu pedido.");
    
    openWhatsApp(tenant?.contact_info?.whatsapp || "584120000000", message);
    
    setIsSubmitting(false);
    // In a real app, we would also push to Supabase here.
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-12">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Delivery Type Toggle */}
          {(features.delivery || features.pickup) && (
            <div className="grid grid-cols-2 gap-3 bg-white p-1.5 rounded-2xl border border-zinc-200">
              {features.delivery && (
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    deliveryType === 'delivery' 
                      ? 'text-white' 
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                  style={deliveryType === 'delivery' ? { backgroundColor: 'var(--primary-color)' } : {}}
                >
                  <Truck size={20} />
                  Delivery
                </button>
              )}
              {features.pickup && (
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    deliveryType === 'pickup' 
                      ? 'text-white' 
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                  style={deliveryType === 'pickup' ? { backgroundColor: 'var(--primary-color)' } : {}}
                >
                  <Store size={20} />
                  Retiro
                </button>
              )}
            </div>
          )}

          {/* Payment Methods - Modular */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold px-1">Método de Pago</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {features.zelle && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'zelle'})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    formData.paymentMethod === 'zelle' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-zinc-200 text-zinc-500 bg-white'
                  }`}
                  style={formData.paymentMethod === 'zelle' ? { borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}
                >
                  <div className="font-black text-lg">Zelle</div>
                  <span className="text-[10px] uppercase font-bold opacity-60">Dólares</span>
                </button>
              )}
              {features.pago_movil && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'pago_movil'})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    formData.paymentMethod === 'pago_movil' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-zinc-200 text-zinc-500 bg-white'
                  }`}
                  style={formData.paymentMethod === 'pago_movil' ? { borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' } : {}}
                >
                  <div className="font-black text-lg">Móvil</div>
                  <span className="text-[10px] uppercase font-bold opacity-60">Bolívares</span>
                </button>
              )}
              {features.cash && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    formData.paymentMethod === 'cash' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-zinc-200 text-zinc-500 bg-white'
                  }`}
                  style={formData.paymentMethod === 'cash' ? { borderColor: 'var(--accent-2)', color: 'var(--accent-2)' } : {}}
                >
                  <div className="font-black text-lg">Efectivo</div>
                  <span className="text-[10px] uppercase font-bold opacity-60">En entrega</span>
                </button>
              )}
            </div>
          </section>

          {/* Customer Info */}
          <section className="bg-white rounded-3xl p-6 border border-zinc-200 space-y-4">
            <h2 className="text-xl font-bold mb-4">Tus Datos</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Nombre Completo</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Teléfono de Contacto</label>
                <input 
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Ej. 04121234567"
                />
              </div>
            </div>
          </section>

          {/* Delivery Location Section */}
          {deliveryType === 'delivery' && (
            <motion.section 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-white rounded-3xl overflow-hidden border border-zinc-200"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">Ubicación de Entrega</h2>
                <p className="text-sm text-zinc-500 mb-4">Selecciona tu ubicación en el mapa para calcular el delivery.</p>
                
                <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 relative z-10">
                  <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                  
                  <button 
                    type="button"
                    onClick={handleCaptureLocation}
                    className="absolute bottom-4 right-4 z-20 bg-white p-3 rounded-full shadow-xl border border-zinc-200 text-primary hover:scale-110 active:scale-95 transition-all"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    <Navigation size={24} />
                  </button>
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Referencia o Dirección Detallada</label>
                  <textarea 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Casa #, punto de referencia..."
                    className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Summary & Submit */}
          <section className="bg-zinc-900 text-white rounded-3xl p-8 space-y-4">
            <h2 className="text-xl font-bold mb-4 opacity-70">Resumen del Pedido</h2>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span>Subtotal</span>
              <span className="font-bold">${cartTotalUSD.toFixed(2)}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span>Costo Delivery</span>
                <span className="font-bold">${deliveryCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4">
              <div>
                <span className="block text-xs uppercase tracking-widest font-bold opacity-60">Total a pagar</span>
                <span className="text-3xl font-bold">${(cartTotalUSD + (deliveryType === 'delivery' ? deliveryCost : 0)).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-xl font-bold">{totalBS.toLocaleString('es-VE')} Bs.</span>
                <span className="text-[10px] opacity-40">Tasa: {exchangeRate} Bs.</span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full mt-6 py-5 bg-primary rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ backgroundColor: 'var(--primary-color, #ea580c)', color: 'white' }}
            >
              <Send size={24} />
              Confirmar por WhatsApp
            </button>
          </section>
        </form>
      </main>
    </div>
  );
};

export default CheckoutView;
