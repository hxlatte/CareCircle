import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// --- Subcomponents ---

const OverviewCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-5 hover:-translate-y-1 transition-transform">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-opacity-10 ${colorClass}`}>
      <span className="material-symbols-outlined text-4xl">{icon}</span>
    </div>
    <div>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-stone-800">{value}</p>
        {subtitle && <span className="text-sm font-bold text-stone-500">{subtitle}</span>}
      </div>
    </div>
  </div>
);

const VitalCard = ({ label, value, unit, icon, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm font-bold text-stone-600 uppercase tracking-widest">{label}</span>
      <span className={`material-symbols-outlined ${colorClass} bg-stone-50 p-2 rounded-full`}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black text-stone-800">{value}</span>
      <span className="text-base font-bold text-stone-500">{unit}</span>
    </div>
  </div>
);

const InsightCard = ({ text, icon, colorClass, bgClass }) => (
  <div className={`${bgClass} border p-5 rounded-2xl shadow-sm flex gap-4 items-start`}>
    <span className={`material-symbols-outlined text-3xl ${colorClass}`}>{icon}</span>
    <p className="text-stone-800 text-lg font-medium leading-tight">{text}</p>
  </div>
);

const ProgressBar = ({ label, percentage, colorClass }) => (
  <div className="mb-5 last:mb-0">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-bold text-stone-600 uppercase">{label}</span>
      <span className="text-sm font-black text-stone-800">{percentage}%</span>
    </div>
    <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

// --- Main Page ---

export default function FamilyHealth() {
  const [insights, setInsights] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  // In a real app we'd pass the actual senior ID, but for demo we can fetch for a specific user or assume the family member has access to their linked senior
  // We'll simulate fetching for a linked senior by getting all logs and filtering on the backend, or just fetching the logged in user's insights if it's test data
  
  useEffect(() => {
    // We need the senior ID. Assuming there's a way to get it, or we just fetch for test purposes.
    // Let's assume the API returns data for the whole family circle for now.
    // For this full-stack conversion, let's fetch from our new endpoints.
    const fetchData = async () => {
      try {
        const userRes = await api.get('/auth/me');
        const targetId = userRes.data.role === 'family' ? userRes.data.linkedSeniorId : userRes.data._id;

        if (!targetId) {
            console.warn('No linked senior found');
            return;
        }

        const [insightsRes, healthRes] = await Promise.all([
          api.get(`/insights/${targetId}`),
          api.get(`/health/${targetId}`)
        ]);
        
        setInsights(insightsRes.data);
        if (healthRes.data.length > 0) {
          setHealthLogs(healthRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const latestVitals = healthLogs[0] || { heartRate: '--', bloodPressure: '--', weight: '--', sleepHours: '--' };

  const moodChartData = {
    labels: insights?.moodHistory?.length > 0 ? insights.moodHistory.map(m => m.date) : ['No Data'],
    datasets: [
      {
        label: 'Mood Score',
        data: insights?.moodHistory?.length > 0 ? insights.moodHistory.map(m => m.score) : [0],
        borderColor: '#0f5238',
        backgroundColor: 'rgba(15, 82, 56, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#0f5238',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const sleepChartData = {
    labels: insights?.sleepHistory?.length > 0 ? insights.sleepHistory.map(s => s.date) : ['No Data'],
    datasets: [
      {
        label: 'Sleep Hours',
        data: insights?.sleepHistory?.length > 0 ? insights.sleepHistory.map(s => s.hours) : [0],
        backgroundColor: '#713638',
        borderRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { 
        beginAtZero: true, 
        grid: { borderDash: [4, 4], color: '#f5f5f4' } 
      }
    }
  };

  return (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto space-y-10">
      <div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-2 tracking-tight">
          Health Insights
        </h2>
        <p className="text-xl text-[var(--color-on-surface-variant)]">Overview of wellbeing and daily routines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <OverviewCard title="Mood Score" value={insights?.averageMoodScore || '0'} subtitle="/ 5" icon="sentiment_satisfied" colorClass="bg-teal-100 text-teal-700" />
        <OverviewCard title="Med Adherence" value={insights?.medicineAdherence || '0'} subtitle="%" icon="medication" colorClass="bg-green-100 text-green-700" />
        <OverviewCard title="Sleep Avg" value={insights?.averageSleepHours || '0'} subtitle="hrs" icon="bedtime" colorClass="bg-indigo-100 text-indigo-700" />
        <OverviewCard title="Tasks Done" value={insights?.taskCompletion || '0'} subtitle="%" icon="task_alt" colorClass="bg-purple-100 text-purple-700" />
        <OverviewCard title="Active Alerts" value={insights?.alertCount || '0'} icon="notifications_active" colorClass="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard 
          text={`Medicine adherence is at ${insights?.medicineAdherence || '0'}%.`} 
          icon="trending_up" 
          colorClass="text-green-700" 
          bgClass="bg-green-50 border-green-200" 
        />
        <InsightCard 
          text="Sleep duration is recorded accurately." 
          icon="info" 
          colorClass="text-amber-700" 
          bgClass="bg-amber-50 border-amber-200" 
        />
        <InsightCard 
          text={`Mood is averaging a score of ${insights?.averageMoodScore || '0'}.`} 
          icon="sentiment_very_satisfied" 
          colorClass="text-teal-700" 
          bgClass="bg-teal-50 border-teal-200" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 bg-stone-50 p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <h3 className="text-xl font-bold text-stone-800 flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-[var(--color-primary)]">vital_signs</span>
            Recent Vitals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <VitalCard label="Heart Rate" value={latestVitals.heartRate} unit="bpm" icon="favorite" colorClass="text-rose-500" />
            <VitalCard label="Blood Pressure" value={latestVitals.bloodPressure} unit="" icon="blood_pressure" colorClass="text-blue-500" />
            <VitalCard label="Weight" value={latestVitals.weight} unit="lbs" icon="scale" colorClass="text-emerald-500" />
            <VitalCard label="Sleep Avg" value={latestVitals.sleepHours} unit="hrs" icon="bedtime" colorClass="text-indigo-500" />
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <h3 className="text-xl font-bold text-stone-800 flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-[var(--color-primary)]">monitoring</span>
            Behaviour Trends (7 Days)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Mood Trend</h4>
              <div className="h-48 w-full">
                <Line data={moodChartData} options={chartOptions} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Sleep Consistency</h4>
              <div className="h-48 w-full">
                <Bar data={sleepChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <ProgressBar label="Medicine Adherence Trend" percentage={insights?.medicineAdherence || 0} colorClass="bg-green-500" />
            </div>
            <div>
              <ProgressBar label="Task Completion Trend" percentage={insights?.taskCompletion || 0} colorClass="bg-[var(--color-primary)]" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
