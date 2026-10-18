import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Pill, FileText, Printer, HeartHandshake, 
  Clock, CheckCircle2, AlertCircle, ChevronRight, Sparkles 
} from 'lucide-react';
import ChatInterface from '../Chat/ChatInterface';
import MedicineManagement from '../Medicine/MedicineManagement';
import DocumentManager from '../Documents/DocumentManager';
import CarePlanView from '../CarePlan/CarePlanView';
import { api } from '../../services/api';

export default function MyCareAssistant({
  patientId,
  language,
  t,
  currentPatient,
  selectedDocId,
  onOpenDocDetails,
  onClearSelectedDoc,
  assistantSection = 'chat',
  setAssistantSection
}) {
  const [todaySummary, setTodaySummary] = useState({ total: 0, taken: 0, pending: 0, missed: 0 });
  const [nextDose, setNextDose] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadDailyOverview();
  }, [patientId]);

  const loadDailyOverview = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.getTodayDoses(patientId);
      if (res && res.doses) {
        setTodaySummary(res.summary || { total: 0, taken: 0, pending: 0, missed: 0 });
        const pending = res.doses.find(d => d.status === 'pending');
        setNextDose(pending || null);
      }
    } catch (e) {
      console.warn("Could not load daily medicine overview:", e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const isTe = language === 'te';
  const patientDisplayName = currentPatient?.full_name 
    ? currentPatient.full_name.split('(')[0].trim() 
    : (isTe ? 'రోగి' : 'Patient');

  const greetingText = isTe
    ? `నమస్కారం, ${patientDisplayName} గారు!`
    : `Hello, ${patientDisplayName}!`;

  const total = todaySummary.total || 0;
  const taken = todaySummary.taken || 0;
  const progressPercent = total > 0 ? Math.round((taken / total) * 100) : 100;

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Top Compact Daily Care Overview Card */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 text-white shadow-md border-b border-teal-800/40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            
            {/* Left: Patient Greeting */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                  {greetingText}
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 font-medium">
                  {isTe 
                    ? 'మీ రోజువారీ సంరక్షణ మరియు మందుల సారాంశం' 
                    : 'Your daily care & verified medicine progress'}
                </p>
              </div>
            </div>

            {/* Right: Next Medicine & Progress Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Next Medicine Pill */}
              <div 
                onClick={() => setAssistantSection('medicines')}
                className="cursor-pointer bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl px-3.5 py-2 flex items-center space-x-2.5 transition-all"
                title={isTe ? 'మందుల వివరాలు చూడండి' : 'View medicine details'}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100">
                    {isTe ? 'తదుపరి మందు' : 'Next Medicine'}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold max-w-[200px] truncate text-white">
                    {nextDose ? (
                      `${nextDose.medicine_name} (${nextDose.scheduled_time.includes('T') ? nextDose.scheduled_time.split('T')[1].slice(0, 5) : nextDose.scheduled_time})`
                    ) : total > 0 && taken === total ? (
                      isTe ? 'అన్నీ తీసుకున్నారు!' : 'All taken today!'
                    ) : (
                      isTe ? 'షెడ్యూల్ చూడండి' : 'No pending dose'
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70" />
              </div>

              {/* Today's Progress Badge */}
              <div 
                onClick={() => setAssistantSection('medicines')}
                className="cursor-pointer bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl px-3.5 py-2 flex items-center space-x-2.5 transition-all"
                title={isTe ? 'మందుల పురోగతి' : "Today's Progress"}
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100">
                    {isTe ? 'నేటి పురోగతి' : "Today's Progress"}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white flex items-center space-x-1.5">
                    <span>{taken}/{total}</span>
                    <span className="text-[11px] font-medium text-teal-200">({progressPercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sub-navigation Pills: Chat | My Medicines | My Documents | Care Plan */}
      <div className="bg-slate-100/90 border-b border-slate-200/80 py-2.5 px-3 sticky top-20 z-30 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar">
          
          {/* Pill 1: Chat */}
          <button
            onClick={() => setAssistantSection('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
              assistantSection === 'chat'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isTe ? 'సహాయక చాట్' : 'Care Chat'}</span>
          </button>

          {/* Pill 2: My Medicines */}
          <button
            onClick={() => setAssistantSection('medicines')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
              assistantSection === 'medicines'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>{isTe ? 'నా మందులు' : 'My Medicines'}</span>
          </button>

          {/* Pill 3: My Documents */}
          <button
            onClick={() => setAssistantSection('documents')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
              assistantSection === 'documents'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isTe ? 'నా పత్రాలు' : 'My Documents'}</span>
          </button>

          {/* Pill 4: Care Plan */}
          <button
            onClick={() => setAssistantSection('careplan')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
              assistantSection === 'careplan'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{isTe ? 'సంరక్షణ ప్రణాళిక' : 'Care Plan'}</span>
          </button>

        </div>
      </div>

      {/* Main Sub-section Content */}
      <div className="flex-1 pb-16 md:pb-6">
        {assistantSection === 'chat' && (
          <ChatInterface
            patientId={patientId}
            language={language}
            t={t}
            onOpenDocDetails={(docId) => {
              onOpenDocDetails(docId);
              setAssistantSection('documents');
            }}
          />
        )}

        {assistantSection === 'medicines' && (
          <MedicineManagement
            patientId={patientId}
            language={language}
            t={t}
          />
        )}

        {assistantSection === 'documents' && (
          <DocumentManager
            patientId={patientId}
            language={language}
            t={t}
            selectedDocId={selectedDocId}
            onClearSelectedDoc={onClearSelectedDoc}
          />
        )}

        {assistantSection === 'careplan' && (
          <CarePlanView
            patientId={patientId}
            language={language}
            t={t}
          />
        )}
      </div>

    </div>
  );
}
