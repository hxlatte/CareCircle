import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';

// --- Subcomponents ---

const TimelineItem = ({ time, icon, title, description, badge, badgeColor, iconColor, isLast }) => (
  <div className="relative pl-12 md:pl-16 pb-10 group">
    {/* Line */}
    {!isLast && <div className="absolute top-8 bottom-0 left-[1rem] md:left-[1.25rem] w-0.5 bg-stone-200 group-hover:bg-stone-300 transition-colors"></div>}
    
    {/* Circle Marker */}
    <div className={`absolute left-0 md:left-1 top-1.5 w-9 h-9 rounded-full border-4 border-white shadow-sm flex items-center justify-center bg-white ${iconColor} z-10`}>
      <span className="material-symbols-outlined text-[1.1rem] leading-none">{icon}</span>
    </div>

    {/* Content Card */}
    <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold tracking-widest">{time}</span>
          <h3 className="text-xl font-bold text-stone-800">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-stone-600 text-base">{description}</p>
    </div>
  </div>
);

const SummaryCard = ({ icon, label, value, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-5 hover:-translate-y-1 transition-transform">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-opacity-10 ${colorClass}`}>
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-800">{value}</p>
    </div>
  </div>
);

const InsightCard = ({ label, message }) => (
  <div className="bg-gradient-to-br from-[#f0f9f4] to-[#e1f5eb] border border-[#b1f0ce] p-6 rounded-2xl shadow-sm">
    <div className="flex gap-4">
      <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl shrink-0">tips_and_updates</span>
      <div>
        <h4 className="font-bold text-[var(--color-primary)] mb-1 text-lg">{label || "Weekly Insight"}</h4>
        <p className="text-stone-700 text-base font-medium leading-relaxed">{message}</p>
      </div>
    </div>
  </div>
);

const HealthLogCard = ({ label, value, unit, icon, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col">
    <div className="flex justify-between items-center mb-3">
      <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{label}</span>
      <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-black text-stone-800">{value}</span>
      <span className="text-sm font-bold text-stone-500">{unit}</span>
    </div>
  </div>
);

// --- Main Page ---

export default function SeniorHistory() {
  const { t } = useLanguage();
  const [timelineData, setTimelineData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/auth/me');
        const userId = userRes.data._id;
        
        const [historyRes, insightsRes, healthRes] = await Promise.all([
          api.get(`/history/${userId}`),
          api.get(`/insights/${userId}`),
          api.get(`/health/${userId}`)
        ]);
        
        // Map backend history to UI timeline data
        const mappedData = historyRes.data.map(item => {
          let badgeColor = "bg-stone-100 text-stone-800";
          let iconColor = "text-stone-600 border-stone-200";
          let icon = "history";
          let badge = t('logged') || "Logged";

          if (item.type === 'checkin') {
            badgeColor = "bg-teal-100 text-teal-800"; iconColor = "text-teal-600 border-teal-200"; icon = "sentiment_satisfied";
          } else if (item.type === 'medication') {
            badgeColor = "bg-green-100 text-green-800"; iconColor = "text-green-600 border-green-200"; icon = "medication"; badge = t(item.data.status?.toLowerCase()) || item.data.status;
          } else if (item.type === 'task') {
            badgeColor = "bg-purple-100 text-purple-800"; iconColor = "text-purple-600 border-purple-200"; icon = "directions_walk"; badge = t('completed');
          } else if (item.type === 'healthlog') {
            badgeColor = "bg-rose-100 text-rose-800"; iconColor = "text-rose-600 border-rose-200"; icon = "favorite";
          } else if (item.type === 'alert') {
            badgeColor = "bg-amber-100 text-amber-800"; iconColor = "text-amber-600 border-amber-200"; icon = "notifications_active"; badge = t('alerts');
          }

          let translatedTitle = item.title ? (t(item.title.toLowerCase()) || item.title) : '';
          let translatedDesc = item.description ? (t(item.description) || item.description) : '';

          // Special case for SOS alerts which contain dynamic names
          if (item.description && item.description.includes('SOS alert')) {
             const name = item.description.split(' ')[0];
             translatedDesc = t('sos_triggered_by', { name: t(name) || name }) || item.description;
          }

          return {
            time: new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon,
            title: translatedTitle,
            description: translatedDesc,
            badge,
            badgeColor,
            iconColor
          };
        });

        setTimelineData(mappedData);
        setInsights(insightsRes.data);
        setHealthLogs(healthRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]); // Re-run when translation function changes

  if (loading) return <div className="p-20 text-center font-bold text-stone-400">{t('loading_history')}</div>;

  return (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-3 tracking-tight">
          {t('wellness_timeline')}
        </h2>
        <p className="text-xl text-[var(--color-on-surface-variant)]">{t('wellness_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Vertical Timeline */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-[#fcfaf8] p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-200">
            <h3 className="text-2xl font-bold mb-8 text-stone-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">today</span>
              {t('todays_activity')}
            </h3>
            <div className="pt-2">
              {timelineData.map((item, index) => (
                <TimelineItem 
                  key={index} 
                  {...item} 
                  isLast={index === timelineData.length - 1} 
                />
              ))}
              {timelineData.length === 0 && <p className="text-center py-10 text-stone-400 italic">{t('no_activities')}</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Summaries & Insights */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          
          {/* Daily Summary Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest px-2 mb-4">{t('daily_summary')}</h3>
            <SummaryCard icon="sentiment_satisfied" label={t('mood_today')} value={insights?.todayMood ? (t(insights.todayMood.toLowerCase()) || insights.todayMood) : '--'} colorClass="bg-teal-100 text-teal-600" />
            <SummaryCard icon="medication" label={t('medicines_taken')} value={insights?.medicationStats ? `${insights.medicationStats.taken}/${insights.medicationStats.total}` : '0/0'} colorClass="bg-green-100 text-green-600" />
            <SummaryCard icon="check_circle" label={t('tasks_completed')} value={insights?.taskStats?.completed || 0} colorClass="bg-purple-100 text-purple-600" />
            <SummaryCard icon="alarm_on" label={t('alerts')} value={insights?.alertCount || 0} colorClass="bg-blue-100 text-blue-600" />
          </div>

          {/* Weekly Insight */}
          <InsightCard label={t('weekly_insight')} message={insights?.averageMoodScore >= 4 ? t('you_are_doing_great') : t('take_care')} />

          {/* Health Logs */}
          <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-200">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4 px-2">{t('latest_vitals')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <HealthLogCard label={t('heart_rate')} value={healthLogs[0]?.heartRate || '--'} unit="bpm" icon="monitor_heart" colorClass="text-rose-500" />
              <HealthLogCard label={t('blood_pressure')} value={healthLogs[0]?.bloodPressure || '--'} unit="" icon="blood_pressure" colorClass="text-orange-500" />
              <HealthLogCard label={t('sleep_hours')} value={healthLogs[0]?.sleepHours || '--'} unit="hrs" icon="bedtime" colorClass="text-indigo-500" />
              <HealthLogCard label={t('weight')} value={healthLogs[0]?.weight || '--'} unit="lbs" icon="scale" colorClass="text-emerald-500" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
