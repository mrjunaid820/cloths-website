import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api';

export function AdminLogin({ onExitToStore, onLoginSuccess }) {
  const { login } = useAdminAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    try {
      await login(identifier, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      showToast(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setForgotStep('reset');
      }
    } catch (err) {
      showToast(err.message || 'Failed to process request', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setForgotLoading(true);
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      showToast(res.message);
      setShowForgotModal(false);
      setForgotStep('request');
      setPassword(newPassword);
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center p-4 antialiased">
      
      {/* Brand Watermark / Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-none flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] uppercase text-white">
          AURA ATELIER
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400 font-mono mt-1">
          Boutique Management System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 p-8 shadow-2xl animate-fade-in">
        


        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-300 mb-1.5 font-mono">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@atelier.com"
                className="w-full bg-stone-950 border border-stone-800 pl-9 pr-3 py-3 text-xs text-stone-100 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-300 font-mono">
                Password
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotEmail(identifier); }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-stone-950 border border-stone-800 pl-9 pr-3 py-3 text-xs text-stone-100 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs uppercase tracking-[0.2em] font-bold py-3.5 px-4 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter Administration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-800/80 text-center">
          <button
            onClick={onExitToStore}
            className="text-xs text-stone-400 hover:text-stone-200 uppercase tracking-wider font-mono transition-colors"
          >
            ← Return to Public Fashion Boutique
          </button>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="font-serif text-xl font-bold text-white mb-2">
              {forgotStep === 'request' ? 'Password Recovery' : 'Configure New Password'}
            </h3>
            <p className="text-xs text-stone-400 mb-6 font-mono">
              {forgotStep === 'request' 
                ? 'Enter your registered administrator email to receive reset credentials.' 
                : 'Enter the recovery token and establish a new secure master password.'}
            </p>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-stone-300 font-mono mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 border border-stone-700 text-xs uppercase tracking-wider text-stone-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider py-2.5"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Recovery'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-stone-300 font-mono mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-stone-300 font-mono mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-stone-950 border border-stone-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 border border-stone-700 text-xs uppercase tracking-wider text-stone-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider py-2.5"
                  >
                    {forgotLoading ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
