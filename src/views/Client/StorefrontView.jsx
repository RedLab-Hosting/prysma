import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/Client/ProductCard';
import ProductModal from '../../components/Client/ProductModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu as MenuIcon, X, Settings } from 'lucide-react';

const StorefrontView = () => {
  const navigate = useNavigate();
  const { tenant, productService, categoryService } = useTenant();
  const { cartCount, cartTotalUSD } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [exchangeRate, setExchangeRate] = useState(36.50);

  useEffect(() => {
    const fetchRate = async () => {
      if (!tenant?.id) return;
      try {
        const data = await exchangeRateService.getRate(tenant.id);
        if (data) setExchangeRate(data.rate);
      } catch (err) {
        console.error("Error fetching client rate", err);
      }
    };
    fetchRate();
  }, [tenant]);

  useEffect(() => {
    // Fetch categories and products for the tenant
    const loadData = async () => {
      if (!tenant) return;
      
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          categoryService.getAll(),
          productService.getAll()
        ]);
        
        let finalCats = cats;
        let finalProds = prods;

        // Fallback to mock data if empty
        if (cats.length === 0 && prods.length === 0) {
          console.log("Using mock data fallback (database is empty)");
          finalCats = [
            { id: '1', name: 'Hamburguesas', icon: '🍔' },
            { id: '2', name: 'Pizzas', icon: '🍕' },
            { id: '3', name: 'Bebidas', icon: '🥤' }
          ];
          finalProds = [
            { 
              id: 'p1', 
              name: 'Classic Burger', 
              price: 8.50, 
              description: 'Carne 200g, queso cheddar, lechuga, tomate y salsa especial.',
              category_id: '1',
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
              hasModifiers: true,
              modifiers: [
                { name: 'Término de la carne', required: true, options: ['Bien cocida', 'Término medio', 'Al punto'] },
                { name: 'Extras', required: false, options: ['Extra Queso', 'Tocineta', 'Huevo'] }
              ]
            },
            { 
              id: 'p2', 
              name: 'Pepperoni Pizza', 
              price: 12.00, 
              description: 'Masa artesanal, salsa pomodoro, mozzarella y mucho pepperoni.', 
              category_id: '2',
              image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop'
            },
            { 
              id: 'p3', 
              name: 'Coca-Cola', 
              price: 1.50, 
              description: 'Original 355ml bien fría.', 
              category_id: '3',
              image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop'
            },
            { 
              id: 'p4', 
              name: 'Double Bacon Burger', 
              price: 10.50, 
              description: 'Doble carne, doble tocineta, salsa BBQ casera.', 
              category_id: '1',
              image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop'
            }
          ];
        }

        // Ensure 'all' category is always present
        const categoriesWithAll = [
          { id: 'all', name: 'Todos', icon: '🍽️' },
          ...finalCats
        ];
        
        setCategories(categoriesWithAll);
        setProducts(finalProds);
      } catch (err) {
        console.error("Error loading storefront data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenant, productService, categoryService]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl rotate-3 group-hover:rotate-0 transition-transform" 
              style={{ 
                backgroundColor: 'var(--primary-color)'
              }}
            >
              {tenant?.branding?.logo_url ? (
                <img src={tenant.branding.logo_url} alt={tenant.name} className="w-full h-full object-contain p-1" />
              ) : (
                tenant?.name?.charAt(0) || 'P'
              )}
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight tracking-tighter text-zinc-900">{tenant?.name || 'Cargando...'}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-black">Menu Digital</span>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-zinc-100 text-zinc-500 hover:text-primary rounded-xl transition-all border border-transparent hover:border-primary/20">
              <Search size={20} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 bg-zinc-100 text-zinc-500 hover:text-primary rounded-xl transition-all"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="¿Qué te provoca hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="mb-12 overflow-x-auto no-scrollbar -mx-4 px-4 flex gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`group flex items-center gap-3 px-6 py-4 rounded-4xl whitespace-nowrap transition-all duration-500 font-black text-sm relative overflow-hidden ${
                activeCategory === cat.id 
                  ? 'text-white scale-105' 
              : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300'
            }`}
              style={activeCategory === cat.id ? { 
                backgroundColor: 'var(--primary-color)'
              } : {}}
            >
              {activeCategory === cat.id && (
                <motion.div 
                  layoutId="category-glow"
                  className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent"
                  initial={false}
                />
              )}
              <span className={`text-xl transition-transform duration-500 ${activeCategory === cat.id ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>{cat.icon}</span>
              <span className="relative z-10">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => handleProductClick(product)}>
                <ProductCard 
                  product={product} 
                  exchangeRate={exchangeRate} 
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
          <button 
            onClick={() => navigate(`/${tenant?.slug || 'default'}/checkout`)}
            className="w-full bg-zinc-900 text-white py-4 px-6 rounded-2xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={24} className="group-hover:rotate-12 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-zinc-900" style={{ backgroundColor: 'var(--primary-color)' }}>
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-bold">Ver Carrito</span>
          </div>
          <div className="text-right">
            <div className="font-bold">${cartTotalUSD.toFixed(2)}</div>
            <div className="text-[10px] opacity-60">{(cartTotalUSD * exchangeRate).toFixed(2)} Bs.</div>
          </div>
        </button>
      </motion.div>
      )}

      {/* Product Detail Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exchangeRate={exchangeRate}
      />

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-70 p-8 border-l border-zinc-100 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-xl font-black">Menú</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-4">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/${tenant?.slug}/login`);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl hover:bg-primary/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all" style={{ color: 'var(--primary-color)' }}>
                    <Settings size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">Gestionar Tienda</div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Acceso Administrador</div>
                  </div>
                </button>
              </nav>

              <div className="pt-8 border-t border-zinc-100">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4">Branding Prysma</p>
                <img src="/assets/prysma_full_logo_white.svg" className="h-6 w-auto opacity-20 grayscale brightness-0" alt="Prysma" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorefrontView;
