import { AppRoute, Language } from '../types';
import { LeafEyeLogo } from './LeafEyeLogo';
import { Globe, Sparkles, AlertCircle } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface NavbarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  language: Language;
  onLanguageToggle: (lang: Language) => void;
  geminiConfigured: boolean;
}

export function Navbar({
  currentRoute,
  onRouteChange,
  language,
  onLanguageToggle,
  geminiConfigured,
}: NavbarProps) {
  const t = getTranslation(language);

  const navLinks: { id: AppRoute; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'diagnose', label: t.navDiagnose },
    { id: 'assistant', label: t.navAssistant },
    { id: 'market', label: t.navMarket },
    { id: 'dashboard', label: t.navDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200" id="main-navigation-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onRouteChange('home')}
          className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-md transition-opacity hover:opacity-90 text-left"
          aria-label="Krishi Drishti Home"
          id="nav-brand-btn"
        >
          <LeafEyeLogo size="md" showText={true} />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onRouteChange(link.id)}
                id={`nav-link-${link.id}`}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-emerald-900/10 text-emerald-900'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right action items: Status indicator & Language Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Subtle status indicator */}
          <div
            title={geminiConfigured ? "Connected to Gemini 3.8 Flash" : "Running verified sample demo intelligence"}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 bg-white text-stone-700"
            id="system-status-pill"
          >
            {geminiConfigured ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-800 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {t.liveAi}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-800 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  {t.demoMode}
                </span>
              </>
            )}
          </div>

          {/* Simple Language Toggle: English | हिंदी */}
          <div className="flex items-center bg-stone-200/80 p-0.5 rounded-md border border-stone-300/80 text-xs font-medium" id="language-switcher">
            <button
              onClick={() => onLanguageToggle('en')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
              id="lang-btn-en"
            >
              English
            </button>
            <button
              onClick={() => onLanguageToggle('hi')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
              id="lang-btn-hi"
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
