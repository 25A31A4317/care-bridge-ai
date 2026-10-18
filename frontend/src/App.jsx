import React, { useState, useEffect } from 'react';
import Navbar from './components/Common/Navbar';
import FirstVisitLanguageModal from './components/Common/FirstVisitLanguageModal';
import MyCareAssistant from './components/MyCareAssistant/MyCareAssistant';
import CaregiverPortal from './components/Caregiver/CaregiverPortal';
import MyProfile from './components/Profile/MyProfile';
import { api } from './services/api';
import enTranslations from './translations/en.json';
import teTranslations from './translations/te.json';

export default function App() {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('carebridge_language') || 'te';
  });

  const [showFirstVisitModal, setShowFirstVisitModal] = useState(() => {
    return !localStorage.getItem('carebridge_language_selected');
  });

  // 3 Navigation Tabs: 'assistant' | 'family' | 'profile'
  const [currentTab, setCurrentTab] = useState('assistant');

  // Sub-sections for My Care Assistant: 'chat' | 'medicines' | 'documents' | 'careplan'
  const [assistantSection, setAssistantSection] = useState('chat');

  const [patientId, setPatientId] = useState(1);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const t = language === 'te' ? teTranslations : enTranslations;

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (targetId = null) => {
    try {
      let res;
      try {
        res = await api.getAllPatients();
      } catch (err) {
        res = await api.getDemoUsers();
      }

      const users = res?.patients || res?.users || [];
      if (users && users.length > 0) {
        setAllPatients(users);
        const chosenId = targetId || patientId;
        const match = users.find(u => u.id === chosenId) || users[0];
        if (match) {
          setCurrentPatient({
            ...match,
            full_name: match.full_name || match.username,
            age: match.age,
            emergency_contact: match.emergency_contact
          });
          if (targetId) setPatientId(chosenId);
        }
      } else {
        // Fallback to demo users
        const demoRes = await api.getDemoUsers();
        if (demoRes && demoRes.users) {
          setAllPatients(demoRes.users);
          const match = demoRes.users.find(u => u.id === (targetId || patientId)) || demoRes.users[0];
          if (match) {
            setCurrentPatient(match);
            if (targetId) setPatientId(targetId);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load patients:", e);
    }
  };

  const handleSelectLanguage = async (selectedLang) => {
    setLanguageState(selectedLang);
    localStorage.setItem('carebridge_language', selectedLang);
    localStorage.setItem('carebridge_language_selected', 'true');
    setShowFirstVisitModal(false);

    try {
      await api.setLanguage(patientId, selectedLang);
    } catch (e) {
      console.warn("Language sync notice:", e);
    }
  };

  const handleSetLanguage = async (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('carebridge_language', newLang);
    try {
      await api.setLanguage(patientId, newLang);
    } catch (e) {
      console.warn("Language sync notice:", e);
    }
  };

  const handleSwitchPatient = async (newPatientId) => {
    setPatientId(newPatientId);
    try {
      const res = await api.switchDemoUser(newPatientId);
      if (res && res.user) {
        setCurrentPatient({
          ...res.user,
          full_name: res.profile?.full_name || res.user.username,
          age: res.profile?.age,
          emergency_contact: res.profile?.emergency_contact,
          medical_notes: res.profile?.medical_notes
        });
        if (res.user.language_preference) {
          handleSetLanguage(res.user.language_preference);
        }
      } else {
        // Match from allPatients
        const found = allPatients.find(p => p.id === newPatientId);
        if (found) {
          setCurrentPatient(found);
          if (found.language_preference) {
            handleSetLanguage(found.language_preference);
          }
        }
      }
    } catch (e) {
      console.error("Failed to switch patient:", e);
      const found = allPatients.find(p => p.id === newPatientId);
      if (found) setCurrentPatient(found);
    }
  };

  const handleOpenDocDetails = (docId) => {
    setSelectedDocId(docId);
    setCurrentTab('assistant');
    setAssistantSection('documents');
  };

  const handlePatientUpdated = async (targetId) => {
    await loadPatients(targetId || patientId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-200 selection:text-teal-900">
      
      {/* First Visit Language Selection Modal */}
      {showFirstVisitModal && (
        <FirstVisitLanguageModal onSelectLanguage={handleSelectLanguage} />
      )}

      {/* 3-Tab Header Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={handleSetLanguage}
        t={t}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {/* Tab 1: My Care Assistant (Combines Chat + Medicines + Documents + Care Plan) */}
        {currentTab === 'assistant' && (
          <MyCareAssistant
            patientId={patientId}
            language={language}
            t={t}
            currentPatient={currentPatient}
            selectedDocId={selectedDocId}
            onOpenDocDetails={handleOpenDocDetails}
            onClearSelectedDoc={() => setSelectedDocId(null)}
            assistantSection={assistantSection}
            setAssistantSection={setAssistantSection}
          />
        )}

        {/* Tab 2: Family Care (Enhanced Caregiver Portal) */}
        {currentTab === 'family' && (
          <CaregiverPortal
            patientId={patientId}
            language={language}
            t={t}
          />
        )}

        {/* Tab 3: My Profile (Patient Registration, Profile Management, Patient Switching) */}
        {currentTab === 'profile' && (
          <MyProfile
            currentPatient={currentPatient}
            allPatients={allPatients}
            patientId={patientId}
            language={language}
            setLanguage={handleSetLanguage}
            t={t}
            onSwitchPatient={handleSwitchPatient}
            onPatientUpdated={handlePatientUpdated}
          />
        )}
      </main>

    </div>
  );
}
