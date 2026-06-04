import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';

export default function SeniorTasks() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleSpeak, handleSpell } = useVoice();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/${user.id || user._id}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, language]);

  const markDone = async (id) => {
    try {
      await api.patch('/tasks/status', { id, status: 'completed' });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading tasks...</div>;

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
      {/* Header Section */}
      <div className="w-full mb-12 text-center md:text-left">
        <h2 className="text-6xl font-extrabold text-[var(--color-primary)] leading-tight tracking-[-0.03em]">{t('daily_tasks') || "Today's Tasks"}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-[var(--color-on-surface-variant)] text-xl">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>{today}</span>
          <span className="mx-2">•</span>
          <span className="font-bold text-[var(--color-primary)]">{pendingCount} {t('tasks_remaining')}</span>
        </div>
      </div>

      {/* Task Bento/Grid Area */}
      <div className="w-full grid grid-cols-1 gap-8">
        {tasks.map(task => {
          const isDone = task.status === 'completed';
          return isDone ? (
            /* Completed Task */
            <div key={task._id} className="bg-[var(--color-surface-container-low)]/50 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-70 grayscale-[0.5]">
              <div className="flex items-center gap-10 flex-1">
                <div>
                  <span className="inline-block px-4 py-1 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] font-bold rounded-full text-sm mb-4">{t('completed')}</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-bold text-[var(--color-on-surface-variant)] leading-snug line-through">
                        {task.titleKey ? t(task.titleKey) : 
                         language === 'te' ? (task.title_te || task.title_en) : 
                         language === 'hi' ? (task.title_hi || task.title_en) : 
                         language === 'mr' ? (task.title_mr || task.title_en) : 
                         task.title_en}
                    </h3>
                    <button onClick={() => handleSpeak(language === 'te' ? (task.title_te || task.title_en) : language === 'hi' ? (task.title_hi || task.title_en) : language === 'mr' ? (task.title_mr || task.title_en) : task.title_en)} className="p-2 text-stone-300 hover:text-stone-600 transition-colors"><span className="material-symbols-outlined text-2xl">volume_up</span></button>
                  </div>
                  <p className="text-xl text-[var(--color-on-surface-variant)] mt-2">{t('assigned_by')}: {task.assignedBy?.name || t('family')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[var(--color-secondary)] text-2xl font-bold">
                <span className="material-symbols-outlined material-symbols-outlined-filled text-[3rem]">verified</span>
                {t('completed')}
              </div>
            </div>
          ) : (
            /* Active Task Card */
            <div key={task._id} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_10px_30px_rgba(28,28,25,0.05)] transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-10 flex-1">
                <div>
                  <span className="inline-block px-4 py-1 bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)] font-bold rounded-full text-sm mb-4">{new Date(task.dueDate).toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US')}</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-4xl font-bold text-[var(--color-on-surface)] leading-snug">
                        {task.titleKey ? t(task.titleKey) : 
                         language === 'te' ? (task.title_te || task.title_en) : 
                         language === 'hi' ? (task.title_hi || task.title_en) : 
                         language === 'mr' ? (task.title_mr || task.title_en) : 
                         task.title_en}
                    </h3>
                    <button onClick={() => handleSpeak(language === 'te' ? (task.title_te || task.title_en) : language === 'hi' ? (task.title_hi || task.title_en) : language === 'mr' ? (task.title_mr || task.title_en) : task.title_en)} className="p-2 text-stone-400 hover:text-[var(--color-primary)] transition-colors"><span className="material-symbols-outlined text-2xl">volume_up</span></button>
                    <button onClick={() => handleSpell(language === 'te' ? (task.title_te || task.title_en) : language === 'hi' ? (task.title_hi || task.title_en) : language === 'mr' ? (task.title_mr || task.title_en) : task.title_en)} className="text-xs font-black text-stone-400 hover:text-stone-600 uppercase tracking-widest transition-colors">{t('voice_spell')}</button>
                  </div>
                  <p className="text-xl text-[var(--color-on-surface-variant)] mt-2">{t('assigned_by')}: {task.assignedBy?.name || t('family')}</p>
                </div>
              </div>
              <button 
                onClick={() => markDone(task._id)}
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] px-12 py-8 rounded-full flex items-center gap-4 text-3xl font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined material-symbols-outlined-filled text-[3rem]">check_circle</span>
                {t('mark_done')}
              </button>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <p className="text-center text-gray-500 py-12 italic">{t('no_tasks')}</p>
        )}

      </div>

    </div>
  );
}
