/**
 * Utility to generate a formatted WhatsApp message for orders.
 */
export const generateWhatsAppMessage = (orderData, cart, totalUSD, totalBS) => {
  const { name, phone, deliveryType, address, deliveryCostUSD, paymentMethod } = orderData;
  
  const paymentText = {
    'zelle': '🇺🇸 Zelle (Dólares)',
    'pago_movil': '🇻🇪 Pago Móvil (Bolívares)',
    'cash': '💵 Efectivo'
  }[paymentMethod] || 'No especificado';

  const itemsText = cart.map(item => {
    const modifiersText = item.selectedModifiers 
      ? Object.entries(item.selectedModifiers).map(([k, v]) => `  - ${k}: ${v}`).join('\n')
      : '';
    return `*${item.quantity}x ${item.name}* (${item.price.toFixed(2)}$)\n${modifiersText}`;
  }).join('\n');

  const message = `
*NUEVO PEDIDO - PRYSMA FAST FOOD* 🍔

*Datos del Cliente:*
👤 Nombre: ${name}
📞 Teléfono: ${phone}
🚚 Tipo: ${deliveryType === 'delivery' ? 'Delivery' : 'Retiro en Tienda'}
📍 Dirección: ${address || 'N/A'}
💳 Pago: ${paymentText}

*Detalles del Pedido:*
${itemsText}

*Subtotal:* ${totalUSD.toFixed(2)}$
*Delivery:* ${deliveryCostUSD ? deliveryCostUSD.toFixed(2) + '$' : 'Gratis'}
*TOTAL A PAGAR:* 
💰 *${(totalUSD + (deliveryCostUSD || 0)).toFixed(2)}$*
🇻🇪 *${totalBS.toFixed(2)} Bs.*

_Por favor, confirme la recepción indicando sus datos de pago._
  `.trim();

  return encodeURIComponent(message);
};

export const openWhatsApp = (phone, message) => {
  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, '_blank');
};
