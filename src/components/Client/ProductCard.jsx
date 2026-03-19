import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product, exchangeRate = 1 }) => {
  const { addToCart, updateQuantity, getProductQuantity } = useCart();
  const quantityInCart = getProductQuantity(product.id);

  // Price in Bs calculated from USD price and exchange rate
  const priceBs = (product.price * exchangeRate).toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const handleAddClick = (e) => {
    e.stopPropagation();
    // If product has modifiers, we should open the modal instead.
    // For now, simple add for demo.
    if (product.hasModifiers) {
      // openModal(product); 
      // (This will be implemented in ProductModal)
    } else {
      addToCart(product, null, 1);
    }
  };

  return (
    <motion.div 
      layout
      className="relative flex flex-col h-full bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-200 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden shrink-0">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Price Tag (Glassmorphism) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <span className="text-white font-bold text-sm">${product.price.toFixed(2)}</span>
          </div>
          <div className="bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/40">
            <span className="text-zinc-900 font-extrabold text-[10px]">{priceBs} Bs.</span>
          </div>
        </div>

        {/* Quantity Indicator in Image */}
        <AnimatePresence>
          {quantityInCart > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-3 left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white z-10"
              style={{ backgroundColor: 'var(--primary-color, #ea580c)' }}
            >
              <span className="text-white font-black text-sm">{quantityInCart}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col grow">
        <h3 className="text-zinc-900 font-black text-base mb-1 leading-tight line-clamp-2 min-h-10">
          {product.name}
        </h3>
        <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-2 mb-4 grow">
          {product.description || 'Disfruta de nuestra especialidad preparada con los mejores ingredientes.'}
        </p>

        {/* Actions */}
        <div className="mt-auto pt-2">
          {quantityInCart === 0 ? (
            <button
              onClick={handleAddClick}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={3} />
              Agregar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-between bg-zinc-100 rounded-xl p-1 border border-zinc-200">
                <button 
                  onClick={() => updateQuantity(product.id, -1)}
                  className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-white rounded-lg transition-all active:scale-90"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="font-black text-zinc-900">{quantityInCart}</span>
                <button 
                  onClick={() => updateQuantity(product.id, 1)}
                  className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-white rounded-lg transition-all active:scale-90"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
