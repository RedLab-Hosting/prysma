import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';

const ProductModal = ({ product, isOpen, onClose, exchangeRate = 1 }) => {
  const { addToCart } = useCart();
  const { features } = useTenant();
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleModifierChange = (groupName, optionName) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [groupName]: optionName
    }));
  };

  const handleAddToCart = () => {
    addToCart(product, selectedModifiers, quantity);
    onClose();
  };

  const priceBs = (product.price * exchangeRate).toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col border border-zinc-200"
          >
            {/* Header / Image Area */}
            <div className="relative h-64 sm:h-72">
              <img 
                src={product.image_url || 'https://via.placeholder.com/600x400?text=Producto'} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto grow h-full">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-zinc-900">{product.name}</h2>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary" style={{ color: 'var(--primary-color, #ea580c)' }}>
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">{priceBs} Bs.</div>
                </div>
              </div>
              
              <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                {product.description || 'Disfruta de nuestro delicioso producto preparado con los mejores ingredientes.'}
              </p>

              {/* Modifiers (Mock groups for now) */}
              {features?.modifiers && product.modifiers && product.modifiers.map((group) => (
                <div key={group.name} className="mb-6">
                  <h3 className="font-bold text-zinc-900 mb-3 flex items-center justify-between">
                    {group.name}
                    {group.required && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Obligatorio</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleModifierChange(group.name, option)}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          selectedModifiers[group.name] === option
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                        }`}
                        style={selectedModifiers[group.name] === option ? { borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Add to Cart */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex items-center gap-4">
              <div className="flex items-center bg-white rounded-xl border border-zinc-200 p-1">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center font-bold text-zinc-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="grow py-3.5 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98]"
              >
                <ShoppingCart size={20} />
                Añadir al carrito
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
