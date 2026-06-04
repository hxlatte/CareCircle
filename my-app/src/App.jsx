import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';

// Layouts
import SeniorLayout from './layouts/SeniorLayout';
import FamilyLayout from './layouts/FamilyLayout';

// Senior Pages
import SeniorHome from './pages/senior/SeniorHome';
import SeniorMedicines from './pages/senior/SeniorMedicines';
import SeniorTasks from './pages/senior/SeniorTasks';
import SeniorHistory from './pages/senior/SeniorHistory';
import SeniorHelp from './pages/senior/SeniorHelp';
import SeniorHealthLog from './pages/senior/SeniorHealthLog';
import SeniorAssistant from './pages/senior/SeniorAssistant';
import SeniorCommunity from './pages/senior/SeniorCommunity';

// Family Pages
import FamilyDashboard from './pages/family/FamilyDashboard';
import FamilyHealth from './pages/family/FamilyHealth';
import FamilyMedicines from './pages/family/FamilyMedicines';
import FamilyTasks from './pages/family/FamilyTasks';
import FamilyAlerts from './pages/family/FamilyAlerts';
import FamilySettings from './pages/family/FamilySettings';
import MedicalHistory from './pages/common/MedicalHistory';
import { useLanguage } from './context/LanguageContext';

function AuthLanguageSync() {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();

  React.useEffect(() => {
    if (user && user.languagePreference) {
      setLanguage(user.languagePreference);
    }
  }, [user, setLanguage]);

  return null;
}

function ProtectedRoute({ children, allowedRole }) {
  const { role } = useAuth();
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthLanguageSync />
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Senior Routes */}
            <Route path="/senior" element={
              <ProtectedRoute allowedRole="senior">
                <SeniorLayout />
              </ProtectedRoute>
            }>
              <Route path="home" element={<SeniorHome />} />
              <Route path="medicines" element={<SeniorMedicines />} />
              <Route path="tasks" element={<SeniorTasks />} />
              <Route path="history" element={<SeniorHistory />} />
              <Route path="health-log" element={<SeniorHealthLog />} />
              <Route path="assistant" element={<SeniorAssistant />} />
              <Route path="community" element={<SeniorCommunity />} />
              <Route path="help" element={<SeniorHelp />} />
              <Route path="medical-history" element={<MedicalHistory />} />
              <Route index element={<Navigate to="home" replace />} />
            </Route>

            {/* Family Routes */}
            <Route path="/family" element={
              <ProtectedRoute allowedRole="family">
                <FamilyLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<FamilyDashboard />} />
              <Route path="health" element={<FamilyHealth />} />
              <Route path="medicines" element={<FamilyMedicines />} />
              <Route path="tasks" element={<FamilyTasks />} />
              <Route path="alerts" element={<FamilyAlerts />} />
              <Route path="settings" element={<FamilySettings />} />
              <Route path="medical-history" element={<MedicalHistory />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
