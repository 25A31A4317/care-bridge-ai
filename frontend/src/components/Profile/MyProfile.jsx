import React, { useState } from 'react';
import { 
  UserCircle, UserPlus, Edit3, UserCheck, Phone, Heart, 
  Calendar, Globe, Shield, Mail, CheckCircle2, AlertCircle, 
  X, Save, Sparkles, ChevronRight 
} from 'lucide-react';
import { api } from '../../services/api';

export default function MyProfile({
  currentPatient,
  allPatients = [],
  patientId,
  language,
  setLanguage,
  t,
  onSwitchPatient,
  onPatientUpdated
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for registration
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    age: '',
    gender: 'female',
    mobile: '',
    email: '',
    dob: '',
    emergencyContact: '',
    languagePref: language || 'te',
    medicalNotes: ''
  });

  // Form state for editing
  const [editData, setEditData] = useState({
    fullName: currentPatient?.full_name || '',
    age: currentPatient?.age || '',
    gender: currentPatient?.gender || 'female',
    mobile: currentPatient?.mobile || '',
    email: currentPatient?.email || '',
    dob: currentPatient?.dob || '',
    emergencyContact: currentPatient?.emergency_contact || '',
    languagePref: currentPatient?.language_preference || language || 'te',
    medicalNotes: currentPatient?.medical_notes || ''
  });

  const isTe = language === 'te';
  const p = t?.profile || {};

  const handleOpenEdit = () => {
    setEditData({
      fullName: currentPatient?.full_name || '',
      age: currentPatient?.age || '',
      gender: currentPatient?.gender || 'female',
      mobile: currentPatient?.mobile || '',
      email: currentPatient?.email || '',
      dob: currentPatient?.dob || '',
      emergencyContact: currentPatient?.emergency_contact || '',
      languagePref: currentPatient?.language_preference || language || 'te',
      medicalNotes: currentPatient?.medical_notes || ''
    });
    setShowEditModal(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!newPatient.fullName.trim() || !newPatient.age) {
      setStatusMessage({
        type: 'error',
        text: isTe ? 'దయచేసి పేరు మరియు వయస్సు నమోదు చేయండి' : 'Please provide full name and age.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        full_name: newPatient.fullName.trim(),
        age: parseInt(newPatient.age, 10),
        gender: newPatient.gender,
        mobile: newPatient.mobile.trim(),
        email: newPatient.email.trim(),
        dob: newPatient.dob,
        emergency_contact: newPatient.emergencyContact.trim(),
        language_preference: newPatient.languagePref,
        medical_notes: newPatient.medicalNotes.trim()
      };

      const res = await api.registerPatient(payload);
      if (res && (res.user || res.patient_id || res.id)) {
        setStatusMessage({
          type: 'success',
          text: p.registerSuccess || (isTe ? 'ప్రొఫైల్ విజయవంతంగా సృష్టించబడింది!' : 'Profile created successfully!')
        });
        setShowAddModal(false);
        setNewPatient({
          fullName: '',
          age: '',
          gender: 'female',
          mobile: '',
          email: '',
          dob: '',
          emergencyContact: '',
          languagePref: language || 'te',
          medicalNotes: ''
        });

        const newId = res.user?.id || res.patient_id || res.id;
        if (onPatientUpdated) {
          await onPatientUpdated(newId);
        } else if (onSwitchPatient) {
          onSwitchPatient(newId);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.error || (isTe ? 'ప్రొఫైల్ సృష్టి విఫలమైంది' : 'Registration failed.')
        });
      }
    } catch (err) {
      console.error("Error creating patient:", err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error creating profile'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.fullName.trim() || !editData.age) {
      setStatusMessage({
        type: 'error',
        text: isTe ? 'దయచేసి పేరు మరియు వయస్సు నమోదు చేయండి' : 'Please provide full name and age.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        full_name: editData.fullName.trim(),
        age: parseInt(editData.age, 10),
        gender: editData.gender,
        mobile: editData.mobile.trim(),
        email: editData.email.trim(),
        dob: editData.dob,
        emergency_contact: editData.emergencyContact.trim(),
        language_preference: editData.languagePref,
        medical_notes: editData.medicalNotes.trim()
      };

      const res = await api.updateProfile(patientId, payload);
      if (res && !res.error) {
        setStatusMessage({
          type: 'success',
          text: p.updateSuccess || (isTe ? 'ప్రొఫైల్ అప్‌డేట్ అయింది!' : 'Profile updated!')
        });
        setShowEditModal(false);
        if (onPatientUpdated) {
          await onPatientUpdated(patientId);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.error || 'Profile update failed.'
        });
      }
    } catch (err) {
      console.error("Error updating patient:", err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error updating profile'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6 pb-20 md:pb-10">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
            <UserCircle className="w-8 h-8 text-teal-600" />
            <span>{p.title || (isTe ? 'నా ప్రొఫైల్' : 'My Profile')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isTe 
              ? 'మీ వ్యక్తిగత ఆరోగ్య ప్రొఫైల్ నిర్వహణ మరియు రోగి ఎంపిక' 
              : 'Manage patient registration, switch profiles, and customize care preferences'}
          </p>
        </div>

        {/* Add New Patient Action Button */}
        <button
          onClick={() => {
            setShowAddModal(true);
            setStatusMessage(null);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          <span>{p.addNew || (isTe ? 'కొత్త పేషెంట్ ని చేర్చండి' : 'Add New Patient')}</span>
        </button>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center space-x-3 text-sm font-semibold animate-in fade-in duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Current Active Profile Card */}
      <div className="bg-white rounded-3xl border-2 border-teal-200/80 shadow-md p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-inner shrink-0 border border-teal-200">
              {currentPatient?.full_name?.charAt(0) || 'P'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentPatient?.full_name || currentPatient?.username || 'Patient Profile'}
                </span>
                
                {/* Visual Distinction Badge */}
                {currentPatient?.is_demo !== false && currentPatient?.id <= 3 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {p.demoPatient || (isTe ? 'డెమో పేషెంట్' : 'Demo Patient')}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {p.myPatient || (isTe ? 'నా ప్రొఫైల్' : 'My Profile')}
                  </span>
                )}
                
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isTe ? 'క్రియాశీలంగా ఉంది' : 'Active'}</span>
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {currentPatient?.age && (
                  <span>
                    <strong>{p.age || (isTe ? 'వయస్సు' : 'Age')}:</strong> {currentPatient.age} {isTe ? 'సం.' : 'yrs'}
                  </span>
                )}
                {currentPatient?.gender && (
                  <span>
                    <strong>{p.gender || (isTe ? 'లింగం' : 'Gender')}:</strong> {currentPatient.gender}
                  </span>
                )}
                <span>
                  <strong>{p.languagePref || (isTe ? 'భాష' : 'Language')}:</strong> {currentPatient?.language_preference === 'en' ? 'English' : 'తెలుగు'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <button
            onClick={handleOpenEdit}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl border-2 border-teal-600 text-teal-700 hover:bg-teal-50 font-bold text-sm transition-all self-start active:scale-95 shadow-2xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>{p.editProfile || (isTe ? 'ప్రొఫైల్ మార్చండి' : 'Edit Profile')}</span>
          </button>

        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Phone className="w-5 h-5 text-teal-600 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                {p.emergencyContact || (isTe ? 'అత్యవసర సంప్రదింపు' : 'Emergency Contact')}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {currentPatient?.emergency_contact || 'None registered'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Mail className="w-5 h-5 text-teal-600 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                {p.email || (isTe ? 'ఈమెయిల్' : 'Email')}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {currentPatient?.email || 'None provided'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Heart className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                {isTe ? 'ఆరోగ్య గమనికలు' : 'Medical Condition'}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {currentPatient?.medical_notes || (isTe ? 'సాధారణ సంరక్షణ' : 'Standard Routine Care')}
              </div>
            </div>
          </div>

        </div>

        {/* Language Preference Section inside Profile */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-slate-700">
            <Globe className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-bold">
              {p.languagePref || (isTe ? 'భాషా ప్రాధాన్యత' : 'Language Preference')}:
            </span>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setLanguage('te')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                language === 'te' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>తెలుగు (Telugu)</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                language === 'en' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>English</span>
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 2: Saved Profiles & Switch Patient */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {p.savedProfiles || (isTe ? 'సేవ్ చేసిన ప్రొఫైల్స్' : 'Saved Profiles')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isTe 
                ? 'ఏదైనా ప్రొఫైల్ పై క్లిక్ చేసి వారి ప్రిస్క్రిప్షన్లు, మందులు మరియు చాట్‌ను నిర్వహించండి' 
                : 'Switch between registered patients and preloaded demo scenarios'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {allPatients.map((patient) => {
            const isCurrent = currentPatient?.id === patient.id;
            const isDemo = patient.is_demo !== false && patient.id <= 3;

            return (
              <div
                key={patient.id}
                onClick={() => onSwitchPatient && onSwitchPatient(patient.id)}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    isCurrent 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-800'
                  }`}>
                    {patient.full_name?.charAt(0) || patient.username?.charAt(0) || 'P'}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {patient.full_name || patient.username}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {isDemo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          {p.demoPatient || (isTe ? 'డెమో పేషెంట్' : 'Demo Patient')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {p.myPatient || (isTe ? 'నా ప్రొఫైల్' : 'My Profile')}
                        </span>
                      )}

                      <span className="text-xs text-slate-500 font-medium">
                        {patient.role === 'caregiver' ? 'Caregiver' : `Age: ${patient.age || 'N/A'}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isCurrent ? (
                    <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-2xs flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isTe ? 'క్రియాశీలం' : 'Active'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 group-hover:border-teal-500 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-800 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <span>{p.switchPatient || (isTe ? 'ఎంచుకోండి' : 'Switch')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Add New Patient Registration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {p.addNew || (isTe ? 'కొత్త పేషెంట్ ని చేర్చండి' : 'Add New Patient')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTe ? 'వ్యక్తిగత ఆరోగ్య ప్రొఫైల్ వివరాలు పూరించండి' : 'Create a new personal care profile'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {p.fullName || (isTe ? 'పూర్తి పేరు' : 'Full Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isTe ? 'ఉదా: లక్ష్మీ దేవి' : 'e.g. Lakshmi Devi'}
                  value={newPatient.fullName}
                  onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.age || (isTe ? 'వయస్సు' : 'Age')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    required
                    placeholder="68"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.gender || (isTe ? 'లింగం' : 'Gender')}
                  </label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="female">{isTe ? 'మహిళ (Female)' : 'Female'}</option>
                    <option value="male">{isTe ? 'పురుషుడు (Male)' : 'Male'}</option>
                    <option value="other">{isTe ? 'ఇతర (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.mobile || (isTe ? 'మొబైల్ నంబర్' : 'Mobile Number')}
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98480 12345"
                    value={newPatient.mobile}
                    onChange={(e) => setNewPatient({ ...newPatient, mobile: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.emergencyContact || (isTe ? 'అత్యవసర సంప్రదింపు' : 'Emergency Contact')}
                  </label>
                  <input
                    type="text"
                    placeholder={isTe ? '+91 98480 54321 (కుమారుడు)' : '+91 98480 54321 (Son)'}
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.email || (isTe ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email (Optional)')}
                  </label>
                  <input
                    type="email"
                    placeholder="patient@carebridge.ai"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.languagePref || (isTe ? 'భాషా ప్రాధాన్యత' : 'Language Preference')}
                  </label>
                  <select
                    value={newPatient.languagePref}
                    onChange={(e) => setNewPatient({ ...newPatient, languagePref: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isTe ? 'ఆరోగ్య స్థితి / గమనికలు' : 'Medical Notes / Diagnosis'}
                </label>
                <textarea
                  rows="2"
                  placeholder={isTe ? 'ఉదా: రక్తపోటు, మధుమేహం' : 'e.g. Type 2 Diabetes, Hypertension'}
                  value={newPatient.medicalNotes}
                  onChange={(e) => setNewPatient({ ...newPatient, medicalNotes: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                  <span>{p.cancel || (isTe ? 'రద్దు చేయండి' : 'Cancel')}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? (isTe ? 'సేవ్ అవుతోంది...' : 'Saving...') : (p.save || (isTe ? 'సేవ్ చేయండి' : 'Save'))}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Existing Patient Profile */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {p.editProfile || (isTe ? 'ప్రొఫైల్ మార్చండి' : 'Edit Profile')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTe ? 'ప్రస్తుత రోగి వివరాలను సవరించండి' : 'Update current patient information'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {p.fullName || (isTe ? 'పూర్తి పేరు' : 'Full Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.age || (isTe ? 'వయస్సు' : 'Age')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    required
                    value={editData.age}
                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.gender || (isTe ? 'లింగం' : 'Gender')}
                  </label>
                  <select
                    value={editData.gender}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="female">{isTe ? 'మహిళ (Female)' : 'Female'}</option>
                    <option value="male">{isTe ? 'పురుషుడు (Male)' : 'Male'}</option>
                    <option value="other">{isTe ? 'ఇతర (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.mobile || (isTe ? 'మొబైల్ నంబర్' : 'Mobile Number')}
                  </label>
                  <input
                    type="tel"
                    value={editData.mobile}
                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.emergencyContact || (isTe ? 'అత్యవసర సంప్రదింపు' : 'Emergency Contact')}
                  </label>
                  <input
                    type="text"
                    value={editData.emergencyContact}
                    onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.email || (isTe ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email (Optional)')}
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {p.languagePref || (isTe ? 'భాషా ప్రాధాన్యత' : 'Language Preference')}
                  </label>
                  <select
                    value={editData.languagePref}
                    onChange={(e) => setEditData({ ...editData, languagePref: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isTe ? 'ఆరోగ్య స్థితి / గమనికలు' : 'Medical Notes / Diagnosis'}
                </label>
                <textarea
                  rows="2"
                  value={editData.medicalNotes}
                  onChange={(e) => setEditData({ ...editData, medicalNotes: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                  <span>{p.cancel || (isTe ? 'రద్దు చేయండి' : 'Cancel')}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? (isTe ? 'సేవ్ అవుతోంది...' : 'Saving...') : (p.save || (isTe ? 'సేవ్ చేయండి' : 'Save'))}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
