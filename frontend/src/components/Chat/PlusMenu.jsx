import React, { useRef } from 'react';
import { UploadCloud, FileText, Camera, CheckCircle2, X } from 'lucide-react';

export default function PlusMenu({ isOpen, onClose, onFileSelect, t, language }) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const uploadType = ext === 'pdf' || file.type === 'application/pdf' ? 'pdf' : 'prescription';
      onFileSelect(file, uploadType);
      onClose();
    }
  };

  const isTe = language === 'te';

  return (
    <>
      {/* Hidden file input supporting image and PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                {isTe 
                  ? (t?.upload?.titleTe || t?.upload?.title || 'మీ వైద్య పత్రాన్ని అప్‌లోడ్ చేయండి')
                  : (t?.upload?.title || 'Upload Your Medical Document')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {isTe
                  ? (t?.upload?.supportedTe || t?.upload?.supported || 'ప్రిస్క్రిప్షన్లు, డిశ్చార్జ్ సమ్మరీలు, మెడికల్ రిపోర్ట్‌లు, మందుల ఫోటోలు')
                  : (t?.upload?.supported || 'Prescriptions, discharge summaries, medical reports, medicine photos')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Single Universal Upload Zone */}
          <div className="mt-6">
            <button
              onClick={handleOpenPicker}
              className="w-full flex flex-col items-center justify-center p-8 rounded-3xl border-3 border-dashed border-teal-300 hover:border-teal-600 bg-teal-50/50 hover:bg-teal-50 transition-all group cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <div className="w-20 h-20 rounded-3xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 group-hover:scale-105 transition-transform mb-4">
                <UploadCloud className="w-10 h-10" />
              </div>

              <div className="text-center space-y-1.5">
                <span className="inline-flex items-center space-x-2 text-lg sm:text-xl font-black text-teal-900">
                  <Camera className="w-5 h-5 text-teal-600" />
                  <span>
                    {isTe 
                      ? (t?.upload?.selectFileTe || t?.upload?.selectFile || 'ఫోటో లేదా PDF ఎంచుకోండి')
                      : (t?.upload?.selectFile || 'Choose Photo or PDF')}
                  </span>
                  <FileText className="w-5 h-5 text-teal-600" />
                </span>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {isTe 
                    ? 'కెమెరా ద్వారా ఫోటో తీయండి లేదా ఫోన్/కంప్యూటర్ నుండి ఎంచుకోండి'
                    : 'Take a photo with your camera or select a file from device'}
                </p>
              </div>

              {/* Supported Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="px-3 py-1 rounded-xl bg-white border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs">
                  JPG / JPEG
                </span>
                <span className="px-3 py-1 rounded-xl bg-white border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs">
                  PNG
                </span>
                <span className="px-3 py-1 rounded-xl bg-white border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs">
                  PDF Document
                </span>
              </div>
            </button>
          </div>

          {/* Privacy & Safety Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-center text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              {isTe
                ? 'మీ వైద్య సమాచారం ప్రైవేట్ మరియు సురక్షితంగా ఉంటుంది (గరిష్టంగా 16 MB).'
                : 'Your medical records remain private, verified, and secure (Max 16 MB).'}
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
