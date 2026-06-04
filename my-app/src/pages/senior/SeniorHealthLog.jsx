import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';

export default function SeniorHealthLog() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const { startVoiceInput } = useVoice();
  const [healthData, setHealthData] = useState({
    heartRate: '',
    bloodPressure: '',
    weight: '',
    sleepHours: '',
    notes: ''
  });

  const handleChange = (e) => {
    setHealthData({ ...healthData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/health', healthData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setHealthData({ heartRate: '', bloodPressure: '', weight: '', sleepHours: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to save health log');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-6xl font-extrabold text-[var(--color-primary)] leading-tight tracking-[-0.03em] mb-4">
          {t('health_log')}
        </h2>
        <p className="text-2xl text-[var(--color-on-surface-variant)]">{t('health_log_desc')}</p>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--color-surface-container-lowest)] rounded-[2rem] p-8 md:p-12 shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-2xl font-bold text-[var(--color-on-surface)]">
              <span className="material-symbols-outlined text-[var(--color-error)] text-3xl">favorite</span>
              {t('heart_rate')}
            </label>
            <div className="relative">
              <input name="heartRate" value={healthData.heartRate} onChange={handleChange} type="number" placeholder="72" className="w-full bg-[var(--color-surface-container-high)] text-2xl p-6 rounded-xl border-none focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none" />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">bpm</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-2xl font-bold text-[var(--color-on-surface)]">
              <span className="material-symbols-outlined text-blue-500 text-3xl">blood_pressure</span>
              {t('blood_pressure')}
            </label>
            <div className="relative">
              <input name="bloodPressure" value={healthData.bloodPressure} onChange={handleChange} type="text" placeholder="120/80" className="w-full bg-[var(--color-surface-container-high)] text-2xl p-6 rounded-xl border-none focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-2xl font-bold text-[var(--color-on-surface)]">
              <span className="material-symbols-outlined text-amber-600 text-3xl">scale</span>
              {t('weight')}
            </label>
            <div className="relative">
              <input name="weight" value={healthData.weight} onChange={handleChange} type="number" placeholder="142" className="w-full bg-[var(--color-surface-container-high)] text-2xl p-6 rounded-xl border-none focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none" />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">lbs</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-2xl font-bold text-[var(--color-on-surface)]">
              <span className="material-symbols-outlined text-indigo-500 text-3xl">bedtime</span>
              {t('sleep_hours')}
            </label>
            <div className="relative">
              <input name="sleepHours" value={healthData.sleepHours} onChange={handleChange} type="number" step="0.5" placeholder="7.5" className="w-full bg-[var(--color-surface-container-high)] text-2xl p-6 rounded-xl border-none focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none" />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">hrs</span>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="flex items-center gap-3 text-2xl font-bold text-[var(--color-on-surface)]">
              <span className="material-symbols-outlined text-stone-500 text-3xl">notes</span>
              {t('notes') || 'Additional Notes'}
            </label>
            <div className="relative flex gap-4">
              <textarea 
                name="notes" 
                value={healthData.notes} 
                onChange={handleChange} 
                placeholder={t('health_notes_placeholder') || "How are you feeling overall?"} 
                className="w-full bg-[var(--color-surface-container-high)] text-2xl p-6 rounded-xl border-none focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none min-h-[150px]"
              />
              <button 
                type="button"
                onClick={() => startVoiceInput((val) => setHealthData(prev => ({...prev, notes: prev.notes + " " + val})))}
                className="shrink-0 w-20 h-20 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-all"
              >
                <span className="material-symbols-outlined text-4xl">mic</span>
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-center">
          <button type="submit" className="w-full md:w-auto px-16 py-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] text-3xl font-extrabold rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 cursor-pointer">
            <span className="material-symbols-outlined text-4xl">save</span>
            {t('save_health_log')}
          </button>
          
          {saved && (
            <p className="mt-6 text-2xl font-bold text-[var(--color-secondary)] animate-[fadeIn_0.3s_ease-out]">
              {t('health_log_saved')}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
