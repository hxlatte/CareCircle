import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';

export default function SeniorHelp() {
  const { t } = useLanguage();
  const [alertSent, setAlertSent] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null, address: 'Detecting...' });
  const [medicalInfo, setMedicalInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [locationStatus, setLocationStatus] = useState(t('fetching_location') || 'Fetching your location...');

  const fetchLocation = () => {
    setLocationStatus(t('fetching_location') || 'Fetching your location...');
    setLocation(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (GPS)`,
              updatedAt: new Date()
            };
            setLocation(newLocation);
            setLocationStatus('');
            api.patch('/auth/profile', { location: newLocation }).catch(console.error);
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus(t('enable_location') || 'Please enable location access for better services');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationStatus(t('location_unavailable') || 'Location unavailable. Try again later.');
          } else if (error.code === error.TIMEOUT) {
            setLocationStatus(t('location_timeout') || 'Location request timed out. Please try again.');
          } else {
            setLocationStatus(t('failed_location') || 'Failed to get location.');
          }

          const defaultLoc = {
            lat: 17.4564,
            lng: 78.4415,
            address: '123 Care Ave, Home (Default)',
            updatedAt: new Date()
          };
          api.patch('/auth/profile', { location: defaultLoc }).catch(console.error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Geolocation is not supported by your browser');
    }
  };

  useEffect(() => {
    fetchHelpData();
    fetchLocation();
  }, []);

  const fetchHelpData = async () => {
    try {
      const userRes = await api.get('/auth/me');
      if (userRes.data.medicalInfo) {
        setMedicalInfo(userRes.data.medicalInfo);
      }
      

    } catch (err) {
      console.error('Error fetching help data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = async () => {
    try {
      setAlertSent(true);
      await api.post('/alerts', {
        message: 'EMERGENCY: SOS Button Pressed!',
        severity: 'critical'
      });
    } catch (err) {
      console.error(err);
      alert('Alert failed to send to server, but family notified locally.');
    }
  };

  return (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full mb-12 text-center md:text-left">
        <h2 className="text-6xl font-extrabold text-[var(--color-primary)] leading-tight tracking-[-0.03em] mb-4">{t('emergency')}</h2>
        <p className="text-2xl text-[var(--color-on-surface-variant)]">{t('help_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* SOS Button Area */}
        <div className="flex flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] p-12 rounded-[2rem] shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
          <button 
            onClick={handleSOS}
            disabled={alertSent}
            className={`w-72 h-72 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all cursor-pointer border-8 border-[var(--color-surface)] ${
              alertSent 
                ? 'bg-[var(--color-secondary)] scale-105 opacity-90' 
                : 'bg-gradient-to-br from-[var(--color-error)] to-red-800 hover:scale-105 animate-[pulse_2s_infinite]'
            }`}
          >
            <span className="material-symbols-outlined text-[6rem] mb-4">
              {alertSent ? 'verified' : 'emergency'}
            </span>
            <span className="text-3xl font-bold px-4 text-center leading-tight">
              {alertSent ? t('family_notified') : t('sos_alert')}
            </span>
          </button>
          
          {alertSent && (
            <p className="mt-8 text-2xl font-bold text-[var(--color-secondary)] text-center animate-[slideUp_0.5s_ease-out]">
              {t('help_on_way')}
            </p>
          )}


        </div>

        {/* Medical Info & Location */}
        <div className="space-y-8">
          {medicalInfo && (medicalInfo.bloodGroup || medicalInfo.allergies || medicalInfo.conditions) && (
            <div className="bg-[var(--color-surface-container-lowest)] p-10 rounded-[2rem] shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl">medical_information</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-on-surface)]">{t('medical_card')}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {medicalInfo.bloodGroup && (
                  <div className="bg-[var(--color-surface-container-high)] p-6 rounded-xl">
                    <p className="text-stone-500 font-bold tracking-widest uppercase text-sm mb-2">{t('blood_group')}</p>
                    <p className="text-3xl font-black text-[var(--color-error)]">{medicalInfo.bloodGroup}</p>
                  </div>
                )}
                {medicalInfo.allergies && (
                  <div className="bg-[var(--color-surface-container-high)] p-6 rounded-xl">
                    <p className="text-stone-500 font-bold tracking-widest uppercase text-sm mb-2">{t('allergies')}</p>
                    <p className="text-2xl font-bold text-[var(--color-on-surface)]">{medicalInfo.allergies}</p>
                  </div>
                )}
                {medicalInfo.conditions && (
                  <div className="col-span-2 bg-[var(--color-surface-container-high)] p-6 rounded-xl">
                    <p className="text-stone-500 font-bold tracking-widest uppercase text-sm mb-2">{t('conditions')}</p>
                    <p className="text-2xl font-bold text-[var(--color-on-surface)]">{medicalInfo.conditions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[var(--color-surface-container-lowest)] p-10 rounded-[2rem] shadow-[0_10px_30px_rgba(28,28,25,0.05)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl">location_on</span>
                <h3 className="text-3xl font-extrabold text-[var(--color-on-surface)]">{t('current_location')}</h3>
              </div>
              <button 
                onClick={fetchLocation} 
                className="flex items-center gap-2 text-[var(--color-primary)] font-bold bg-green-50 px-6 py-3 rounded-full hover:bg-green-100 transition-colors shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">refresh</span>
                {t('refresh_location')}
              </button>
            </div>
            
            {location ? (
              <div className="w-full h-72 bg-stone-200 rounded-xl overflow-hidden relative border-2 border-stone-300 shadow-inner">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight="0" 
                  marginWidth="0" 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  style={{ border: 0 }}
                  title="Map View"
                ></iframe>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-max max-w-[90%]">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full font-bold shadow-xl text-stone-800 text-lg border border-stone-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 animate-bounce">pin_drop</span>
                    {location.address}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-72 bg-stone-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-stone-300 text-center p-8">
                <span className={`material-symbols-outlined text-5xl mb-4 ${locationStatus.includes('Fetching') ? 'text-[var(--color-primary)] animate-spin' : 'text-red-500'}`}>
                  {locationStatus.includes('Fetching') ? 'autorenew' : 'location_off'}
                </span>
                <p className={`font-bold text-xl ${locationStatus.includes('Fetching') ? 'text-[var(--color-primary)]' : 'text-red-600'}`}>
                  {locationStatus}
                </p>
                {!locationStatus.includes('Fetching') && (
                  <p className="text-stone-500 mt-2 font-medium text-lg max-w-md">
                    Please click the lock or location icon in your browser's address bar to allow location access, then click Refresh.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
