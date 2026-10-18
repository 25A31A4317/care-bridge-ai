import React from 'react';
import { HeartHandshake, Users, UserCircle, Languages } from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  language, 
  setLanguage, 
  t 
}) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-3">
            
            {/* Logo & Brand */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => setCurrentTab('assistant')}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {language === 'te' ? 'కేర్‌బ్రిడ్జ్ AI' : 'CareBridge AI'}
                  </span>
                  <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Safe Care
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {language === 'te' ? 'మీ మందులు, మీ భాష, మీ ఆరోగ్యం' : 'Your Medicine, Your Language, Your Care'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links (3 Tabs) */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setCurrentTab('assistant')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-base font-bold transition-all ${
                  currentTab === 'assistant'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'text-slate-700 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <HeartHandshake className="w-5 h-5" />
                <span>{t?.nav?.assistant || 'My Care Assistant'}</span>
              </button>

              <button
                onClick={() => setCurrentTab('family')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-base font-bold transition-all ${
                  currentTab === 'family'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'text-slate-700 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>{t?.nav?.family || 'Family Care'}</span>
              </button>

              <button
                onClick={() => setCurrentTab('profile')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-base font-bold transition-all ${
                  currentTab === 'profile'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'text-slate-700 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span>{t?.nav?.profile || 'My Profile'}</span>
              </button>
            </nav>

            {/* Right Controls: Language Switcher Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
                className="flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 text-xs sm:text-sm font-bold text-slate-800 transition-all shadow-xs"
                title="Toggle Telugu / English"
              >
                <Languages className="w-4 h-4 text-teal-600" />
                <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Strip */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg no-print flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('assistant')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'assistant'
              ? 'text-teal-700 font-extrabold bg-teal-50'
              : 'text-slate-600 font-medium'
          }`}
        >
          <HeartHandshake className="w-5 h-5 mb-0.5" />
          <span className="text-xs sm:text-sm whitespace-nowrap">{t?.nav?.assistant || 'Assistant'}</span>
        </button>

        <button
          onClick={() => setCurrentTab('family')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'family'
              ? 'text-teal-700 font-extrabold bg-teal-50'
              : 'text-slate-600 font-medium'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-xs sm:text-sm whitespace-nowrap">{t?.nav?.family || 'Family'}</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'profile'
              ? 'text-teal-700 font-extrabold bg-teal-50'
              : 'text-slate-600 font-medium'
          }`}
        >
          <UserCircle className="w-5 h-5 mb-0.5" />
          <span className="text-xs sm:text-sm whitespace-nowrap">{t?.nav?.profile || 'Profile'}</span>
        </button>
      </nav>
    </>
  );
}
