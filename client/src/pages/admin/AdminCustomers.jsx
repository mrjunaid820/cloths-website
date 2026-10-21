import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, DollarSign, Mail, Phone, MapPin, X, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminCustomers() {
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(search.trim());
      setCustomers(data || []);
    } catch (err) {
      showToast('Failed to load customers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const inspectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const data = await api.getCustomer(cust.id);
      setCustomerOrders(data.orders || []);
    } catch (err) {
      showToast('Failed to load customer orders: ' + err.message, 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Patronage & Client Directory
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Profiles of distinguished buyers, cumulative spending, and commission history
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-stone-950/80 border border-stone-800 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patron name, email, or telephone..."
            className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Retrieving client records...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No patron records located.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5">Client Profile</th>
                <th className="p-3.5">Contact Line</th>
                <th className="p-3.5">Delivery City</th>
                <th className="p-3.5 text-center">Commissions</th>
                <th className="p-3.5 text-right">Lifetime Spend</th>
                <th className="p-3.5 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-sans font-bold text-white block text-sm">{c.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{c.email}</span>
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {c.phone || 'N/A'}
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {c.city || c.address || 'N/A'}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-0.5 bg-stone-900 text-stone-200 border border-stone-700 text-[11px] font-bold">
                      {c.total_orders} orders
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-bold text-amber-400">
                    {formatPrice(c.total_spent)}
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => inspectCustomer(c)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 text-[11px] uppercase font-bold"
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 max-w-2xl w-full shadow-2xl text-xs font-mono animate-fade-in max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-start pb-4 border-b border-stone-800">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">Client Ledger</span>
                <h3 className="font-serif text-2xl font-bold text-white mt-0.5">{selectedCustomer.name}</h3>
                <p className="text-stone-400 text-[11px] mt-1">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                <p className="text-stone-500 text-[11px]">{selectedCustomer.address}, {selectedCustomer.city}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-stone-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-stone-950 border border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block">Total Commissions</span>
                <span className="font-bold text-white text-base">{selectedCustomer.total_orders}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase block">Cumulative Spend</span>
                <span className="font-serif text-xl font-bold text-amber-400">{formatPrice(selectedCustomer.total_spent)}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-stone-400 font-bold block mb-2">Order History</span>
              {loadingOrders ? (
                <div className="py-8 text-center text-stone-500">Loading order records...</div>
              ) : customerOrders.length === 0 ? (
                <div className="p-4 bg-stone-950 border border-stone-800 text-stone-500 text-center">No past orders on record.</div>
              ) : (
                <div className="divide-y divide-stone-800 border border-stone-800 bg-stone-950">
                  {customerOrders.map(o => (
                    <div key={o.id} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="text-amber-400 font-bold">{o.id}</span>
                        <span className="text-stone-400 text-[11px] block">{o.created_at}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">{formatPrice(o.total_amount)}</span>
                        <span className="text-[10px] uppercase text-stone-400">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
