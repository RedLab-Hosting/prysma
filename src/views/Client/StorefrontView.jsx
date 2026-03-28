import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useCart } from '../../context/CartContext';
import { exchangeRateService } from '../../api/exchangeRateService';
import ProductCard from '../../components/Client/ProductCard';
import ProductModal from '../../components/Client/ProductModal';
import CartDrawer from '../../components/Client/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ShoppingCart, Search } from 'lucide-react';

const StorefrontView = () => {
  const navigate = useNavigate();
  const { tenant, productService, categoryService } = useTenant();
  const { cartCount, cartTotalUSD } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);


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
        
        // Ensure 'all' category is always present
        const categoriesWithAll = [
          { id: 'all', name: 'Todos', icon: '🍽️' },
          ...cats
        ];
        
        setCategories(categoriesWithAll);
        setProducts(prods);
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
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2.5 bg-zinc-100 text-zinc-500 hover:text-primary rounded-xl transition-all"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: 'var(--primary-color, #ea580c)' }}
                >
                  {cartCount}
                </span>
              )}
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
                  onOpenModal={() => handleProductClick(product)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Cart Drawer Output */}
      <CartDrawer 
        isOpen={isCartDrawerOpen} 
        onClose={() => setIsCartDrawerOpen(false)} 
      />

      {/* Product Detail Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exchangeRate={exchangeRate}
      />


    </div>
  );
};

export default StorefrontView;
