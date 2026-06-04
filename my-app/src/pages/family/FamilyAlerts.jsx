import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Pill, CheckSquare } from 'lucide-react';
import api from '../../api';

export default function FamilyAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const userRes = await api.get('/auth/me');
      const targetId = userRes.data.role === 'family' ? userRes.data.linkedSeniorId : userRes.data._id;
      
      if (!targetId) return;

      const res = await api.get(`/alerts/${targetId}`);
      setAlerts(res.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={24} className="text-red-600" />;
      case 'high': return <AlertTriangle size={24} className="text-orange-500" />;
      case 'medium': return <Activity size={24} className="text-blue-500" />;
      default: return <CheckSquare size={24} className="text-gray-400" />;
    }
  };

  const deleteAlert = async (id) => {
    try {
      // In a real app, we'd have a resolve/delete endpoint.
      // For now we'll just refetch or locally filter if we had an API.
      // Assuming a delete endpoint exists or just refresh.
      await api.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading alerts...</div>;

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <h1 className="text-3xl font-bold">Alerts & Notifications</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 space-y-4">
        {alerts.map(alert => (
          <div key={alert._id} className={`p-6 rounded-xl border-l-[6px] flex justify-between items-center ${
            alert.severity === 'critical' ? 'border-red-600 bg-red-50' : 
            alert.severity === 'high' ? 'border-orange-500 bg-orange-50' : 'border-blue-300 bg-blue-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className="mt-1">{getIcon(alert.severity)}</div>
              <div>
                <h3 className="font-bold text-lg text-stone-900">{alert.message}</h3>
                <p className="text-sm text-stone-500 font-medium uppercase tracking-tight">
                  {alert.severity} • {new Date(alert.date).toLocaleString()}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => deleteAlert(alert._id)}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-bold text-sm hover:bg-stone-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-stone-200 text-6xl block mb-4">notifications_off</span>
            <p className="text-stone-400 font-medium italic">No active alerts for the senior.</p>
          </div>
        )}
      </div>
    </div>
  );
}
