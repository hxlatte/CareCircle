import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Calendar, FileText, AlertTriangle, ChevronRight, Pill, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  
  const [insights, setInsights] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user?.linkedSeniorId) {
      setLoading(false);
      return;
    }

    try {
      const [insightsRes, tasksRes] = await Promise.all([
        api.get(`/insights/${user.linkedSeniorId}`),
        api.get('/tasks/family')
      ]);
      setInsights(insightsRes.data);
      setTasks(tasksRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to connect to care services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (!user?.linkedSeniorId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6 text-center">
        <div className="bg-white p-12 rounded-[var(--radius-xl)] shadow-xl max-w-md">
          <AlertTriangle className="w-16 h-16 text-[var(--color-tertiary)] mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t('no_senior_linked')}</h2>
          <p className="text-[var(--color-on-surface-variant)] mb-8">Please link a senior citizen account to start monitoring their health.</p>
          <button onClick={() => navigate('/')} className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-full font-bold">
            {t('go_to_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 md:p-12 pb-24">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-[var(--color-on-surface)] mb-2">{t('family_dashboard')}</h1>
          <p className="text-[var(--color-on-surface-variant)] text-xl">Monitoring {insights?.seniorName || 'Senior'}'s Care</p>
        </div>
        <div className="flex gap-4">
          <button className="w-14 h-14 rounded-full bg-[var(--color-surface-container)] overflow-hidden soft-lift border-2 border-[var(--color-primary)] cursor-pointer">
            <img src={`https://ui-avatars.com/api/?name=${insights?.seniorName || 'S'}&background=b1f0ce&color=002114`} alt="Senior" />
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-[var(--color-error-container)] text-[var(--color-on-error-container)] p-4 rounded-xl mb-8 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Health Status Card */}
          <div className="bg-[var(--color-surface-container-highest)] p-8 rounded-[var(--radius-xl)] ambient-shadow">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center gap-3">
                <Activity className="text-[var(--color-secondary)] w-7 h-7" />
                {t('health_status')}
              </h2>
              <span className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide ${
                insights?.alertCount > 0 ? 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]' : 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]'
              }`}>
                {insights?.alertCount > 0 ? 'ATTENTION NEEDED' : 'STABLE'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[var(--radius-lg)] text-center soft-lift">
                <div className="text-[var(--color-on-surface-variant)] text-xs mb-2 font-bold uppercase tracking-widest">{t('heart_rate')}</div>
                <div className="text-4xl font-bold text-[var(--color-on-surface)]">{insights?.latestVitals?.heartRate || '--'} <span className="text-lg font-medium text-[var(--color-on-surface-variant)]">bpm</span></div>
              </div>
              <div className="bg-white p-6 rounded-[var(--radius-lg)] text-center soft-lift">
                <div className="text-[var(--color-on-surface-variant)] text-xs mb-2 font-bold uppercase tracking-widest">{t('sleep')}</div>
                <div className="text-4xl font-bold text-[var(--color-on-surface)]">{insights?.averageSleepHours || '--'} <span className="text-lg font-medium text-[var(--color-on-surface-variant)]">h</span></div>
              </div>
              <div className="bg-white p-6 rounded-[var(--radius-lg)] text-center soft-lift">
                <div className="text-[var(--color-on-surface-variant)] text-xs mb-2 font-bold uppercase tracking-widest">MOOD</div>
                <div className="text-2xl font-bold text-[var(--color-on-surface)] uppercase">{insights?.todayMood?.replace('_', ' ') || '--'}</div>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-[var(--color-surface-container-low)] p-8 rounded-[var(--radius-xl)] border border-[var(--color-surface-container-highest)]">
             <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-6 flex items-center gap-3">
                <Calendar className="text-[var(--color-primary)] w-7 h-7" />
                {t('schedule')}
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length > 0 ? tasks.map(task => (
                  <div key={task._id} className="flex items-center gap-6 p-5 bg-white rounded-[var(--radius-lg)] soft-lift group">
                    <div className="text-[var(--color-primary)] font-bold text-lg min-w-[90px]">
                      {new Date(task.dueDate || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-[var(--color-on-surface)]">{task.title}</div>
                      <div className={`text-sm font-medium mt-1 ${task.status === 'completed' ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                        {task.status === 'completed' ? `Completed at ${new Date(task.completedAt).toLocaleTimeString()}` : 'Pending'}
                      </div>
                    </div>
                    {task.status === 'completed' ? (
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-on-primary-fixed)] font-bold">✓</div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-outline)] font-bold">...</div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-12 text-[var(--color-on-surface-variant)]">
                    No tasks scheduled for today.
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Alerts */}
          <div className={`${insights?.alertCount > 0 ? 'bg-[var(--color-error-container)]' : 'bg-[var(--color-tertiary-fixed)]'} p-8 rounded-[var(--radius-xl)] relative overflow-hidden soft-lift transition-colors duration-500`}>
            <h2 className={`text-2xl font-bold ${insights?.alertCount > 0 ? 'text-[var(--color-on-error-container)]' : 'text-[var(--color-on-tertiary-fixed)]'} mb-5 flex items-center gap-3 relative z-10`}>
              <AlertTriangle className="w-7 h-7" />
              {t('recent_alerts')}
            </h2>
            <div className="space-y-3 relative z-10">
              {insights?.recentAlerts?.length > 0 ? insights.recentAlerts.map(alert => (
                <div key={alert._id} className="bg-white/70 p-4 rounded-[var(--radius-lg)] backdrop-blur-md">
                  <p className="font-bold text-[var(--color-on-surface)]">{alert.message}</p>
                  <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-1">
                    {new Date(alert.date).toLocaleString()}
                  </p>
                </div>
              )) : (
                <div className="bg-white/70 p-6 rounded-[var(--radius-lg)] backdrop-blur-md">
                  <p className="font-bold text-center text-[var(--color-on-surface-variant)]">All clear</p>
                </div>
              )}
            </div>
            <AlertTriangle className="absolute -bottom-10 -right-10 w-48 h-48 text-current opacity-[0.08] rotate-12" />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-[var(--color-surface-container-highest)] p-8 rounded-[var(--radius-lg)] text-center soft-lift hover:bg-[var(--color-primary-fixed)] hover:text-[var(--color-on-primary-fixed)] transition-colors group cursor-pointer">
              <FileText className="mx-auto mb-4 text-[var(--color-outline)] group-hover:text-[var(--color-on-primary-fixed)] w-8 h-8" />
              <span className="font-bold text-base tracking-wide uppercase">{t('reports')}</span>
            </button>
            <button className="bg-[var(--color-surface-container-highest)] p-8 rounded-[var(--radius-lg)] text-center soft-lift hover:bg-[var(--color-primary-fixed)] hover:text-[var(--color-on-primary-fixed)] transition-colors group cursor-pointer">
              <Pill className="mx-auto mb-4 text-[var(--color-outline)] group-hover:text-[var(--color-on-primary-fixed)] w-8 h-8" />
              <span className="font-bold text-base tracking-wide uppercase">{t('medicines')}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <button onClick={() => { logout(); navigate('/'); }} className="text-[var(--color-primary)] underline font-medium p-4 text-lg cursor-pointer hover:text-[var(--color-primary-container)]">
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

