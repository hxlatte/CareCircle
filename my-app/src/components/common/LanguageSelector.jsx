import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { user, updateUser } = useAuth();

  const handleChange = async (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    if (user) {
      updateUser({ languagePreference: newLang });
      try {
        await api.patch('/auth/profile', { languagePreference: newLang });
      } catch (err) {
        console.error('Failed to update language preference', err);
      }
    }
  };

  return (
    <div className="relative flex items-center gap-2 bg-[var(--color-surface-container-high)] px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
      <span className="material-symbols-outlined text-stone-500 text-sm">language</span>
      <select 
        value={language}
        onChange={handleChange}
        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-[var(--color-on-surface)] outline-none cursor-pointer pr-6 appearance-none z-10"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="te">తెలుగు</option>
        <option value="mr">मराठी</option>
      </select>
      <span className="material-symbols-outlined absolute right-3 text-stone-500 pointer-events-none text-sm z-0">expand_more</span>
    </div>
  );
}
