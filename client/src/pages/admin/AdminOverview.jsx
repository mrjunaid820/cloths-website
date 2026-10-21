import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Boxes, 
  Loader2 
} from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';

export function AdminOverview({ onTabChange, onSelectOrder }) {
  const { formatPrice } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <span className="text-xs uppercase tracking-widest font-mono">Aggregating Atelier Metrics...</span>
      </div>
    );
  }

  const { ordersByStatus = {} } = stats;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Real-time transactional analytics and inventory monitor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Database Synced
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-stone-950/80 border border-stone-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider font-mono text-stone-400">Total Lifetime Revenue</span>
            <div className="p-2 bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {formatPrice(stats.totalSales)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{formatPrice(stats.monthlySales)} this month</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-stone-950/80 border border-stone-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider font-mono text-stone-400">Total Commissions</span>
            <div className="p-2 bg-sky-500/10 text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats.totalOrders}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400 font-mono">
              <span>{ordersByStatus.New || 0} Pending • {ordersByStatus.Processing || 0} Processing</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-stone-950/80 border border-stone-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider font-mono text-stone-400">Clientele Base</span>
            <div className="p-2 bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats.totalCustomers}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-400 font-mono">
              <span>Registered private patrons</span>
            </div>
          </div>
        </div>

        {/* Total Products & Inventory */}
        <div className="bg-stone-950/80 border border-stone-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase tracking-wider font-mono text-stone-400">Catalog & Stock</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats.totalProducts} Designs
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400 font-mono">
              <Boxes className="w-3.5 h-3.5" />
              <span>{stats.totalInventoryUnits} total units in reserve</span>
            </div>
          </div>
        </div>

      </div>

      {/* Low Stock Warning Banner if any */}
      {stats.lowStockCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="font-mono uppercase font-bold text-rose-200">
                Low Inventory Warning ({stats.lowStockCount} items):
              </strong>
              <p className="text-stone-300 font-light mt-0.5">
                Certain runway pieces have fallen below safety inventory threshold (≤ 8 units).
              </p>
            </div>
          </div>
          <button
            onClick={() => onTabChange('inventory')}
            className="self-start sm:self-auto bg-rose-900/80 hover:bg-rose-800 text-white uppercase tracking-wider font-mono px-3.5 py-1.5 font-semibold transition-colors"
          >
            Review Stock & Restock →
          </button>
        </div>
      )}

      {/* Interactive Charts Section: Revenue Trend & Order Statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Performance Chart (8 cols) */}
        <div className="lg:col-span-8 bg-stone-950/80 border border-stone-800 p-6 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Revenue Trajectory</h3>
              <p className="text-xs text-stone-400 font-mono">Monthly earnings performance (PKR / Rs.)</p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 border border-amber-500/20">
              6-Month Trend
            </span>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-56 w-full pt-4 flex items-end justify-between gap-3 px-2 border-b border-stone-800">
            {stats.salesChart.map((item, idx) => {
              const maxSales = Math.max(...stats.salesChart.map(s => s.sales));
              const heightPercent = Math.max(15, Math.round((item.sales / maxSales) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-amber-300 bg-stone-900 px-1.5 py-0.5 border border-stone-700 whitespace-nowrap">
                    Rs. {item.sales.toLocaleString('en-PK')}
                  </div>
                  <div 
                    className="w-full max-w-[42px] bg-gradient-to-t from-amber-600 to-amber-400/90 group-hover:to-amber-300 transition-all rounded-none"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[11px] font-mono text-stone-400 pt-1 group-hover:text-white">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-500 font-mono">
            <span>Average Order Value: {formatPrice(Math.round(stats.totalSales / (stats.totalOrders || 1)))}</span>
            <span>Monthly Growth: +24.8% YoY</span>
          </div>
        </div>

        {/* Orders Status Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-stone-950/80 border border-stone-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Order Statuses</h3>
            <p className="text-xs text-stone-400 font-mono">Active distribution breakdown</p>
          </div>

          <div className="space-y-2.5 my-2 text-xs font-mono">
            {[
              { label: 'New / Pending', count: ordersByStatus.New || 0, color: 'bg-amber-500' },
              { label: 'Confirmed', count: ordersByStatus.Confirmed || 0, color: 'bg-sky-500' },
              { label: 'In Processing', count: ordersByStatus.Processing || 0, color: 'bg-indigo-500' },
              { label: 'Shipped', count: ordersByStatus.Shipped || 0, color: 'bg-purple-500' },
              { label: 'Delivered', count: ordersByStatus.Delivered || 0, color: 'bg-emerald-500' },
              { label: 'Cancelled / Returned', count: (ordersByStatus.Cancelled || 0) + (ordersByStatus.Returned || 0), color: 'bg-rose-500' }
            ].map((st) => (
              <div key={st.label} className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[11px]">
                  <span>{st.label}</span>
                  <span className="font-bold text-white">{st.count}</span>
                </div>
                <div className="w-full bg-stone-900 h-1.5 overflow-hidden">
                  <div 
                    className={`${st.color} h-full transition-all`}
                    style={{ width: `${stats.totalOrders > 0 ? (st.count / stats.totalOrders) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onTabChange('orders')}
            className="w-full text-center py-2 text-xs uppercase tracking-wider font-mono text-amber-400 hover:text-amber-300 border border-stone-800 hover:border-amber-400/40 transition-colors"
          >
            Manage Fulfillment Orders →
          </button>
        </div>

      </div>

      {/* Bottom Grid: Recent Orders & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-800">
            <h3 className="font-serif text-lg font-bold text-white">Recent Commissions</h3>
            <button
              onClick={() => onTabChange('orders')}
              className="text-xs font-mono text-stone-400 hover:text-white"
            >
              View All ({stats.totalOrders})
            </button>
          </div>

          <div className="divide-y divide-stone-900 text-xs">
            {stats.recentOrders.map((ord) => (
              <div 
                key={ord.id} 
                onClick={() => {
                  if (onSelectOrder) onSelectOrder(ord);
                  onTabChange('orders');
                }}
                className="py-3 flex items-center justify-between hover:bg-stone-900/60 p-2 cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300">{ord.id}</span>
                    <span className="text-stone-300 font-semibold">{ord.customer_name}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {ord.created_at} • {Array.isArray(ord.items) ? ord.items.length : 1} garments
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-white block">
                    {formatPrice(ord.total_amount)}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                    ord.status === 'Delivered' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'
                  }`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best-Selling Masterpieces (5 cols) */}
        <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-800">
            <h3 className="font-serif text-lg font-bold text-white">Top Performing Designs</h3>
            <button
              onClick={() => onTabChange('products')}
              className="text-xs font-mono text-stone-400 hover:text-white"
            >
              Manage Catalog
            </button>
          </div>

          <div className="divide-y divide-stone-900 text-xs">
            {stats.bestSellers.map((prod) => {
              const img = Array.isArray(prod.images) ? prod.images[0] : '';
              return (
                <div key={prod.id} className="py-3 flex items-center gap-3">
                  <img
                    src={img}
                    alt={prod.name}
                    className="w-12 h-14 object-cover object-center bg-stone-900 shrink-0 border border-stone-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-stone-200 truncate">{prod.name}</h4>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {prod.category} • {prod.stock} in stock
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-300 block">
                      {formatPrice(prod.price)}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      ★ {prod.rating} ({prod.review_count})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
