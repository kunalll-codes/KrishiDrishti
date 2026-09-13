import { AppRoute, Language } from '../types';
import { Home, ScanSearch, MessageSquare, TrendingUp, LayoutDashboard } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface MobileNavProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  language: Language;
}

export function MobileNav({ currentRoute, onRouteChange, language }: MobileNavProps) {
  const t = getTranslation(language);

  const navItems = [
    { id: 'home' as AppRoute, label: t.navHome, icon: Home },
    { id: 'diagnose' as AppRoute, label: t.navDiagnose, icon: ScanSearch },
    { id: 'assistant' as AppRoute, label: language === 'hi' ? 'सहायक' : 'Assistant', icon: MessageSquare },
    { id: 'market' as AppRoute, label: t.navMarket, icon: TrendingUp },
    { id: 'dashboard' as AppRoute, label: t.navDashboard, icon: LayoutDashboard },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-50/98 border-t border-stone-200 pb-safe shadow-xs backdrop-blur-xs"
      aria-label="Mobile Bottom Navigation"
      id="mobile-bottom-nav"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              id={`mobile-nav-${item.id}`}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                isActive ? 'text-emerald-900 font-semibold' : 'text-stone-700 hover:text-stone-800'
              }`}
            >
              <div className={`relative p-1 rounded-md transition-transform ${isActive ? 'bg-emerald-900/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
