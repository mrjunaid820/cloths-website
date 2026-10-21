/**
 * ==============================================================================
 * AURA ATELIER — Admin Order Fulfillment & Export Controller
 * ==============================================================================
 * Central order management view for atelier administrators:
 * - Real-time consignment updates for Pakistani couriers (TCS, Leopards, Trax, PostEx)
 * - Status transitions (New -> Confirmed -> Processing -> Shipped -> Delivered)
 * - Multi-criteria CSV export (All database orders, current view, or custom dates)
 * - Individual garment breakdown with sizes, colors, and unit PKR prices
 * - Direct printable invoice document generation
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  X, 
  Printer, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminOrders({ selectedOrderId }) {
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected Order for Modal
  const [activeOrder, setActiveOrder] = useState(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderCourier, setOrderCourier] = useState('TCS Express');
  const [orderTrackingNo, setOrderTrackingNo] = useState('');
  const [orderPaymentStatus, setOrderPaymentStatus] = useState('Pending (COD)');

  const validStatuses = ['New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  const pkCouriers = ['TCS Express', 'Leopards Courier', 'Trax Logistics', 'PostEx', 'Call Courier', 'M&P Express'];
  const paymentStatuses = ['Pending (COD)', 'Paid', 'Verification Pending', 'Awaiting Deposit Slip', 'Failed', 'Refunded'];

  const handleSelectOrder = (ord) => {
    setActiveOrder(ord);
    setOrderCourier(ord.courier_name || 'TCS Express');
    setOrderTrackingNo(ord.courier_tracking_number || '');
    setOrderPaymentStatus(ord.payment_status || 'Pending (COD)');
    setStatusUpdateNote('');
  };

  // Export CSV State
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    type: 'all', // 'all' | 'current' | 'custom'
    status: 'all',
    payment_status: 'all',
    startDate: '',
    endDate: ''
  });

  const handleExportCSV = async (mode = 'all') => {
    setExporting(true);
    try {
      let params = {};
      if (mode === 'all') {
        // Export all database orders across all statuses and pagination
        params = {};
      } else if (mode === 'current') {
        // Export orders matching current status filter and search query
        params = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: search.trim() || undefined
        };
      } else if (mode === 'custom') {
        params = {
          status: exportOptions.status !== 'all' ? exportOptions.status : undefined,
          payment_status: exportOptions.payment_status !== 'all' ? exportOptions.payment_status : undefined,
          startDate: exportOptions.startDate || undefined,
          endDate: exportOptions.endDate || undefined,
          search: search.trim() || undefined
        };
      }

      const res = await api.exportOrdersCSV(params);
      showToast(`Orders successfully exported to ${res.filename}`, 'success');
      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      showToast(err.message || 'Failed to export orders to CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        status: statusFilter !== 'all' ? statusFilter : '',
        search: search.trim()
      });
      setOrders(res.orders || []);
      if (selectedOrderId) {
        const found = res.orders?.find(o => o.id === selectedOrderId);
        if (found) handleSelectOrder(found);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast('Failed to load orders: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  const handleStatusChange = async (newStatus) => {
    if (!activeOrder) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.updateOrderStatus(
        activeOrder.id, 
        newStatus, 
        statusUpdateNote || `Status updated to ${newStatus} by concierge director.`,
        orderCourier,
        orderTrackingNo.trim(),
        orderPaymentStatus
      );
      setActiveOrder(updated);
      showToast(`Order #${activeOrder.id} status updated to ${newStatus}`);
      loadOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Order Fulfillment & Client Commissions (PKR)
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Manage Pakistani courier consignments (TCS, Leopards, Trax) and live order statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleExportCSV('all')}
            disabled={exporting}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-stone-950" />
            )}
            <span>Export Orders to CSV</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="px-3 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Filter Orders & Export CSV"
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filter Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 text-xs font-mono uppercase">
          {['all', ...validStatuses].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 transition-colors border ${
                statusFilter === st
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="bg-stone-950/80 border border-stone-800 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID (ORD-...), customer name, phone, or email..."
              className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Accessing transaction ledger...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No commissions match the current filter.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Client Information</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-amber-400">
                    {ord.id}
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {ord.created_at}
                  </td>

                  <td className="p-3.5">
                    <span className="font-sans font-bold text-white block">{ord.customer_name}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{ord.customer_email} • {ord.customer_phone}</span>
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {ord.payment_method}
                  </td>

                  <td className="p-3.5 text-right font-bold text-white">
                    {formatPrice(ord.total_amount)}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold border ${
                      ord.status === 'Delivered'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : ord.status === 'Cancelled'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : ord.status === 'Shipped'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {ord.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleSelectOrder(ord)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1.5 ml-auto text-[11px] uppercase font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8 text-xs font-mono animate-fade-in max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-stone-800">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                  Commission Inspection (Pakistan)
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                  Order Reference: {activeOrder.id}
                </h3>
                <span className="text-stone-400 text-[11px]">Placed: {activeOrder.created_at}</span>
              </div>
              <button onClick={() => setActiveOrder(null)} className="text-stone-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courier & Payment Fulfillment Settings */}
            <div className="p-4 bg-stone-950 border border-stone-800 space-y-3">
              <span className="uppercase text-amber-400 font-bold block text-[11px]">
                🚚 Pakistani Courier & Payment Status Assignment:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-stone-400 block mb-1">Courier Partner</label>
                  <select
                    value={orderCourier}
                    onChange={(e) => setOrderCourier(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {pkCouriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-stone-400 block mb-1">Tracking / Consignment #</label>
                  <input
                    type="text"
                    value={orderTrackingNo}
                    onChange={(e) => setOrderTrackingNo(e.target.value)}
                    placeholder="e.g. 7748921820"
                    className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-stone-400 block mb-1">Payment Status</label>
                  <select
                    value={orderPaymentStatus}
                    onChange={(e) => setOrderPaymentStatus(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {paymentStatuses.map(ps => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status Change Bar */}
            <div className="p-4 bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="uppercase text-stone-300 font-bold">Update Order Status:</span>
                <div className="flex flex-wrap gap-1.5">
                  {validStatuses.map(st => (
                    <button
                      key={st}
                      disabled={updatingStatus || activeOrder.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 text-[11px] uppercase font-bold border transition-colors ${
                        activeOrder.status === st
                          ? 'bg-amber-500 text-stone-950 border-amber-500'
                          : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status note input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={statusUpdateNote}
                  onChange={(e) => setStatusUpdateNote(e.target.value)}
                  placeholder="Optional milestone note for customer tracking timeline (or leave blank for automatic note)..."
                  className="flex-1 bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-950/60 border border-stone-800">
              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">Client Contact</span>
                <h4 className="font-sans font-bold text-white text-sm">{activeOrder.customer_name}</h4>
                <p className="text-stone-400 mt-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {activeOrder.customer_email}</p>
                <p className="text-stone-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {activeOrder.customer_phone}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">Destination Address</span>
                <p className="text-stone-300">{activeOrder.address}</p>
                <p className="text-stone-300">{activeOrder.city} {activeOrder.postal_code}</p>
                {activeOrder.notes && (
                  <p className="mt-2 text-amber-300/80 italic text-[11px]">"{activeOrder.notes}"</p>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-bold block mb-2">Commission Items</span>
              <div className="border border-stone-800 divide-y divide-stone-800 bg-stone-950">
                {Array.isArray(activeOrder.items) && activeOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={it.image} alt={it.name} className="w-10 h-12 object-cover bg-stone-900 border border-stone-800" />
                      <div>
                        <h5 className="font-sans font-semibold text-white">{it.name}</h5>
                        <span className="text-[10px] text-stone-400">
                          Size: {it.size} • Color: {it.color} • Qty: {it.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-white">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="p-4 bg-stone-950 border border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-500 uppercase block">Payment Method</span>
                <span className="font-bold text-stone-300">{activeOrder.payment_method}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase block">Total Commission Value</span>
                <span className="font-serif text-xl font-bold text-amber-400">{formatPrice(activeOrder.total_amount)}</span>
              </div>
            </div>

            {/* Tracking History Timeline */}
            {Array.isArray(activeOrder.tracking_history) && activeOrder.tracking_history.length > 0 && (
              <div>
                <span className="text-[10px] uppercase text-stone-400 font-bold block mb-2">Tracking History</span>
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-2 text-[11px]">
                  {activeOrder.tracking_history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-stone-400 border-b border-stone-900 pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <strong className="text-white uppercase mr-2">{h.status}:</strong>
                        <span>{h.note}</span>
                      </div>
                      <span className="text-stone-500 shrink-0 font-mono">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white uppercase tracking-wider text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-xs"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export Orders CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-700 w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                    Export Orders to CSV
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Download complete Pakistani order ledger with PKR totals & line items
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-3 font-mono text-xs">
              <label className="text-[10px] text-stone-400 uppercase font-bold block">
                Select Export Scope
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExportOptions(prev => ({ ...prev, type: 'all' }))}
                  className={`p-3 border text-left transition-all ${
                    exportOptions.type === 'all'
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <strong className="block text-amber-400 mb-0.5">All Orders</strong>
                  <span className="text-[10px] text-stone-400">Every database record across all pages</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportOptions(prev => ({ ...prev, type: 'current' }))}
                  className={`p-3 border text-left transition-all ${
                    exportOptions.type === 'current'
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <strong className="block text-amber-400 mb-0.5">Current View</strong>
                  <span className="text-[10px] text-stone-400">Status: {statusFilter} {search ? `• Search: "${search}"` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportOptions(prev => ({ ...prev, type: 'custom' }))}
                  className={`p-3 border text-left transition-all ${
                    exportOptions.type === 'custom'
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <strong className="block text-amber-400 mb-0.5">Custom Filter</strong>
                  <span className="text-[10px] text-stone-400">Date range & status criteria</span>
                </button>
              </div>

              {/* Custom Criteria Options */}
              {exportOptions.type === 'custom' && (
                <div className="p-4 bg-stone-950 border border-stone-800 space-y-3 mt-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={exportOptions.startDate}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase block mb-1">End Date</label>
                      <input
                        type="date"
                        value={exportOptions.endDate}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase block mb-1">Order Status</label>
                      <select
                        value={exportOptions.status}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400 uppercase"
                      >
                        <option value="all">All Statuses</option>
                        {validStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 uppercase block mb-1">Payment Status</label>
                      <select
                        value={exportOptions.payment_status}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, payment_status: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-700 p-2 text-xs text-white focus:outline-none focus:border-amber-400 uppercase"
                      >
                        <option value="all">All Payment Statuses</option>
                        {paymentStatuses.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formatting Guarantee Notice */}
            <div className="p-3 bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-400 space-y-1">
              <p className="flex items-center gap-1.5 text-stone-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Includes Order ID, Customer info, Address, City & Tracking Number.</span>
              </p>
              <p className="flex items-center gap-1.5 text-stone-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Multi-product breakdown: individual sizes, colors, quantities & PKR unit prices.</span>
              </p>
              <p className="flex items-center gap-1.5 text-stone-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Encoded in UTF-8 with BOM for Microsoft Excel compatibility.</span>
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-stone-700 text-stone-300 hover:text-white uppercase font-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => handleExportCSV(exportOptions.type)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase font-mono text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Exporting Database Records...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-stone-950" />
                    <span>Download CSV Spreadsheet</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
