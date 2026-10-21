import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldCheck, 
  Truck, 
  PhoneCall, 
  ExternalLink 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Header({ onNavigate, currentPage, onOpenSearch }) {
  const { settings } = useSettings();
  const { totalItemsCount, setIsDrawerOpen } = useCart();
  const { wishlist, setIsWishlistOpen } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [cartAnimate, setCartAnimate] = useState(false);

  // Trigger bounce animation when cart count changes
  useEffect(() => {
    if (totalItemsCount > 0) {
      setCartAnimate(true);
      const timer = setTimeout(() => setCartAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItemsCount]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', page: 'home' },
    { label: 'Shop', page: 'shop' },
    { label: 'Men', page: 'shop', category: 'Men' },
    { label: 'Women', page: 'shop', category: 'Women' },
    { label: 'Kids', page: 'shop', category: 'Kids' },
    { label: 'New Arrivals', page: 'shop', filter: 'new' },
    { label: 'Best Sellers', page: 'shop', filter: 'popular' },
    { label: 'Sale', page: 'shop', filter: 'sale' },
    { label: 'About', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleLinkClick = (link) => {
    setMobileMenuOpen(false);
    if (link.category) {
      onNavigate('shop', { category: link.category });
    } else if (link.filter) {
      onNavigate('shop', { filter: link.filter });
    } else {
      onNavigate(link.page);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Top Announcement Bar */}
      {settings.announcement_bar && (
        <div 
          className="text-[11px] tracking-widest uppercase font-medium py-2 px-4 text-center border-b flex items-center justify-center gap-3 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--bg-announcement)',
            color: 'var(--text-announcement)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <span>{settings.announcement_bar}</span>
        </div>
      )}

      {/* Main Luxury Navigation Bar */}
      <div 
        className={`w-full transition-all duration-300 border-b ${
          isScrolled 
            ? 'backdrop-blur-md shadow-sm py-3' 
            : 'py-4 sm:py-5'
        }`}
        style={{
          backgroundColor: isScrolled ? 'var(--bg-header-scrolled)' : 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Mobile Menu Hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 transition-colors focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex flex-col items-center cursor-pointer select-none" onClick={() => onNavigate('home')}>
            <span 
              className="font-serif text-2xl sm:text-3xl tracking-[0.25em] uppercase font-bold leading-none transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {settings.logo_text || 'AURA ATELIER'}
            </span>
            <span 
              className="text-[9px] tracking-[0.35em] uppercase mt-1 font-light hidden sm:block transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              HAUTE COUTURE & READY-TO-WEAR
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
            {navLinks.map((link) => {
              const isActive = currentPage === link.page && !link.filter && !link.category;
              return (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(link)}
                  className={`text-xs tracking-[0.16em] uppercase font-medium transition-all duration-200 py-1 relative ${
                    isActive 
                      ? 'font-bold' 
                      : link.label === 'Sale'
                      ? 'text-rose-600 font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    color: isActive ? 'var(--text-primary)' : link.label === 'Sale' ? '#e11d48' : 'var(--text-secondary)'
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span 
                      className="absolute bottom-0 left-0 w-full h-[1.5px]"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher Component */}
            <ThemeSwitcher variant="dropdown" />

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 transition-colors hover:scale-105"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Search Catalog"
              title="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 transition-colors relative hover:scale-105"
              style={{ color: 'var(--text-primary)' }}
              aria-label="View Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span 
                  className="absolute top-1 right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs animate-heart-pop"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2 transition-all relative hover:scale-105 ${cartAnimate ? 'animate-cart-bounce' : ''}`}
              style={{ color: 'var(--text-primary)' }}
              aria-label="View Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span 
                  className="absolute top-1 right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Customer Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="p-2 transition-colors flex items-center gap-1 hover:scale-105"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Customer Account"
                title="Account"
              >
                <User className="w-5 h-5" />
                <ChevronDown className="w-3 h-3 hidden sm:block opacity-60" />
              </button>

              {accountMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setAccountMenuOpen(false)} 
                  />
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-fade-in text-xs tracking-wider uppercase"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <button
                      onClick={() => { setAccountMenuOpen(false); onNavigate('account'); }}
                      className="w-full text-left px-4 py-2.5 hover:opacity-80 flex items-center justify-between"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span>My Profile & Orders</span>
                    </button>
                    <button
                      onClick={() => { setAccountMenuOpen(false); onNavigate('track'); }}
                      className="w-full text-left px-4 py-2.5 hover:opacity-80 flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Truck className="w-3.5 h-3.5 opacity-60" />
                      <span>Track Order</span>
                    </button>
                    <button
                      onClick={() => { setAccountMenuOpen(false); setIsWishlistOpen(true); }}
                      className="w-full text-left px-4 py-2.5 hover:opacity-80 flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Heart className="w-3.5 h-3.5 opacity-60" />
                      <span>My Saved Wishlist</span>
                    </button>
                    <div className="border-t my-1" style={{ borderColor: 'var(--border-subtle)' }} />
                    <button
                      onClick={() => { setAccountMenuOpen(false); onNavigate('admin'); }}
                      className="w-full text-left px-4 py-2.5 text-amber-500 font-semibold flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Admin Dashboard</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div 
            className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-fade-in border-r"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-serif text-xl tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--text-primary)' }}>
                  {settings.logo_text || 'AURA ATELIER'}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 opacity-70 hover:opacity-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Theme Selector */}
              <div className="mt-5 pb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <ThemeSwitcher variant="inline" />
              </div>

              <nav className="mt-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleLinkClick(link)}
                    className="text-left text-sm tracking-[0.16em] uppercase py-2 font-medium border-b hover:opacity-80 transition-colors"
                    style={{
                      color: link.label === 'Sale' ? '#e11d48' : 'var(--text-primary)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('track'); }}
                  className="text-left text-xs tracking-wider uppercase py-2 flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Truck className="w-4 h-4 opacity-60" />
                  Track Your Order
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('account'); }}
                  className="text-left text-xs tracking-wider uppercase py-2 flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <User className="w-4 h-4 opacity-60" />
                  Customer Account
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin'); }}
                  className="text-left text-xs tracking-wider uppercase py-2.5 font-semibold flex items-center gap-2 rounded-xl px-3 mt-2"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Admin Dashboard Portal
                </button>
              </div>
            </div>

            <div className="pt-6 border-t text-[11px] space-y-1" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              <p className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                <PhoneCall className="w-3.5 h-3.5 opacity-60" />
                {settings.phone}
              </p>
              <p>{settings.email}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
