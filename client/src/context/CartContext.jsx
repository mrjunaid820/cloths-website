import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import { api } from '../api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Persist items
  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
    const size = selectedSize || (Array.isArray(product.sizes) ? product.sizes[0] : 'Standard');
    const color = selectedColor || (Array.isArray(product.colors) ? (product.colors[0]?.name || product.colors[0]) : 'Standard');

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === product.id && i.size === size && i.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const firstImg = Array.isArray(product.images) ? product.images[0] : product.image || '';
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            price: Number(product.price),
            original_price: Number(product.original_price || product.price),
            image: firstImg,
            size,
            color,
            quantity: Number(quantity),
            sku: product.sku
          }
        ];
      }
    });

    showToast(`Added ${quantity}x "${product.name}" to cart`);
  };

  const removeFromCart = (productId, size, color) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product_id === productId && item.size === size && item.color === color)
      )
    );
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId, size, color, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId && item.size === size && item.color === color) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const updateVariant = (productId, oldSize, oldColor, newSize, newColor) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId && item.size === oldSize && item.color === oldColor) {
          return {
            ...item,
            size: newSize || item.size,
            color: newColor || item.color
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const deliveryThreshold = Number(settings.free_shipping_threshold) || 150;
  const standardDelivery = Number(settings.delivery_charge) || 15;
  const deliveryFee = items.length === 0 ? 0 : subtotal >= deliveryThreshold ? 0 : standardDelivery;
  const amountToFreeShipping = Math.max(0, deliveryThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / deliveryThreshold) * 100));

  // Discount calculation
  let discountAmount = 0;
  if (coupon && coupon.valid) {
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const applyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim();
    if (!code) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(code, subtotal);
      setCoupon(res);
      showToast(res.message || 'Coupon applied successfully!');
    } catch (err) {
      showToast(err.message || 'Invalid coupon code', 'error');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCodeInput('');
    showToast('Coupon removed', 'info');
  };

  // Build WhatsApp pre-filled message for instant checkout in Pakistan
  const getWhatsAppCartUrl = (customerDetails = {}) => {
    const rawPhone = settings.whatsapp_number || '+923004562872';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const formatPKR = (num) => `Rs. ${Math.round(Number(num) || 0).toLocaleString('en-PK')}`;

    let text = `*NEW ORDER - ${settings.store_name || 'AURA ATELIER PAKISTAN'}*\n\n`;
    if (customerDetails.customer_name || customerDetails.name) {
      text += `*Customer:* ${customerDetails.customer_name || customerDetails.name}\n`;
    }
    if (customerDetails.customer_phone || customerDetails.phone) {
      text += `*Phone:* ${customerDetails.customer_phone || customerDetails.phone}\n`;
    }
    if (customerDetails.address) {
      text += `*Address:* ${customerDetails.address}, ${customerDetails.city || ''}\n`;
    }
    if (customerDetails.payment_method) {
      text += `*Payment Method:* ${customerDetails.payment_method}\n`;
    }
    text += `\n*ORDER ITEMS:*\n`;

    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name}\n   • Size: ${item.size} | Color: ${item.color}\n   • Qty: ${item.quantity} x ${formatPKR(item.price)} = ${formatPKR(item.quantity * item.price)}\n`;
    });

    text += `\n*Subtotal:* ${formatPKR(subtotal)}`;
    if (discountAmount > 0) text += `\n*Discount:* -${formatPKR(discountAmount)} (${coupon?.code || 'PROMO'})`;
    text += `\n*Delivery:* ${deliveryFee === 0 ? 'Complimentary' : formatPKR(deliveryFee)}`;
    text += `\n*TOTAL AMOUNT:* ${formatPKR(grandTotal)}`;
    if (customerDetails.notes) text += `\n\n*Special Notes:* ${customerDetails.notes}`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateVariant,
        clearCart,
        subtotal,
        totalItemsCount,
        deliveryFee,
        discountAmount,
        grandTotal,
        amountToFreeShipping,
        freeShippingProgress,
        coupon,
        couponCodeInput,
        setCouponCodeInput,
        couponLoading,
        applyCoupon,
        removeCoupon,
        isDrawerOpen,
        setIsDrawerOpen,
        getWhatsAppCartUrl
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
