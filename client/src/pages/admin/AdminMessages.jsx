import React, { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle2, Phone, MessageSquare, ExternalLink, Loader2, Clock } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export function AdminMessages() {
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getMessages();
      setMessages(data || []);
    } catch (err) {
      showToast('Failed to load inquiries: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markRead = async (id) => {
    try {
      await api.markMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
    } catch (err) {
      // safe fallback
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry from records?')) return;
    try {
      await api.deleteMessage(id);
      showToast('Inquiry removed');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (activeMessage?.id === id) setActiveMessage(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete inquiry', 'error');
    }
  };

  const handleOpen = (msg) => {
    setActiveMessage(msg);
    if (!msg.is_read) {
      markRead(msg.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Patron Inquiries & Concierge Dispatch
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Direct messages received via the public boutique contact salon
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Retrieving inquiries...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No customer inquiries on record.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List (5 cols) */}
          <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 divide-y divide-stone-800">
            {messages.map((m) => (
              <div
                key={m.id}
                onClick={() => handleOpen(m)}
                className={`p-4 cursor-pointer transition-colors ${
                  activeMessage?.id === m.id
                    ? 'bg-stone-900 border-l-2 border-amber-400'
                    : 'hover:bg-stone-900/50'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="font-bold text-white text-xs truncate">{m.name}</h4>
                  <span className="text-[10px] text-stone-500 font-mono shrink-0">{m.created_at?.slice(0, 10)}</span>
                </div>
                <p className="text-xs text-amber-300 font-mono truncate">{m.subject}</p>
                <p className="text-stone-400 text-[11px] line-clamp-1 mt-1 font-sans">{m.message}</p>
                {!m.is_read && (
                  <span className="inline-block mt-2 text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 border border-amber-500/30 font-mono">
                    NEW INQUIRY
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Details (7 cols) */}
          <div className="lg:col-span-7 bg-stone-950/80 border border-stone-800 p-6">
            {activeMessage ? (
              <div className="space-y-6 text-xs font-mono">
                <div className="flex justify-between items-start pb-4 border-b border-stone-800">
                  <div>
                    <span className="text-[10px] uppercase text-amber-400 font-bold block">Inquiry Subject</span>
                    <h3 className="font-serif text-xl font-bold text-white mt-0.5">{activeMessage.subject}</h3>
                    <p className="text-stone-400 text-[11px] mt-1">From: <strong className="text-white">{activeMessage.name}</strong> ({activeMessage.email})</p>
                    {activeMessage.phone && <p className="text-stone-400 text-[11px]">Phone: {activeMessage.phone}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(activeMessage.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-400 bg-stone-900 border border-stone-700"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-stone-900 border border-stone-800 font-sans text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {activeMessage.message}
                </div>

                <div className="flex gap-3 pt-3 border-t border-stone-800">
                  <a
                    href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>

                  {activeMessage.phone && (
                    <a
                      href={`https://wa.me/${activeMessage.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-stone-500 font-mono text-xs">
                Select an inquiry from the column to review details.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
