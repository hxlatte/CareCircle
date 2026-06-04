import React, { useState, useEffect } from 'react';
import { Bell, X, Check, MessageSquare, Pill, AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import api from '../api';

export default function NotificationPanel({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const { handleSpeak } = useVoice();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState({});

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/notifications?lang=${language}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl animate-[slideInRight_0.3s_ease-out] flex flex-col">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <Bell className="text-[var(--color-primary)]" />
            <h2 className="text-xl font-black text-stone-800 uppercase tracking-tight">{t('notifications') || 'Notifications'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X size={24} className="text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const hasTranslation = n.translations && n.translations[language] && n.translations[language].message && n.translations[language].message !== n.message;
              const isToggledOriginal = showOriginal[n._id];
              const displayTitle = isToggledOriginal ? n.title : (n.translations?.[language]?.title || t(n.titleKey || n.title) || n.title);
              const displayMessage = isToggledOriginal ? n.message : (n.translations?.[language]?.message || n.message);

              return (
                <div 
                  key={n._id} 
                  className={`p-4 rounded-2xl border transition-all ${n.isRead ? 'bg-white border-stone-100 opacity-60' : 'bg-[var(--color-secondary-container)] border-[var(--color-primary)]/10 shadow-sm'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      n.type === 'medicine' ? 'bg-blue-100 text-blue-600' :
                      n.type === 'alert' ? 'bg-red-100 text-red-600' :
                      n.type === 'message' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {n.type === 'medicine' ? <Pill size={20} /> :
                       n.type === 'alert' ? <AlertTriangle size={20} /> :
                       n.type === 'message' ? <MessageSquare size={20} /> :
                       <Check size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-black text-stone-800 truncate">{displayTitle}</p>
                          <button 
                            type="button"
                            onClick={() => handleSpeak(`${displayTitle}. ${displayMessage}`)} 
                            className="p-1 text-stone-400 hover:text-stone-700 transition-colors flex items-center justify-center rounded-full hover:bg-stone-100"
                            title="Speak notification"
                          >
                            <span className="material-symbols-outlined text-base">volume_up</span>
                          </button>
                        </div>
                        {!n.isRead && (
                          <button 
                            onClick={() => markAsRead(n._id)}
                            className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline shrink-0"
                          >
                            {t('mark_read') || 'Mark read'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 font-medium leading-snug mb-2">{displayMessage}</p>
                      
                      {hasTranslation && (
                        <button 
                          type="button"
                          onClick={() => setShowOriginal(prev => ({ ...prev, [n._id]: !prev[n._id] }))}
                          className="text-[var(--color-primary)] hover:text-stone-900 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1 transition-all hover:underline"
                        >
                          <span className="material-symbols-outlined text-xs">translate</span>
                          {isToggledOriginal ? 'View Translated' : 'View Original'}
                        </button>
                      )}

                      <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase">
                        <Clock size={10} />
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
              <Bell size={64} className="opacity-10 mb-4" />
              <p className="font-bold text-sm uppercase tracking-widest">{t('no_notifications') || 'No notifications yet'}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
          >
            {t('close_panel') || 'Close Panel'}
          </button>
        </div>
      </div>
    </div>
  );
}
