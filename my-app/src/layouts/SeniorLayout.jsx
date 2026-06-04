import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import LanguageSelector from '../components/common/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';
import api from '../api';

export default function SeniorLayout() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const reportLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            api.patch('/auth/location', {
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Live GPS)`
            })
            .then(() => {
              console.log("Background location synced successfully.");
            })
            .catch((err) => {
              console.error("Failed to sync background location:", err);
            });
          },
          (error) => {
            console.warn("Background geolocation watch failed:", error);
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }
    };

    reportLocation();
    const interval = setInterval(reportLocation, 60000); // sync every 60 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/senior/home', icon: 'home', label: t('home') || 'Home' },
    { to: '/senior/medicines', icon: 'medication', label: t('medicines') || 'Meds' },
    { to: '/senior/tasks', icon: 'assignment', label: t('tasks') || 'Tasks' },
    { to: '/senior/history', icon: 'history', label: t('history') || 'History' },
    { to: '/senior/health-log', icon: 'monitor_heart', label: t('health_log') || 'Health Log' },
    { to: '/senior/community', icon: 'forum', label: t('community') || 'Community' },
    { to: '/senior/assistant', icon: 'smart_toy', label: t('ai_assistant') || 'AI Assistant' },
    { to: '/senior/medical-history', icon: 'clinical_notes', label: t('medical_history') || 'Medical History' },
    { to: '/senior/help', icon: 'help_outline', label: t('emergency') || 'Help' },
  ];

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-on-surface)] overflow-x-hidden min-h-screen">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#f7f3ee] flex flex-col py-8 z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-8 mb-12">
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] tracking-tighter">CareCircle</h1>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">{t('senior_sanctuary') || 'Senior Sanctuary'}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center px-8 py-4 transition-colors active:scale-95 duration-150 ${
                  isActive 
                    ? 'text-[var(--color-primary)] font-bold border-r-4 border-[var(--color-primary)] bg-[#ebe8e3]/50' 
                    : 'text-stone-500 font-medium hover:bg-[#ebe8e3]'
                }`
              }
            >
              <span className="material-symbols-outlined mr-4">{item.icon}</span>
              <span className="font-bold tracking-tight text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Sidebar Logout Button */}
        <div className="px-6 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-4 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all gap-4"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>{t('logout') || 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen relative">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-20 z-20 bg-[#fdf9f4]/90 backdrop-blur-xl flex justify-between items-center px-6 md:px-12 shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              className="md:hidden text-[var(--color-primary)] bg-[#ebe8e3] p-2 rounded-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
             <LanguageSelector />
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsNotifOpen(true)}
              className="relative text-stone-600 hover:text-[var(--color-primary)] transition-all active:opacity-80 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-error)] rounded-full animate-ping"></span>
            </button>
            <div className="flex items-center gap-4 pl-4 border-l border-stone-200">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-black text-stone-800">{t(user?.name) || t(user?.name?.charAt(0).toUpperCase() + user?.name?.slice(1)) || user?.name}</p>
                <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">{t('logout') || 'Logout'}</button>
              </div>
              <img alt="User Profile" className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white" src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=b1f0ce&color=002114`} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-32 pb-20 px-8 md:px-16 max-w-[1400px] mx-auto">
          <Outlet />
        </div>

        <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </main>
    </div>
  );
}
