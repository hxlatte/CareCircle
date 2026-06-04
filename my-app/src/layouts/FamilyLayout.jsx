import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Pill, 
  CheckSquare, 
  Bell, 
  Settings, 
  LogOut,
  User as UserIcon,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';

export default function FamilyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/family/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/family/health', icon: Activity, label: 'Health' },
    { to: '/family/medicines', icon: Pill, label: 'Medicines' },
    { to: '/family/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/family/alerts', icon: Bell, label: 'Alerts' },
    { to: '/family/medical-history', icon: FileText, label: 'Medical History' },
    { to: '/family/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col md:flex-row font-sans relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-stone-200 flex flex-col shrink-0 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:h-screen sticky top-0`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Activity size={24} />
            </div>
            <h1 className="text-2xl font-black text-stone-800 tracking-tighter">CareCircle</h1>
          </div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Family Coordinator</p>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto pb-10">
          {navItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--color-primary)] text-white shadow-md' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`
              }
            >
              <item.icon size={22} strokeWidth={2.5} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-4 mb-6 p-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 shadow-sm text-stone-400 uppercase font-bold text-xs">
              {user?.name?.substring(0, 2) || 'FA'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-stone-800 truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Admin</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full rounded-2xl font-bold text-red-600 bg-red-50/50 hover:bg-red-50 hover:shadow-sm transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative w-full pt-24 md:pt-12">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-stone-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <h1 className="text-lg font-black text-stone-800">CareCircle</h1>
          </div>
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 relative cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>

        {/* Desktop Notification Bell */}
        <div className="hidden md:block absolute top-8 right-12 z-30">
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm relative group cursor-pointer"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto pb-20">
          <Outlet />
        </div>

        <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </main>
    </div>
  );
}
