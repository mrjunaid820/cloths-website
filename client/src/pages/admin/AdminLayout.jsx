import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Tags, 
  Boxes, 
  Mail, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  ShieldCheck, 
  Bell,
  Star
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSettings } from '../../context/SettingsContext';

export function AdminLayout({ activeTab, onTabChange, onExitToStore, children }) {
  const { admin, logout } = useAdminAuth();
  const { settings } = useSettings();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview & KPIs', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'inventory', label: 'Inventory Control', icon: Boxes },
    { id: 'customers', label: 'Client Directory', icon: Users },
    { id: 'coupons', label: 'Vouchers & Discounts', icon: Tags },
    { id: 'messages', label: 'Contact Inquiries', icon: Mail },
    { id: 'settings', label: 'Atelier Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col antialiased">
      
      {/* Top Navbar */}
      <header className="bg-stone-950 border-b border-stone-800 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 text-stone-400 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-none bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
              AA
            </span>
            <div>
              <span className="font-serif tracking-[0.2em] uppercase font-bold text-sm text-white block leading-none">
                {settings.store_name || 'AURA ATELIER'}
              </span>
              <span className="text-[9px] tracking-widest uppercase text-stone-400 font-mono">
                Security Admin Portal
              </span>
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onExitToStore}
            className="hidden sm:flex items-center gap-1.5 text-xs tracking-wider uppercase text-stone-400 hover:text-white px-3 py-1.5 border border-stone-800 hover:border-stone-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Boutique</span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-stone-800">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-stone-200 block leading-tight">
                {admin?.username || 'Administrator'}
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">
                {admin?.role || 'Master Admin'}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-stone-950/70 border-r border-stone-800/80 flex-col justify-between p-4 shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-stone-500 font-bold font-mono">
              Management Suites
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider font-medium transition-all ${
                    isActive 
                      ? 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-400 font-semibold' 
                      : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80 text-[11px] text-stone-400 space-y-1">
            <div className="flex items-center gap-1.5 text-stone-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Secured</span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono">SQLite WAL • JWT Auth</p>
          </div>
        </aside>

        {/* Mobile Slideout Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-stone-950 p-4 flex flex-col justify-between z-50 border-r border-stone-800">
              <nav className="space-y-1">
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                  Admin Navigation
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider font-medium transition-all ${
                        isActive 
                          ? 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-400 font-semibold' 
                          : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-2 pt-4 border-t border-stone-800">
                <button
                  onClick={onExitToStore}
                  className="w-full text-left text-xs uppercase tracking-wider text-stone-300 py-2 px-3 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Public Boutique</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left text-xs uppercase tracking-wider text-rose-400 py-2 px-3 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace View */}
        <main className="flex-1 overflow-y-auto bg-stone-900/95 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}
