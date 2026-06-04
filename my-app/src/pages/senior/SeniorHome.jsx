import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';

export default function SeniorHome() {
  const [selectedMood, setSelectedMood] = useState('GOOD');
  const [dailyRoutine, setDailyRoutine] = useState([]);
  const [familyMessages, setFamilyMessages] = useState([]);
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [sendingAlert, setSendingAlert] = useState(false);
  
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { handleSpeak, handleSpell, startVoiceInput, stopVoiceInput, isListening, listeningError } = useVoice();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchMessages();
      fetchReminders();
    }
  }, [user, language]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders();
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/${user.id || user._id}?today=true`);
      setDailyRoutine(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${user.id || user._id}`);
      setFamilyMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await api.get(`/reminders/${user.id || user._id}`);
      setReminders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkReminders = () => {
    const now = new Date();
    const reminderToTrigger = reminders.find(r => {
      if (r.status === 'completed') return false;
      const [rHour, rMin] = r.time.split(':').map(Number);
      const rDate = new Date();
      rDate.setHours(rHour, rMin, 0, 0);
      const windowStart = new Date(rDate.getTime() - 5 * 60000);
      const windowEnd = new Date(rDate.getTime() + 10 * 60000);
      const isInsideWindow = now >= windowStart && now <= windowEnd;
      if (r.isSnoozed && r.snoozeTime) {
        const sTime = new Date(r.snoozeTime);
        return now >= sTime;
      }
      if (r.lastTriggered) {
        const lastT = new Date(r.lastTriggered);
        const timeSinceLast = (now.getTime() - lastT.getTime()) / 60000;
        if (timeSinceLast < 20) return false;
      }
      return isInsideWindow;
    });
    if (reminderToTrigger && !activeReminder) {
      setActiveReminder(reminderToTrigger);
    }
  };

  const handleSnooze = async () => {
    if (!activeReminder) return;
    try {
      const snoozeTime = new Date(Date.now() + 10 * 60000);
      await api.patch(`/reminders/${activeReminder._id}/status`, {
        isSnoozed: true,
        snoozeTime: snoozeTime,
        lastTriggered: new Date()
      });
      setActiveReminder(null);
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteReminder = async () => {
    if (!activeReminder) return;
    try {
      await api.patch(`/reminders/${activeReminder._id}/status`, {
        status: 'completed',
        lastTriggered: new Date()
      });
      setActiveReminder(null);
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRoutine = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.patch('/tasks/status', { id, status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    try {
      await api.post('/checkin', {
        mood: selectedMood,
        notes: notes
      });
      alert(t('checkin_success') || 'Check-in saved successfully!');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert(t('checkin_failed') || 'Failed to save check-in');
    }
  };

  const handleEmergency = async () => {
    if (!window.confirm(t('confirm_sos') || "Send EMERGENCY alert to your family?")) return;
    setSendingAlert(true);
    try {
      await api.post('/alerts', {
        userId: user.id || user._id,
        type: 'EMERGENCY',
        message: `${user.name} has triggered an SOS alert!`,
        severity: 'critical'
      });
      alert(t('sos_sent') || 'SOS Alert Sent! Family notified.');
    } catch (err) {
      console.error(err);
      alert(t('sos_failed') || 'Failed to send alert.');
    } finally {
      setSendingAlert(false);
    }
  };

  const moods = [
    { id: 'WONDERFUL', label: t('wonderful') || 'WONDERFUL', icon: 'sentiment_very_satisfied', color: 'text-green-600' },
    { id: 'GOOD', label: t('good') || 'GOOD', icon: 'sentiment_satisfied', color: 'text-teal-600' },
    { id: 'JUST_OKAY', label: t('just_okay') || 'JUST OKAY', icon: 'sentiment_neutral', color: 'text-amber-600' },
    { id: 'TIRED', label: t('tired') || 'TIRED', icon: 'sentiment_dissatisfied', color: 'text-orange-600' },
    { id: 'UNWELL', label: t('unwell') || 'UNWELL', icon: 'sick', color: 'text-red-600' }
  ];

  // Voice Features
  const playDailySummary = async () => {
    try {
      const routine = dailyRoutine || [];
      const completedTasks = routine.filter(r => r && r.status === 'completed').length;
      const totalTasks = routine.length;
      
      let medText = "";
      try {
          const medRes = await api.get('/medications/' + (user.id || user._id));
          if (medRes && Array.isArray(medRes.data)) {
            const taken = medRes.data.filter(m => m && m.status === 'taken').length;
            medText = t('medicine_taken_text', { count: taken });
          }
      } catch(e) {
        console.error("Failed to fetch medicines for summary:", e);
      }

      const userName = user?.name || '';
      const intro = t('daily_summary_intro', { name: userName }) || '';
      const taskText = t('tasks_completed_text', { completed: completedTasks, total: totalTasks }) || '';
      const moodValue = t((selectedMood || 'GOOD').toLowerCase()) || '';
      const moodText = t('mood_was_text', { mood: moodValue }) || '';
      const closing = t('doing_great_text') || '';

      const summary = `${intro} ${medText} ${taskText} ${moodText} ${closing}`.replace(/\s+/g, ' ').trim();
      console.log("Speaking daily summary:", summary);
      handleSpeak(summary);
    } catch (err) {
      console.error("Error in playDailySummary:", err);
    }
  };

  return (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out] relative">
      {/* SOS Button */}
      <button 
        onClick={handleEmergency}
        disabled={sendingAlert}
        className="fixed bottom-10 right-10 w-24 h-24 bg-red-600 text-white font-black text-2xl tracking-widest rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-50 animate-pulse"
      >
        SOS
      </button>

      <div className="mb-12 animate-[slideUp_0.5s_ease-out]">
        <div>
          <h2 className="text-6xl font-extrabold text-[var(--color-primary)] mb-2 tracking-tighter">
            {new Date().getHours() < 12 ? t('good_morning') : new Date().getHours() < 18 ? t('good_afternoon') : t('good_evening')}, {t(user?.name) || t(user?.name?.charAt(0).toUpperCase() + user?.name?.slice(1)) || user?.name}
          </h2>
          <p className="text-2xl text-[var(--color-on-surface-variant)]">{t('you_are_doing_great')}</p>
        </div>
        <button 
          onClick={playDailySummary}
          className="flex items-center gap-3 px-8 py-4 bg-orange-100 text-orange-700 rounded-2xl font-black text-xl hover:bg-orange-200 transition-all active:scale-95 shadow-sm border-2 border-orange-200 mt-4 w-fit"
        >
          <span className="material-symbols-outlined text-3xl">volume_up</span>
          {t('play_summary') || 'Play Summary'}
        </button>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 space-y-8 animate-[slideUp_0.6s_ease-out]">
          <div className="bg-[var(--color-surface-container-lowest)] p-10 rounded-[2rem] shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
            <h3 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-8">{t('how_feeling')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {moods.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all group border-2 ${
                    selectedMood === m.id ? 'bg-[var(--color-secondary-container)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-container-low)] border-transparent hover:border-[var(--color-primary)]/10 hover:bg-[var(--color-secondary-container)]/30'
                  }`}
                >
                  <span className={`material-symbols-outlined text-5xl mb-3 group-hover:scale-110 transition-transform ${selectedMood === m.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}`}>{m.icon}</span>
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="flex gap-2">
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder={t('share_placeholder') || "How was your day?"} className="flex-1 text-xl p-4 bg-[var(--color-surface-container-high)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none" />
                  <button 
                    type="button"
                    onClick={() => isListening ? stopVoiceInput() : startVoiceInput(setNotes)} 
                    className={`p-4 rounded-xl transition-all shadow-sm flex items-center justify-center ${isListening ? 'bg-red-100 text-red-600 animate-pulse border border-red-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700'}`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                  </button>
                </div>
                {isListening && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 font-bold text-sm animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Listening... Click mic to stop.
                  </div>
                )}
                {listeningError && (
                  <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs border border-red-100">
                    {listeningError}
                  </div>
                )}
              </div>
              <button onClick={handleShare} className="w-full sm:w-auto px-8 py-4 bg-[var(--color-primary)] text-white text-xl font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all self-start sm:self-auto">
                {t('share_family') || "Share"}
              </button>
            </div>
          </div>

        </div>

        <div className="space-y-8 animate-[slideUp_0.7s_ease-out]">
          <div className="bg-gradient-to-br from-[#fdf6f0] to-[#f9ede1] p-10 rounded-[2rem] shadow-[0_10px_30px_rgba(28,28,25,0.05)] relative overflow-hidden h-full">
            <span className="material-symbols-outlined text-[8rem] absolute -right-6 -top-6 text-orange-200/50 rotate-12 pointer-events-none">favorite</span>
            <h3 className="text-2xl font-extrabold text-orange-900 mb-6 flex items-center gap-3 relative z-10">
              <span className="material-symbols-outlined">mark_email_unread</span>
              {t('family_messages') || 'Family Notes'}
            </h3>
            <div className="space-y-4 relative z-10">
              {familyMessages.length > 0 ? familyMessages.map((msg, idx) => {
                const displayText = msg.translations?.[language] || msg.text;
                return (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-orange-100 group">
                    <div className="flex justify-between items-start">
                      <p className="text-lg font-medium text-stone-800 italic">"{displayText}"</p>
                      <button onClick={() => handleSpeak(displayText)} className="p-1 text-orange-200 group-hover:text-orange-400 transition-colors"><span className="material-symbols-outlined text-lg">volume_up</span></button>
                    </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-bold text-orange-600">— {msg.senderId?.name || 'Family Member'}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase">
                      {(() => {
                        if (!msg.timestamp) return 'N/A';
                        const d = new Date(msg.timestamp);
                        if (isNaN(d.getTime())) return 'N/A';
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      })()}
                    </p>
                  </div>
                  </div>
                );
              }) : (
                <p className="text-orange-800/60 font-medium italic">{t('no_messages') || 'No messages from family today.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-2xl shadow-2xl animate-[slideUp_0.4s_ease-out] text-center border-4 border-[var(--color-primary)]">
            <div className="w-24 h-24 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <span className="material-symbols-outlined text-5xl">notifications_active</span>
            </div>
            <h2 className="text-5xl font-black text-stone-800 mb-4">{t('reminder_title') || 'Reminder!'}</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
                <p className="text-3xl font-bold text-[var(--color-primary)] uppercase tracking-widest">{activeReminder.title}</p>
                <button onClick={() => handleSpeak(`${t('reminder_title')}: ${activeReminder.title}`)} className="p-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-all"><span className="material-symbols-outlined">volume_up</span></button>
            </div>
            <p className="text-xl text-stone-500 mb-12">{t('scheduled_for')} {activeReminder.time}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button onClick={handleSnooze} className="py-6 px-10 bg-stone-100 text-stone-600 rounded-3xl text-2xl font-black hover:bg-stone-200 transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-3xl">snooze</span>
                {t('snooze') || 'Snooze'} 10m
              </button>
              <button onClick={handleCompleteReminder} className="py-6 px-10 bg-[var(--color-primary)] text-white rounded-3xl text-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
                {t('mark_done') || 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
