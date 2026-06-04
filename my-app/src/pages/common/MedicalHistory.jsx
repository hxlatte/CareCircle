import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';

export default function MedicalHistory() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { handleSpeak, handleSpell, startVoiceInput } = useVoice();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const targetId = user.role === 'family' ? user.linkedSeniorId : (user.id || user._id);
      
      if (!targetId) {
        setLoading(false);
        return;
      }
      const res = await api.get(`/medical-records/${targetId}`);
      
      if (Array.isArray(res.data)) {
        setRecords(res.data);
      } else {
        console.error('Expected array of records, got:', res.data);
        setRecords([]);
      }
    } catch (err) {
      console.error('Fetch records error:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    } else {
      setLoading(false);
    }
  }, [user, language]);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    setUploading(true);
    const formData = new FormData();
    formData.append('doctorName', doctorName);
    formData.append('date', date);
    formData.append('condition', condition);
    formData.append('notes', notes);
    if (file) {
      formData.append('file', file);
    }
    
    const targetId = user.role === 'family' ? user.linkedSeniorId : (user.id || user._id);
    formData.append('userId', targetId);

    try {
      await api.post('/medical-records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(t('record_saved_success') || 'Record saved successfully!');
      setDoctorName('');
      setDate('');
      setCondition('');
      setNotes('');
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchRecords();
    } catch (err) {
      console.error('Upload error:', err);
      alert(t('record_save_failed') || 'Failed to save record.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete_record') || 'Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/medical-records/${id}`);
      fetchRecords();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <span className="material-symbols-outlined text-stone-300 text-6xl animate-spin mb-4">progress_activity</span>
      <div className="text-center font-bold text-stone-400">{t('loading_medical_history') || 'Loading medical history...'}</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-stone-900 tracking-tight flex items-center gap-4">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-5xl">clinical_notes</span>
            {t('medical_history')}
          </h1>
          <p className="text-xl text-stone-500 font-medium mt-2">{t('medical_history_desc') || 'Your securely stored medical records and documents.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Upload Form */}
        <div className="xl:col-span-1">
          <div className="bg-[var(--color-surface-container-lowest)] p-10 rounded-[2.5rem] shadow-xl border border-stone-100 sticky top-8">
            <h2 className="text-2xl font-black text-stone-800 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-primary)]">add_circle</span>
                {t('upload_new_record')}
            </h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="relative">
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t('doctor_name')}</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={doctorName} 
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all font-bold text-stone-800"
                        placeholder={t('enter_doctor_name') || 'Dr. Smith'}
                        required
                    />
                    <button type="button" onClick={() => startVoiceInput(setDoctorName)} className="p-4 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-500 transition-colors"><span className="material-symbols-outlined">mic</span></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t('date_of_visit')}</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all font-bold text-stone-800"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t('condition')}</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={condition} 
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all font-bold text-stone-800"
                        placeholder={t('condition_placeholder') || 'e.g., Annual Checkup'}
                        required
                    />
                    <button type="button" onClick={() => startVoiceInput(setCondition)} className="p-4 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-500 transition-colors"><span className="material-symbols-outlined">mic</span></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t('notes')}</label>
                <div className="flex gap-2">
                    <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all font-bold text-stone-800 min-h-[100px]"
                    placeholder={t('notes_placeholder') || 'Any specific instructions or follow-ups?'}
                    />
                    <button type="button" onClick={() => startVoiceInput(setNotes)} className="p-4 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-500 transition-colors self-start"><span className="material-symbols-outlined">mic</span></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t('upload_file')}</label>
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-2 text-stone-500 font-bold"
                  accept=".pdf,image/*"
                />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-[var(--color-primary)] text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {uploading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">cloud_upload</span>}
                {t('save_record')}
              </button>
            </form>
          </div>
        </div>

        {/* Records List */}
        <div className="xl:col-span-2 space-y-6">
          {Array.isArray(records) && records.length > 0 ? (
            records.map((record) => (
              <div key={record._id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 hover:shadow-md transition-all group animate-[slideInRight_0.3s_ease-out]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-[var(--color-primary-container)] group-hover:text-[var(--color-on-primary-container)] transition-colors">
                      <span className="material-symbols-outlined text-4xl">description</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-black text-stone-900">{record.condition}</h3>
                        <button onClick={() => handleSpeak(`${t('condition')}: ${record.condition}`)} className="p-1 text-stone-400 hover:text-stone-900 transition-colors"><span className="material-symbols-outlined text-xl">volume_up</span></button>
                        <button onClick={() => handleSpell(record.condition)} className="text-[10px] font-black text-stone-400 hover:text-stone-900 uppercase tracking-tighter transition-colors">{t('voice_spell')}</button>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-stone-500 font-bold text-sm">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[var(--color-primary)] text-sm">person</span> {t('doctor_name')}: {record.doctorName}</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">calendar_month</span> 
                          {(() => {
                            if (!record.date) return 'N/A';
                            const d = new Date(record.date);
                            if (isNaN(d.getTime())) return 'N/A';
                            return d.toLocaleDateString(
                              language === 'hi' ? 'hi-IN' : 
                              language === 'te' ? 'te-IN' : 
                              language === 'mr' ? 'mr-IN' : 
                              'en-US', 
                              { year: 'numeric', month: 'long', day: 'numeric' }
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {record.fileUrl && (
                      <a 
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${record.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                        {t('view')}
                      </a>
                    )}
                    {record.fileUrl && (
                      <a 
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${record.fileUrl}`} 
                        download 
                        className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-xl">download</span>
                        {t('download')}
                      </a>
                    )}
                    <button 
                      onClick={() => handleDelete(record._id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
                {record.notes && (
                  <div className="mt-6 pt-6 border-t border-stone-50">
                    <p className="text-stone-500 font-medium italic">"{record.notes}"</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-stone-300 border-4 border-dashed border-stone-100 rounded-[3rem]">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-10">history</span>
              <p className="text-xl font-bold uppercase tracking-widest">{t('no_records_found')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

