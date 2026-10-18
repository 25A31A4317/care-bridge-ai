import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Clock, Calendar, FileText, HeartPulse, Trash2, 
  Bell, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export default function CaregiverPortal({ patientId, language, t }) {
  const [viewMode, setViewMode] = useState('patient_manage'); // 'patient_manage' or 'caregiver_view'
  const [relationships, setRelationships] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(2);
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] = useState('Son');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Caregiver Portal Data
  const [caregiverId, setCaregiverId] = useState(4); // Default Ramesh (Caregiver ID 4)
  const [caregiverData, setCaregiverData] = useState(null);
  const [caregiverError, setCaregiverError] = useState('');

  // Alerts Data
  const [alerts, setAlerts] = useState([]);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);

  useEffect(() => {
    loadRelationships();
  }, [patientId]);

  useEffect(() => {
    if (viewMode === 'caregiver_view') {
      loadCaregiverStatus();
      loadAlerts();
    }
  }, [viewMode, caregiverId, patientId]);

  const loadRelationships = async () => {
    try {
      const res = await api.getCaregiverRelationships(patientId);
      if (res && res.relationships) {
        setRelationships(res.relationships);
        setActiveCount(res.active_count);
        setMaxAllowed(res.max_allowed);
      }
    } catch (e) {
      console.error("Error loading relationships:", e);
    }
  };

  const loadCaregiverStatus = async () => {
    setCaregiverError('');
    try {
      const res = await api.getPatientStatusForCaregiver(caregiverId, patientId);
      if (res.error) {
        setCaregiverError(language === 'te' ? (res.error_te || res.error) : res.error);
        setCaregiverData(null);
      } else {
        setCaregiverData(res);
      }
    } catch (e) {
      setCaregiverError(e.message || "Failed to load caregiver status");
      setCaregiverData(null);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.getCaregiverAlerts(caregiverId);
      if (res && res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (e) {
      console.warn("Could not load caregiver alerts:", e);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await api.dismissAlert(alertId);
      await loadAlerts();
    } catch (e) {
      console.error("Error dismissing alert:", e);
    }
  };

  const handleCheckOverdue = async () => {
    setIsCheckingAlerts(true);
    try {
      await api.checkOverdueDoses();
      await loadAlerts();
      await loadCaregiverStatus();
    } catch (e) {
      console.error("Error checking overdue doses:", e);
    } finally {
      setIsCheckingAlerts(false);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newEmail.trim()) {
      setFormError('Please enter caregiver email address.');
      return;
    }

    try {
      const res = await api.authorizeCaregiver({
        patient_id: patientId,
        email: newEmail.trim(),
        relationship_type: newRelationship,
        permissions: ["view_schedules", "view_documents", "view_careplan", "view_status"]
      });

      if (res.error) {
        setFormError(language === 'te' ? (res.error_te || res.error) : res.error);
      } else {
        setFormSuccess('Caregiver authorized successfully!');
        setNewEmail('');
        loadRelationships();
      }
    } catch (e) {
      setFormError(e.message || 'Authorization failed.');
    }
  };

  const handleRevoke = async (relId) => {
    try {
      await api.revokeCaregiver(relId);
      loadRelationships();
    } catch (e) {
      console.error("Error revoking:", e);
    }
  };

  const isTe = language === 'te';

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6 pb-20 md:pb-10 animate-in fade-in duration-200">
      
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
            <Users className="w-8 h-8 text-teal-600" />
            <span>{t.caregiver.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.caregiver.subtitle}
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('patient_manage')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'patient_manage' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTe ? 'రోగి నిర్వహణ (Patient Settings)' : 'Patient Settings'}
          </button>
          <button
            onClick={() => setViewMode('caregiver_view')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'caregiver_view' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTe ? 'సంరక్షకుల పోర్టల్ (Caregiver Portal)' : 'Caregiver Portal'}
          </button>
        </div>
      </div>

      {/* VIEW 1: Patient Settings (Authorize / Revoke) */}
      {viewMode === 'patient_manage' && (
        <div className="space-y-6">
          
          {/* Active Limit Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {t.caregiver.authorizedCaregivers}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {isTe 
                  ? 'రోగి గోప్యత కొరకు, గరిష్టంగా ఇద్దరు విశ్వసనీయ కుటుంబ సభ్యులకు మాత్రమే ఏకకాలంలో అనుమతి ఇవ్వవచ్చు.'
                  : 'For patient privacy, up to 2 family members can be granted access simultaneously.'}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg sm:text-xl font-black px-3.5 py-1.5 rounded-2xl ${
                activeCount >= maxAllowed ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {activeCount} / {maxAllowed} Active
              </span>
            </div>
          </div>

          {/* Form to Authorize */}
          {activeCount < maxAllowed ? (
            <form onSubmit={handleAuthorize} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>{t.caregiver.addCaregiver}</span>
              </h3>

              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.caregiver.caregiverEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="family.member@email.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.caregiver.relationship}
                  </label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Son">Son (కుమారుడు)</option>
                    <option value="Daughter">Daughter (కుమార్తె)</option>
                    <option value="Spouse">Spouse (భార్య / భర్త)</option>
                    <option value="Sibling">Sibling (సోదరుడు / సోదరి)</option>
                    <option value="Trusted Guardian">Trusted Guardian (సంరక్షకుడు)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-md shadow-teal-600/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isTe ? 'అనుమతి ఇవ్వండి' : 'Confirm Authorization'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
              {isTe
                ? 'గరిష్ట పరిమితి (2 సంరక్షకులు) పూర్తయింది. కొత్తవారిని చేర్చడానికి ముందున్న వారి అనుమతిని రద్దు చేయండి.'
                : 'Maximum limit of 2 caregivers reached. To authorize a new caregiver, revoke access from one of the active members below.'}
            </div>
          )}

          {/* List of Relationships */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {isTe ? 'ప్రస్తుత అధికారిక సంరక్షకులు' : 'Existing Authorized Caregivers'}
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {relationships.map((rel) => {
                const isActive = rel.status === 'active';
                return (
                  <div key={rel.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{rel.username}</span>
                        <span className="text-xs text-slate-500">({rel.email})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500 line-through'
                        }`}>
                          {rel.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        Relationship: <strong>{rel.relationship_type}</strong>
                      </div>
                      <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                        Permissions: {rel.permissions_list?.join(', ')}
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => handleRevoke(rel.id)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.caregiver.revoke}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: Caregiver Portal View (Authenticated) */}
      {viewMode === 'caregiver_view' && (
        <div className="space-y-6">
          
          {/* Caregiver Account Selector (Test RBAC) */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-bold text-slate-700">
              {isTe ? 'సంరక్షకుల ఖాతా ఎంపిక (RBAC పరీక్ష):' : 'Simulate Caregiver Login:'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCaregiverId(4)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  caregiverId === 4 ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-50'
                }`}
              >
                Ramesh (Authorized Son)
              </button>
              <button
                onClick={() => setCaregiverId(5)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  caregiverId === 5 ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-50'
                }`}
              >
                Swathi (Caregiver ID 5)
              </button>
              <button
                onClick={() => setCaregiverId(999)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  caregiverId === 999 ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                }`}
                title="Test unauthorized caregiver access"
              >
                Unauthorized User (ID 999)
              </button>
            </div>
          </div>

          {/* Access Denied Warning */}
          {caregiverError && (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-bold text-rose-900">Access Denied (403 Forbidden)</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{caregiverError}</p>
            </div>
          )}

          {/* Caregiver Permitted Data */}
          {caregiverData && (
            <div className="space-y-6">
              
              {/* Alert Center Section (Enhanced feature) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        {isTe ? 'మందుల హెచ్చరికలు & నోటిఫికేషన్లు' : 'Medication Adherence Alerts'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isTe 
                          ? 'మిస్సయిన లేదా అలస్యమైన మోతాదుల సమాచారం' 
                          : 'Real-time alerts for missed or overdue medication doses'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckOverdue}
                    disabled={isCheckingAlerts}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAlerts ? 'animate-spin' : ''}`} />
                    <span>{isCheckingAlerts ? (isTe ? 'పరిశీలిస్తున్నాము...' : 'Checking...') : (isTe ? 'తాజా హెచ్చరికలు తనిఖీ చేయండి' : 'Check Overdue Doses Now')}</span>
                  </button>
                </div>

                {alerts.length > 0 ? (
                  <div className="space-y-2.5 pt-2">
                    {alerts.map((alt) => (
                      <div key={alt.id} className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-extrabold text-amber-950">
                              {isTe ? (alt.message_te || alt.message_en) : alt.message_en}
                            </div>
                            <div className="text-[11px] text-amber-800 mt-0.5">
                              {alt.medicine_name && <span>Medicine: <strong>{alt.medicine_name}</strong> • </span>}
                              <span>Created: {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDismissAlert(alt.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors self-end sm:self-center"
                        >
                          {isTe ? 'తొలగించండి (Dismiss)' : 'Dismiss'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isTe ? 'అన్ని మందులు సకాలంలో తీసుకుంటున్నారు. పెండింగ్ హెచ్చరికలు లేవు.' : 'All medications are on schedule. No overdue alerts.'}</span>
                  </div>
                )}
              </div>

              {/* Patient Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    Authorized Caregiver Monitoring
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 mt-1">
                    {caregiverData.patient?.full_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Age: {caregiverData.patient?.age} • Emergency: {caregiverData.patient?.emergency_contact}
                  </p>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="font-semibold text-slate-700">Granted Permissions:</span>
                  <div className="text-teal-700 font-mono mt-0.5">{caregiverData.permissions?.join(', ')}</div>
                </div>
              </div>

              {/* Medication Adherence Today */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>{isTe ? 'నేటి మందుల స్థితి' : "Today's Medicine Adherence Status"}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caregiverData.doses_today?.map((d) => (
                    <div key={d.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{d.medicine_name} {d.strength}</div>
                        <div className="text-[11px] text-slate-500">
                          Scheduled: {d.scheduled_time.includes('T') ? d.scheduled_time.split('T')[1].slice(0, 5) : d.scheduled_time.split(' ')[1]}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        d.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Appointment */}
              {caregiverData.appointment && (
                <div className="bg-teal-50/60 p-6 rounded-3xl border border-teal-200">
                  <h3 className="text-sm font-bold text-teal-900 mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span>Upcoming Doctor Appointment</span>
                  </h3>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div><strong>Doctor:</strong> {caregiverData.appointment.doctor_or_dept}</div>
                    <div><strong>Date & Time:</strong> {caregiverData.appointment.appointment_date} at {caregiverData.appointment.appointment_time}</div>
                    <div><strong>Location:</strong> {caregiverData.appointment.location}</div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
