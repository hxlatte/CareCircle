import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';
import { useLanguage } from '../../context/LanguageContext';

export default function FamilyMedicines() {
  const { startVoiceInput } = useVoice();
  const { language } = useLanguage();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [seniorId, setSeniorId] = useState('');
  
  const [newMed, setNewMed] = useState({
    medicineName: '',
    dosage: '',
    time: ''
  });

  const fetchMedicines = async () => {
    try {
      const userRes = await api.get('/auth/me');
      const targetId = userRes.data.role === 'family' ? userRes.data.linkedSeniorId : userRes.data._id;
      
      if (!targetId) return;
      setSeniorId(targetId);

      const res = await api.get(`/medications/${targetId}`);
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAddMed = async (e) => {
    e.preventDefault();
    try {
      if (!seniorId) return alert('No linked senior found');
      await api.post('/medications', { 
        ...newMed, 
        userId: seniorId,
        languageCode: language 
      });
      setShowModal(false);
      setNewMed({ medicineName: '', dosage: '', time: '' });
      fetchMedicines();
    } catch (err) {
      console.error('Error adding medicine:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading medicines...</div>;

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const adherence = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medicines Management</h1>
        <button 
          onClick={() => seniorId ? setShowModal(true) : alert('Please link a senior account in Settings first')}
          disabled={!seniorId}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all ${seniorId ? 'bg-[var(--color-primary)] text-white hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          <Plus size={20} /> Add Medication
        </button>
      </div>

      {!seniorId && (
        <div className="bg-orange-50 border-2 border-dashed border-orange-200 p-8 rounded-2xl text-center">
          <p className="text-orange-800 font-bold text-lg mb-4">No senior linked to this account.</p>
          <button 
            onClick={() => window.location.href='/family/settings'}
            className="text-orange-600 font-black hover:underline"
          >
            Go to Settings to link a Senior →
          </button>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 p-8 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-green-800 mb-4">Adherence Today</h2>
        <div className="flex items-center gap-6">
          <div className="text-5xl font-black text-green-700">{adherence}%</div>
          <div className="w-full bg-green-200 rounded-full h-5 overflow-hidden shadow-inner">
            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${adherence}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
        <h2 className="text-xl font-bold mb-6 text-stone-800">Current Medications</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-stone-100">
                <th className="py-4 px-4 font-bold text-stone-500 uppercase text-xs tracking-widest">Medicine Name</th>
                <th className="py-4 px-4 font-bold text-stone-500 uppercase text-xs tracking-widest">Dosage</th>
                <th className="py-4 px-4 font-bold text-stone-500 uppercase text-xs tracking-widest">Schedule</th>
                <th className="py-4 px-4 font-bold text-stone-500 uppercase text-xs tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {medicines.map(med => (
                <tr key={med._id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-5 px-4 font-bold text-stone-800">{med.medicineName}</td>
                  <td className="py-5 px-4 text-stone-600 font-medium">{med.dosage}</td>
                  <td className="py-5 px-4 text-stone-600 font-medium">{med.time}</td>
                  <td className="py-5 px-4">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                      med.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {med.status}
                    </span>
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-stone-400 italic">No medications scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-stone-800">Add Medication</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddMed} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 uppercase">Medicine Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required
                    value={newMed.medicineName}
                    onChange={e => setNewMed({...newMed, medicineName: e.target.value})}
                    className="flex-1 p-4 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold"
                    placeholder="e.g. Lisinopril"
                  />
                  <button 
                    type="button"
                    onClick={() => startVoiceInput((val) => setNewMed(prev => ({...prev, medicineName: val})))}
                    className="p-4 bg-stone-50 text-[var(--color-primary)] rounded-xl hover:bg-stone-100 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 uppercase">Dosage</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required
                    value={newMed.dosage}
                    onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    className="flex-1 p-4 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold"
                    placeholder="e.g. 10mg"
                  />
                  <button 
                    type="button"
                    onClick={() => startVoiceInput((val) => setNewMed(prev => ({...prev, dosage: val})))}
                    className="p-4 bg-stone-50 text-[var(--color-primary)] rounded-xl hover:bg-stone-100 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 uppercase">Time</label>
                <input 
                  type="text" required
                  value={newMed.time}
                  onChange={e => setNewMed({...newMed, time: e.target.value})}
                  className="w-full p-4 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold"
                  placeholder="e.g. 08:00 AM"
                />
              </div>
              <button type="submit" className="w-full bg-[var(--color-primary)] text-white py-5 rounded-2xl text-xl font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                Add to Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
