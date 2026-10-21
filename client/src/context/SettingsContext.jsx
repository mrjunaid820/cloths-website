import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    store_name: 'AURA ATELIER',
    tagline: 'Haute Couture & Contemporary Sartorial Luxury — Pakistan',
    announcement_bar: 'COMPLIMENTARY EXPRESS DELIVERY ACROSS PAKISTAN ON ORDERS OVER RS. 7,500 | CASH ON DELIVERY AVAILABLE',
    logo_text: 'AURA ATELIER',
    currency: 'Rs.',
    delivery_charge: '299',
    local_delivery_charge: '199',
    free_shipping_threshold: '7500',
    tax_rate: '0',
    phone: '+92 300 4562872',
    whatsapp_number: '+923004562872',
    email: 'concierge@auraatelier.pk',
    address: '12-C, MM Alam Road, Gulberg III, Lahore, Pakistan',
    bank_name: 'Meezan Bank Limited',
    bank_account_title: 'Aura Atelier Fashion Pvt Ltd',
    bank_iban: 'PK52MEZN0001000102030405',
    bank_raast_id: '03004562872',
    google_maps_embed: 'https://maps.google.com/?q=MM+Alam+Road+Lahore',
    opening_hours: 'Monday – Saturday: 11:00 AM – 10:00 PM | Sunday: 2:00 PM – 9:00 PM',
    facebook_url: 'https://facebook.com/auraatelier.pk',
    instagram_url: 'https://instagram.com/auraatelier.pk',
    tiktok_url: 'https://tiktok.com/@auraatelier.pk',
    youtube_url: 'https://youtube.com/@auraatelier',
    return_policy_days: '30'
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          // Ensure currency is always Rs. even if legacy value was '$'
          currency: (data.currency && data.currency !== '$') ? data.currency : 'Rs.'
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const formatPrice = (val) => {
    const num = Number(val) || 0;
    const symbol = (settings.currency && settings.currency !== '$') ? settings.currency : 'Rs.';
    return `${symbol} ${Math.round(num).toLocaleString('en-PK')}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
