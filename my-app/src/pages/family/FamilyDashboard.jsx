import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Pill, Clock, AlertTriangle, Heart, Moon, Shield } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

import { useLanguage } from '../../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function FamilyDashboard() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const userRes = await api.get('/auth/me');
      // Sync global state in case it was updated elsewhere or by another tab
      if (updateUser) updateUser(userRes.data);
      
      const targetId = userRes.data.role === 'family' ? userRes.data.linkedSeniorId : userRes.data._id;

      if (!targetId) {
        setLoading(false);
        return;
      }

      const res = await api.get(`/insights/${targetId}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
      <Activity size={48} className="text-stone-300 mb-4 animate-bounce" />
      <div className="text-center font-bold text-stone-400">Syncing care data...</div>
    </div>
  );

  if (!data) return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-xl w-full text-center animate-[slideUp_0.4s_ease-out] border-4 border-orange-100">
        <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Shield size={48} />
        </div>
        <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tight">Connect to Senior</h2>
        <p className="text-stone-500 text-xl mb-10 font-medium">To monitor health and receive alerts, you must first link your account to your senior citizen's email.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href='/family/settings'}
            className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            Go to Linking Page
            <Shield size={20} />
          </button>
          <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">Note: Senior must register first</p>
        </div>
      </div>
    </div>
  );

  const chartData = {
    labels: data.moodHistory?.map(m => m.date) || [],
    datasets: [
      {
        label: 'Mood Score (1-5)',
        data: data.moodHistory?.map(m => m.score) || [],
        borderColor: '#2D6A4F',
        backgroundColor: 'rgba(45, 106, 79, 0.5)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 1, max: 5, ticks: { stepSize: 1 } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{t('care_status') || 'Care Status'}: {t(data.seniorName) || data.seniorName}</h1>
          <p className="text-stone-500 font-medium">{t('care_status_desc') || 'Real-time health monitoring and activity logs'}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold animate-pulse">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          {t('live') || 'LIVE'}
        </div>
      </div>


      {/* Stat Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 rounded-xl text-red-600"><Heart size={24} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{t('heart_rate')}</p>
            <p className="text-2xl font-black text-stone-900">{data.latestVitals?.heartRate || '--'} <span className="text-sm font-medium text-stone-400">{t('bpm') || 'bpm'}</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Moon size={24} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{t('sleep_hours')}</p>
            <p className="text-2xl font-black text-stone-900">{data.averageSleepHours || '--'} <span className="text-sm font-medium text-stone-400">{t('hrs') || 'hrs'}</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><Pill size={24} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{t('medicines')}</p>
            <p className="text-2xl font-black text-stone-900">
              {data.medicationStats ? `${data.medicationStats.taken}/${data.medicationStats.total}` : '0/0'}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Activity size={24} /></div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{t('mood')}</p>
            <p className="text-xl font-black text-stone-900 uppercase">{t(data.todayMood) || data.todayMood?.replace('_', ' ') || t('no_data')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-stone-900">{t('mood_trends') || 'Mood Trends'}</h2>
            <div className="text-sm text-stone-400 font-bold uppercase tracking-tighter">{t('last_7_days') || 'Last 7 Days'}</div>
          </div>
          <div className="h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-stone-900">{t('sleep_consistency') || 'Sleep Consistency'}</h2>
            <div className="text-sm text-stone-400 font-bold uppercase tracking-tighter">{t('last_7_days') || 'Last 7 Days'}</div>
          </div>
          <div className="h-72 w-full">
            <Line 
              data={{
                labels: data.sleepHistory?.map(s => s.date) || [],
                datasets: [
                  {
                    label: t('sleep_hours') || 'Sleep (hrs)',
                    data: data.sleepHistory?.map(s => s.hours) || [],
                    borderColor: '#1E3A8A',
                    backgroundColor: 'rgba(30, 58, 138, 0.5)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }} 
              options={{
                ...chartOptions,
                scales: {
                  y: { min: 0, max: 12, ticks: { stepSize: 2 } }
                }
              }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-900">{t('alerts') || 'Alerts'}</h2>
            <span className={`py-1 px-3 rounded-full text-xs font-black uppercase tracking-widest ${data.recentAlerts?.length > 0 ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'}`}>
              {data.recentAlerts?.length || 0} {t('new') || 'New'}
            </span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {data.recentAlerts?.length > 0 ? data.recentAlerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm animate-[slideRight_0.3s_ease-out] ${alert.severity === 'high' || alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className={alert.severity === 'high' || alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'} />
                  <div>
                    <p className="font-bold text-stone-900 text-sm leading-tight">{alert.message}</p>
                    <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase">
                      {(() => {
                        if (!alert.date) return 'N/A';
                        const d = new Date(alert.date);
                        if (isNaN(d.getTime())) return 'N/A';
                        return `${d.toLocaleTimeString()} • ${d.toLocaleDateString()}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-300 py-12">
                <CheckCircle size={48} className="mb-2 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">{t('system_stable') || 'System Stable'}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => window.location.href='/family/alerts'}
            className="mt-6 w-full py-3 bg-stone-50 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-100 transition-colors border border-stone-100"
          >
            {t('view_all_history') || 'View All History'}
          </button>
        </div>

        {/* Quick Links / Location Summary Placeholder */}
        <div className="bg-stone-900 p-8 rounded-2xl shadow-xl text-white flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-4">{t('quick_health_audit') || 'Quick Health Audit'}</h3>
            <p className="text-stone-400 mb-6 font-medium">{t('health_recorded_for') || 'All health parameters for'} {t(data.seniorName) || data.seniorName} {t('are_recorded') || 'are being recorded. Check reports for historical data.'}</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => window.location.href='/family/health'} className="p-4 bg-stone-800 rounded-xl hover:bg-stone-700 transition-all font-bold text-sm">{t('vital_history') || 'Vital History'}</button>
              <button onClick={() => window.location.href='/family/medicines'} className="p-4 bg-stone-800 rounded-xl hover:bg-stone-700 transition-all font-bold text-sm">{t('medication_log') || 'Medication Log'}</button>
            </div>
        </div>
      </div>

      {/* Location Block */}
      {data.location && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">location_on</span> 
              Current Location
            </h2>
            <div className="text-sm text-stone-400 font-bold uppercase tracking-tighter">
              Updated: {data.location.updatedAt ? new Date(data.location.updatedAt).toLocaleTimeString() : 'Recently'}
            </div>
          </div>
          <div className="w-full h-72 bg-stone-200 rounded-xl overflow-hidden relative border-2 border-stone-100 shadow-inner">
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight="0" 
              marginWidth="0" 
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(data.location.lng || 0) - 0.005},${(data.location.lat || 0) - 0.005},${(data.location.lng || 0) + 0.005},${(data.location.lat || 0) + 0.005}&layer=mapnik&marker=${data.location.lat || 0},${data.location.lng || 0}`}
              style={{ border: 0 }}
              title="Map View"
            ></iframe>
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-max max-w-[90%]">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border border-stone-200 text-stone-800 text-sm">
                <span className="material-symbols-outlined text-green-600 animate-bounce">pin_drop</span>
                {data.location.address || `${data.location.lat?.toFixed(4) || '0.0000'}, ${data.location.lng?.toFixed(4) || '0.0000'}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
