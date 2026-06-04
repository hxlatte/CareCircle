import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';

export default function SeniorMedicines() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleSpeak, handleSpell } = useVoice();

  const fetchMedicines = async () => {
    try {
      const res = await api.get(`/medications/${user.id || user._id}`);
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMedicines();
    }
  }, [user]);

  const markTaken = async (id) => {
    try {
      await api.patch('/medications/status', { id, status: 'taken' });
      fetchMedicines();
    } catch (err) {
      console.error('Error updating medicine status:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">{t('loading_medicines')}</div>;

  const pendingCount = medicines.filter(m => m.status !== 'taken').length;

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
      {/* Header Section */}
      <div className="w-full mb-12 text-center md:text-left">
        <p className="text-[var(--color-secondary)] font-bold tracking-widest uppercase text-sm mb-2">{t('health_plan')}</p>
        <h2 className="text-6xl font-extrabold text-[var(--color-primary)] leading-tight tracking-[-0.03em]">{t('your_medicines')}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-[var(--color-on-surface-variant)] text-xl">
          <span className="material-symbols-outlined">medication</span>
          <span className="font-bold text-[var(--color-primary)]">{pendingCount} {t('doses_remaining')}</span>
        </div>
      </div>

      {/* Grid Area */}
      <div className="w-full grid grid-cols-1 gap-8">
        {medicines.map(med => {
          const isTaken = med.status === 'taken';
          return isTaken ? (
            /* Completed Task */
            <div key={med._id} className="bg-[var(--color-surface-container-low)]/50 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-70 grayscale-[0.5]">
              <div className="flex items-center gap-10 flex-1">
                <div className="w-32 h-32 rounded-full bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[3rem] text-[var(--color-on-surface-variant)]">pill</span>
                </div>
                <div>
                  <span className="inline-block px-4 py-1 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] font-bold rounded-full text-sm mb-4">{t('taken')}</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-bold text-[var(--color-on-surface-variant)] leading-snug line-through">{med.translations?.[language]?.medicineName || med.medicineName}</h3>
                    <button onClick={() => handleSpeak(med.translations?.[language]?.medicineName || med.medicineName)} className="p-2 text-stone-300 hover:text-stone-600 transition-colors"><span className="material-symbols-outlined text-2xl">volume_up</span></button>
                  </div>
                  <p className="text-xl text-[var(--color-on-surface-variant)] mt-2">{med.translations?.[language]?.dosage || med.dosage} {t('at')} {med.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[var(--color-secondary)] text-2xl font-bold">
                <span className="material-symbols-outlined material-symbols-outlined-filled text-[3rem]">verified</span>
                {t('taken')}
              </div>
            </div>
          ) : (
            /* Active Card */
            <div key={med._id} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-10 border-l-[12px] border-[var(--color-secondary)] flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_10px_30px_rgba(28,28,25,0.05)] transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-10 flex-1">
                <div className="w-32 h-32 rounded-full bg-[var(--color-secondary-container)] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[3rem] text-[var(--color-on-secondary-container)]">medication</span>
                </div>
                <div>
                  <span className="inline-block px-4 py-1 bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)] font-bold rounded-full text-sm mb-4">{med.time}</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-bold text-[var(--color-on-surface)] leading-snug">{med.translations?.[language]?.medicineName || med.medicineName}</h3>
                    <button onClick={() => handleSpeak(med.translations?.[language]?.medicineName || med.medicineName)} className="p-2 text-stone-400 hover:text-[var(--color-secondary)] transition-colors"><span className="material-symbols-outlined text-2xl">volume_up</span></button>
                    <button onClick={() => handleSpell(med.translations?.[language]?.medicineName || med.medicineName)} className="text-xs font-black text-stone-400 hover:text-stone-600 uppercase tracking-widest transition-colors">{t('voice_spell')}</button>
                  </div>
                  <p className="text-xl text-[var(--color-on-surface-variant)] mt-2">{t('dosage')}: {med.translations?.[language]?.dosage || med.dosage}</p>
                </div>
              </div>
              <button 
                onClick={() => markTaken(med._id)}
                className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-fixed-dim)] text-[var(--color-on-secondary)] px-12 py-8 rounded-full flex items-center gap-4 text-3xl font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined material-symbols-outlined-filled text-[3rem]">check_circle</span>
                {t('take_now')}
              </button>
            </div>
          );
        })}
        {medicines.length === 0 && <p className="text-center text-gray-500 py-12 italic">{t('no_medicines')}</p>}
      </div>
    </div>
  );
}
