import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function FamilySettings() {
  const { user, updateUser } = useAuth();
  const [senior, setSenior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [medicalInfo, setMedicalInfo] = useState({
    bloodGroup: '',
    allergies: '',
    conditions: ''
  });

  const [seniorEmailInput, setSeniorEmailInput] = useState('');

  // Invitation modal state variables
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchInfo = async () => {
    try {
      const userRes = await api.get('/auth/me');
      setNameInput(userRes.data.name || '');

      
      if (userRes.data.linkedSeniorId) {
        try {
          const res = await api.get(`/auth/profile/${userRes.data.linkedSeniorId}`);
          setSenior({
            name: res.data.name,
            id: userRes.data.linkedSeniorId,
            medicalInfo: res.data.medicalInfo || { bloodGroup: '', allergies: '', conditions: '' }
          });
          setMedicalInfo(res.data.medicalInfo || { bloodGroup: '', allergies: '', conditions: '' });
        } catch (profileErr) {
          // If profile is not found, it likely means the account was lost in an in-memory DB restart
          setSenior({ 
            name: 'Account Missing from Database', 
            id: userRes.data.linkedSeniorId,
            profileError: true 
          });
        }
      } else {
        setSenior(null);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || err.message || 'Failed to fetch profile information';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/link-senior', { 
        familyUserId: user.id || user._id,
        seniorEmail: seniorEmailInput 
      });
      setSuccess(res.data.msg);
      setTimeout(() => setSuccess(''), 3000);
      fetchInfo();
      setSeniorEmailInput('');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || 'Linking failed';
      setError(`Error: ${errorMsg}`);
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setError('');
    try {
      const res = await api.post('/family/invite', { email: inviteEmail });
      setGeneratedInviteLink(res.data.inviteLink);
      setSuccess('Invitation link generated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Failed to create invitation';
      setError(`Error: ${msg}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!nameInput.trim()) {
      setError('Please enter your name');
      setSaving(false);
      return;
    }

    try {
      const res = await api.patch('/auth/profile', { 
        name: nameInput
      });
      if (updateUser) updateUser(res.data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchInfo(); 
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Failed to update profile';
      setError(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const [savingMedical, setSavingMedical] = useState(false);

  const handleUpdateMedical = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingMedical(true);
    try {
      const res = await api.patch(`/auth/profile/${senior.id}`, { medicalInfo });
      setSuccess('Medical information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchInfo();
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Failed to update medical information';
      setError(`Error: ${msg}`);
    } finally {
      setSavingMedical(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-3xl animate-[fadeIn_0.5s_ease-out] pb-20">
      <h1 className="text-4xl font-black text-stone-900 tracking-tight">Settings & Profile</h1>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 animate-[shake_0.5s_ease-in-out]">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-600 rounded-xl font-bold text-sm border border-green-100">{success}</div>}

      {senior ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className={`w-24 h-24 ${senior.profileError ? 'bg-red-50 text-red-500' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'} rounded-full flex items-center justify-center`}>
                <User size={48} />
              </div>
              <div>
                <h2 className={`text-3xl font-black ${senior.profileError ? 'text-red-600' : 'text-stone-800'}`}>{senior.name}</h2>
                <p className="text-stone-500 text-lg font-medium flex items-center gap-2">
                  <Shield size={18} /> {senior.profileError ? 'ID mismatch or account lost. Please re-link below.' : 'Linked Senior Account'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                if(window.confirm('Disconnect this account?')) {
                  api.patch('/auth/profile', { linkedSeniorId: null }).then(() => fetchInfo());
                }
              }} 
              className="text-stone-400 hover:text-red-500 text-sm font-bold"
            >
              Disconnect
            </button>
          </div>

          {!senior.profileError && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
              <h2 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-3">
                Senior's Medical Card
              </h2>
              <form onSubmit={handleUpdateMedical} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Blood Group</label>
                    <input 
                      type="text" 
                      value={medicalInfo.bloodGroup}
                      onChange={(e) => setMedicalInfo({...medicalInfo, bloodGroup: e.target.value})}
                      placeholder="e.g. O+"
                      className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50 font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Allergies</label>
                    <input 
                      type="text" 
                      value={medicalInfo.allergies}
                      onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                      placeholder="e.g. Penicillin"
                      className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50 font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Conditions</label>
                  <textarea 
                    value={medicalInfo.conditions}
                    onChange={(e) => setMedicalInfo({...medicalInfo, conditions: e.target.value})}
                    placeholder="e.g. Hypertension, Diabetes"
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50 font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none min-h-[100px]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={savingMedical}
                  className={`bg-stone-900 text-white px-8 py-4 rounded-xl font-black hover:bg-black transition-all shadow-lg ${savingMedical ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {savingMedical ? 'Updating...' : 'Update Medical Card'}
                </button>
              </form>
            </div>
          )}

          {senior.profileError && (
            <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-dashed border-orange-200">
              <h2 className="text-2xl font-black text-orange-800 mb-2">Reconnect Senior Account</h2>
              <p className="text-orange-700 mb-6 font-medium">The previous senior account ID is invalid or was lost in a server restart. Enter the email again to reconnect.</p>
              <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="email" 
                  placeholder="Enter Senior Email"
                  value={seniorEmailInput}
                  onChange={(e) => setSeniorEmailInput(e.target.value)}
                  className="flex-1 p-4 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  required
                />
                <button className="bg-orange-600 text-white px-8 py-4 rounded-xl font-black hover:bg-orange-700 transition-all shadow-lg">
                  Relink Account
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-dashed border-orange-200">
          <h2 className="text-2xl font-black text-orange-800 mb-2">Connect Senior Account</h2>
          <p className="text-orange-700 mb-6 font-medium">Link your account to a senior to start monitoring their health and tasks.</p>
          <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Enter Senior Email"
              value={seniorEmailInput}
              onChange={(e) => setSeniorEmailInput(e.target.value)}
              className="flex-1 p-4 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              required
            />
            <button className="bg-orange-600 text-white px-8 py-4 rounded-xl font-black hover:bg-orange-700 transition-all shadow-lg">
              Link Account
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 space-y-6">
        <h2 className="text-2xl font-black text-stone-800 border-b border-stone-100 pb-4">Your Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex items-center gap-6 p-6 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-stone-400 shadow-sm">
              <User size={32} />
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-4 rounded-xl border border-stone-100 bg-stone-100 font-black text-stone-800 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <p className="text-stone-500 font-medium flex items-center gap-1">
                <Mail size={14} /> {user?.email}
              </p>
            </div>
          </div>



          <button 
            type="submit"
            disabled={saving}
            className={`bg-stone-900 text-white px-8 py-4 rounded-xl font-black hover:bg-black transition-all shadow-lg active:scale-95 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <button type="button" onClick={() => { setIsInviteModalOpen(true); setInviteEmail(''); setGeneratedInviteLink(''); }} className="text-[var(--color-primary)] font-bold text-sm hover:underline transition-all">+ Invite Additional Family Member</button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 space-y-8">
        <h2 className="text-xl font-bold border-b border-stone-100 pb-4 text-stone-800 flex items-center gap-2">
          <Bell size={20} /> Notification Preferences
        </h2>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center group">
            <div>
              <p className="font-bold text-stone-800">Critical Alerts</p>
              <p className="text-sm text-stone-500">Instant notification for health emergencies</p>
            </div>
            <div className="w-12 h-6 bg-[var(--color-primary)] rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md"></div>
            </div>
          </div>

          <div className="flex justify-between items-center group">
            <div>
              <p className="font-bold text-stone-800">Medicine Adherence</p>
              <p className="text-sm text-stone-500">Notify when a scheduled dose is missed</p>
            </div>
            <div className="w-12 h-6 bg-[var(--color-primary)] rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md"></div>
            </div>
          </div>

          <div className="flex justify-between items-center group">
            <div>
              <p className="font-bold text-stone-800">Daily Digest</p>
              <p className="text-sm text-stone-500">Morning summary of the senior's routine</p>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-md"></div>
            </div>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-stone-800 border border-stone-100 animate-[slideUp_0.4s_ease-out]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-black text-stone-900 tracking-tight">Invite Family Member</h2>
              <button 
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <p className="text-stone-500 font-medium text-base mb-8 leading-relaxed">
              Invite another family member to help coordinate care and monitor health updates. They will automatically be linked to the same senior.
            </p>

            {!generatedInviteLink ? (
              <form onSubmit={handleCreateInvite} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Family Member's Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-stone-200/80 outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] bg-stone-50 font-bold transition-all"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isInviting}
                  className={`w-full py-4 bg-stone-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isInviting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isInviting ? 'Generating...' : 'Generate Invite Link'}
                  <span className="material-symbols-outlined">link</span>
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/60 flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-CheckCircle text-2xl">check_circle</span>
                  <p className="text-emerald-700 font-bold text-sm">Invite link created! Share it with your family member.</p>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 break-all font-mono text-sm select-all pr-16 relative flex items-center min-h-[64px]">
                  <span className="flex-1 pr-4">{generatedInviteLink}</span>
                  <button 
                    type="button"
                    onClick={handleCopyLink}
                    className="absolute right-4 p-2.5 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm flex items-center justify-center"
                    title="Copy Link"
                  >
                    <span className={`material-symbols-outlined text-lg ${copied ? 'text-emerald-600' : 'text-stone-500'}`}>
                      {copied ? 'done' : 'content_copy'}
                    </span>
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-4 bg-stone-100 text-stone-600 rounded-2xl font-black hover:bg-stone-200 transition-all text-center"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
