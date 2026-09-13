import { AppRoute, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { ScanSearch, MessageSquare, ArrowRight, ShieldCheck, HeartHandshake, Languages } from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  language: Language;
}

export function HomePage({ onNavigate, language }: HomePageProps) {
  const t = getTranslation(language);

  return (
    <div className="flex flex-col w-full pb-20 md:pb-12" id="home-page-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-stone-200/80 bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Typography & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200/60 text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-6">
                <span>{language === 'hi' ? 'कृषि दृष्टि' : 'Krishi Drishti'}</span>
                <span className="w-1 h-1 rounded-full bg-emerald-600" />
                <span>{language === 'hi' ? 'एआई कृषि मंच' : 'AI Agriculture Platform'}</span>
              </div>

              {/* Tagline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-[1.15]">
                {t.tagline}
              </h1>

              {/* Short Supporting Text */}
              <p className="mt-5 text-base sm:text-lg text-stone-700 leading-relaxed max-w-xl">
                {t.shortDesc}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('diagnose')}
                  id="hero-cta-diagnose"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-emerald-800 text-white font-medium text-sm sm:text-base shadow-xs hover:bg-emerald-900 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px]"
                >
                  <ScanSearch className="w-5 h-5 text-emerald-200" />
                  <span>{t.ctaDiagnose}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300 ml-1" />
                </button>

                <button
                  onClick={() => onNavigate('assistant')}
                  id="hero-cta-assistant"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white border border-stone-300 text-stone-800 font-medium text-sm sm:text-base hover:bg-stone-100/80 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px]"
                >
                  <MessageSquare className="w-4 h-4 text-stone-600" />
                  <span>{t.ctaAssistant}</span>
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-stone-700 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {language === 'hi' ? 'प्रारंभिक रोग विश्लेषण' : 'Preliminary diagnosis'}
                </span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>{language === 'hi' ? 'अंग्रेजी एवं हिंदी' : 'English & Hindi'}</span>
              </div>
            </div>

            {/* Right Column: Clean, Subtle Agricultural Visual Illustration */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-4/3 sm:aspect-square bg-stone-100/60 rounded-2xl border border-stone-200/80 p-6 flex flex-col items-center justify-center shadow-xs">
                {/* Clean botanical vector graphic */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xs" fill="none">
                    {/* Background soft soil contour */}
                    <ellipse cx="100" cy="175" rx="60" ry="12" fill="#e2e8f0" opacity="0.6" />
                    {/* Plant stem */}
                    <path d="M100 175 Q98 120 100 35" stroke="#2d6a4f" strokeWidth="4" strokeLinecap="round" />
                    {/* Primary healthy leaf */}
                    <path
                      d="M100 110 C140 100 165 70 160 40 C125 45 105 80 100 110 Z"
                      fill="#40916c"
                      stroke="#1b4332"
                      strokeWidth="2"
                    />
                    <path d="M100 110 Q130 75 160 40" stroke="#b7e4c7" strokeWidth="1.5" />
                    {/* Secondary diagnostic target leaf */}
                    <path
                      d="M100 135 C60 120 35 90 40 60 C75 65 95 105 100 135 Z"
                      fill="#52b788"
                      stroke="#1b4332"
                      strokeWidth="2"
                    />
                    <path d="M100 135 Q70 95 40 60" stroke="#d8f3dc" strokeWidth="1.5" />
                    {/* Scanner sightline / Drishti Vision ring */}
                    <circle cx="68" cy="95" r="22" stroke="#1b4332" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="68" cy="95" r="3" fill="#e76f51" />
                    <circle cx="68" cy="95" r="8" stroke="#e76f51" strokeWidth="1" opacity="0.6" />
                  </svg>
                </div>

                {/* Micro scan tag */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs border border-stone-200/90 rounded-lg py-2 px-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="text-xs font-medium text-stone-800">
                      {language === 'hi' ? 'पत्ती स्वास्थ्य स्कैनर' : 'Leaf Health Scanner'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    AI Ready
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Benefits (Strictly 3 as requested) */}
      <section className="py-14 sm:py-18 max-w-5xl mx-auto px-4 sm:px-6 w-full" id="core-benefits-section">
        <div className="text-left mb-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {t.coreBenefitsTitle}
          </h2>
          <p className="text-stone-700 text-sm mt-1">
            {language === 'hi' 
              ? 'किसानों को उनकी स्थानीय भाषा में विश्वसनीय जानकारी प्रदान करने हेतु डिज़ाइन किया गया।'
              : 'Designed to deliver dependable agricultural intelligence directly into the hands of farmers.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Benefit 1 */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-6 flex flex-col items-start shadow-xs hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <ScanSearch className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-stone-900 mb-2">
              {t.benefit1Title}
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              {t.benefit1Desc}
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-6 flex flex-col items-start shadow-xs hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-stone-900 mb-2">
              {t.benefit2Title}
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              {t.benefit2Desc}
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-6 flex flex-col items-start shadow-xs hover:border-stone-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-stone-900 mb-2">
              {t.benefit3Title}
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              {t.benefit3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section (01, 02, 03, 04) */}
      <section className="py-14 sm:py-18 bg-stone-100/50 border-t border-stone-200/80 w-full" id="how-it-works-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {t.howItWorksTitle}
            </h2>
            <p className="text-stone-700 text-sm mt-1">
              {language === 'hi'
                ? 'चार सरल चरणों में अपनी फसल की स्थिति जानें।'
                : 'Understand your crop condition in four straightforward steps.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-xl border border-stone-200/80 p-5 flex flex-col relative shadow-xs">
              <span className="text-emerald-800 font-mono font-bold text-xs tracking-wider mb-2">
                {t.howStep1Num}
              </span>
              <h4 className="font-semibold text-stone-900 text-base mb-1.5">
                {t.howStep1Title}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                {t.howStep1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl border border-stone-200/80 p-5 flex flex-col relative shadow-xs">
              <span className="text-emerald-800 font-mono font-bold text-xs tracking-wider mb-2">
                {t.howStep2Num}
              </span>
              <h4 className="font-semibold text-stone-900 text-base mb-1.5">
                {t.howStep2Title}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                {t.howStep2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border border-stone-200/80 p-5 flex flex-col relative shadow-xs">
              <span className="text-emerald-800 font-mono font-bold text-xs tracking-wider mb-2">
                {t.howStep3Num}
              </span>
              <h4 className="font-semibold text-stone-900 text-base mb-1.5">
                {t.howStep3Title}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                {t.howStep3Desc}
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl border border-stone-200/80 p-5 flex flex-col relative shadow-xs">
              <span className="text-emerald-800 font-mono font-bold text-xs tracking-wider mb-2">
                {t.howStep4Num}
              </span>
              <h4 className="font-semibold text-stone-900 text-base mb-1.5">
                {t.howStep4Title}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                {t.howStep4Desc}
              </p>
            </div>
          </div>

          {/* Quick Launch Bottom Bar */}
          <div className="mt-10 p-6 rounded-xl bg-emerald-900 text-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-white text-base">
                {language === 'hi' ? 'फसल की जांच के लिए तैयार हैं?' : 'Ready to inspect your crop?'}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                {language === 'hi'
                  ? 'मोबाइल कैमरे से सीधे फोटो लें या गैलरी से अपलोड करें।'
                  : 'Capture directly via mobile camera or upload from your gallery.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('diagnose')}
              className="px-5 py-2.5 rounded-lg bg-white text-emerald-950 font-medium text-sm hover:bg-emerald-50 transition-colors shadow-xs shrink-0 min-h-[44px]"
            >
              {t.ctaDiagnose}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
