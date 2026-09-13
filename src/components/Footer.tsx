import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { LeafEyeLogo } from './LeafEyeLogo';

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  const t = getTranslation(language);

  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100/70 py-10 px-4 sm:px-6 text-stone-700 text-sm" id="app-footer">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
          <LeafEyeLogo size="sm" showText={true} tagline={true} />
          <p className="text-xs text-stone-700 max-w-sm mt-1">
            {t.shortDesc}
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 text-xs text-stone-700">
          <span className="font-medium text-stone-700">{t.footerCredits}</span>
          <span>{t.footerNote}</span>
          <span className="text-[11px] text-stone-600 mt-1">
            {language === 'hi' 
              ? 'प्रारंभिक मूल्यांकन • किसी भी रासायनिक उपचार से पूर्व विशेषज्ञ सत्यापन अनुशंसित' 
              : 'Preliminary Assessment Tool • Verify with local agricultural experts before treatment'}
          </span>
        </div>
      </div>
    </footer>
  );
}
