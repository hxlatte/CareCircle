import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/common/LanguageSelector';
import api from '../api';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('senior'); // Default role
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      setIsRegister(true);
      setRole('family');
      
      api.get(`/family/invite/${inviteCode}`)
        .then(res => {
          alert(`You have been invited by ${res.data.inviterName} to help care for ${res.data.seniorName}. Let's create your account!`);
          setEmail(res.data.email || '');
        })
        .catch(err => {
          console.error("Invalid or expired invite link", err);
          alert("The invitation link is invalid or has expired.");
        });
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    try {
      if (!email || !password) {
        alert('Please enter email and password.');
        return;
      }

      if (isRegister) {
        if (!name) return alert('Name is required for registration');
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('invite') || undefined;
        await register(name, email, password, role, inviteCode);
      } else {
        await login(email, password);
      }

      // Sync role after successful login/registration
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      const targetRole = inviteCode ? 'family' : role;

      if (targetRole === 'senior') {
        navigate('/senior/home');
      } else {
        navigate('/family/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Authentication failed. Make sure you are using the correct credentials or register first.');
    }
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    // In a real app, this would trigger Firebase or OAuth.
    // For this prototype, we'll mock a successful login as the selected role.
    alert('Google Login successful! Logging you in...');
    if (role === 'senior') {
      navigate('/senior/home');
    } else {
      navigate('/family/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans selection:bg-emerald-500/20 selection:text-emerald-900 bg-emerald-50/30">
      
      {/* Left Side: Image & Minimal Copy */}
      <div className="hidden lg:flex w-[45%] relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=2000&auto=format&fit=crop)' }}
        ></div>
        {/* Soft green to transparent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>
        
        {/* Minimal Text Content */}
        <div className="relative z-10 flex flex-col justify-end p-16 pb-24 h-full w-full">
          <div className="max-w-md">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-8 border border-white/30">
              <span className="material-symbols-outlined text-2xl">spa</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              {t('welcome_to')} CareCircle.
            </h1>
            <p className="text-emerald-50/80 text-lg font-medium leading-relaxed">
              {t('login_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Glassmorphism Login Card */}
      <div className="w-full lg:w-[55%] relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-stone-50">
        
        {/* Abstract shapes for glassmorphism effect */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute top-8 right-8 z-30">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-[420px] relative z-20">
          {/* Glass Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-10 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-stone-800 mb-2 tracking-tight">
                {isRegister ? t('create_account') : t('welcome_back')}
              </h2>
              <p className="text-stone-500 font-medium text-sm">
                {isRegister ? t('signup_desc') : t('login_desc_short')}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              
              {/* Role Toggle Pill */}
              <div className="bg-stone-200/50 p-1.5 rounded-2xl flex gap-1 mb-6">
                <button 
                  type="button" 
                  onClick={() => setRole('senior')} 
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${role === 'senior' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {t('senior')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('family')} 
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${role === 'family' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {t('family')}
                </button>
              </div>

              {isRegister && (
                <div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-stone-400 text-xl">person</span>
                    <input type="text" placeholder={t('name') || "Name"} value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-stone-200/60 rounded-2xl outline-none focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-stone-800 placeholder-stone-400" />
                  </div>
                </div>
              )}

              <div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-stone-400 text-xl">mail</span>
                  <input type="email" placeholder={t('email') || "Email address"} value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-stone-200/60 rounded-2xl outline-none focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-stone-800 placeholder-stone-400" />
                </div>
              </div>

              <div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-stone-400 text-xl">lock</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={t('password') || "Password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-stone-200/60 rounded-2xl outline-none focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-stone-800 placeholder-stone-400" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-stone-400 hover:text-stone-600 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {!isRegister && (
                  <div className="text-right mt-2">
                    <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">{t('forgot_password')}</a>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-3.5 mt-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold transition-all shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                {isRegister ? t('create_account') : t('log_in')}
              </button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200/80"></div>
                </div>
                <span className="relative bg-transparent px-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest backdrop-blur-md rounded-full">
                  {t('or_continue_with')}
                </span>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin} 
                className="w-full py-3.5 bg-white border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>

            </form>
          </div>

          <p className="text-center text-stone-500 font-medium mt-8">
            {isRegister ? t('already_have_account') : t('dont_have_account')} {' '}
            <button 
              type="button" 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-emerald-600 font-bold hover:text-emerald-800 hover:underline transition-all"
            >
              {isRegister ? t('login_instead') : t('sign_up')}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
