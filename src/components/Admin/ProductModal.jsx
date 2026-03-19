import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Hamburguesas',
    price: 0,
    description: '',
    is_available: true,
    images: [],
    modifiers: []
  });

  const [newImage, setNewImage] = useState('');
  const [newModifier, setNewModifier] = useState({ name: '', extraPrice: 0 });

  const categoryImages = {
    'Hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    'Pizzas': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800',
    'Bebidas': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800',
    'Postres': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800'
  };

  const handleSuggestImage = () => {
    const suggested = categoryImages[formData.category];
    if (suggested && !formData.images.includes(suggested)) {
      setFormData({ ...formData, images: [...formData.images, suggested] });
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        sku: product.sku || '',
        images: product.images || (product.image_url ? [product.image_url] : []),
        modifiers: product.modifiers || []
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: 'Hamburguesas',
        price: 0,
        description: '',
        is_available: true,
        images: [],
        modifiers: []
      });
    }
  }, [product, isOpen]);

  const handleAddImage = () => {
    if (newImage) {
      setFormData({ ...formData, images: [...formData.images, newImage] });
      setNewImage('');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  const handleAddModifier = () => {
    if (newModifier.name) {
      setFormData({ ...formData, modifiers: [...formData.modifiers, newModifier] });
      setNewModifier({ name: '', extraPrice: 0 });
    }
  };

  const handleRemoveModifier = (index) => {
    const updatedModifiers = formData.modifiers.filter((_, i) => i !== index);
    setFormData({ ...formData, modifiers: updatedModifiers });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]"
        >
          <header className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <p className="text-xs text-zinc-500 font-medium">Configura los detalles técnicos de tu oferta</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
              <X size={24} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8 no-scrollbar">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">SKU / ID Interno</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. HAM-001"
                  className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Nombre Comercial</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Burguer Suprema"
                  className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Categoría</label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Hamburguesas</option>
                  <option>Pizzas</option>
                  <option>Bebidas</option>
                  <option>Postres</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Precio en Dólares ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Descripción Detallada</label>
              <textarea 
                className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium transition-all min-h-24 resize-none"
                placeholder="Ingredientes, alérgenos, etc..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Images Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" /> Galería de Imágenes
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="URL de imagen (Unsplash, etc)"
                  className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-zinc-800"
                >
                  URL
                </button>
                <button 
                  type="button"
                  onClick={handleSuggestImage}
                  className="px-4 py-2.5 bg-primary/5 text-primary border border-primary/20 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-primary hover:text-white"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Sugerir
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className="col-span-4 py-8 border-2 border-dashed border-zinc-100 rounded-2xl flex flex-col items-center justify-center text-zinc-300">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin imágenes añadidas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modifiers Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Plus size={18} className="text-primary" /> Modificadores / Extras
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-2xl">
                <input 
                  type="text"
                  placeholder="Nombre: Ej. Extra Queso"
                  className="bg-white border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                  value={newModifier.name}
                  onChange={e => setNewModifier({...newModifier, name: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="Precio Extra ($)"
                    className="flex-1 bg-white border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                    value={newModifier.extraPrice}
                    onChange={e => setNewModifier({...newModifier, extraPrice: parseFloat(e.target.value) || 0})}
                  />
                  <button 
                    type="button"
                    onClick={handleAddModifier}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.modifiers.map((mod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-sm">{mod.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-zinc-900 text-xs">+ ${mod.extraPrice.toFixed(2)}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveModifier(idx)}
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <footer className="p-6 border-t border-zinc-100 bg-zinc-50 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold text-sm hover:bg-zinc-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all"
            >
              Guardar Producto
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;
