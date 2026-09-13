import { useState, useEffect } from 'react';
import { AppRoute, Language, SavedDiagnosisRecord } from './types';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DiagnosePage } from './pages/DiagnosePage';
import { AssistantPage } from './pages/AssistantPage';
import { MarketPage } from './pages/MarketPage';
import { DashboardPage } from './pages/DashboardPage';
import { checkBackendHealth } from './services/api';
import { DiagnosisHistoryService } from './services/diagnosisHistoryService';

export default function App() {
  // Language state (defaults to English, can toggle to Hindi)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('krishi_drishti_lang');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  // Current Route state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');

  // Backend & Gemini health status
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  // Real saved diagnosis records for Dashboard (starts at empty [] for new users)
  const [diagnoses, setDiagnoses] = useState<SavedDiagnosisRecord[]>(() => {
    return DiagnosisHistoryService.getHistory();
  });

  // Persist language
  const handleLanguageToggle = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('krishi_drishti_lang', newLang);
    } catch {
      // ignore
    }
  };

  // Route changer (scrolls to top smoothly)
  const handleRouteChange = (route: AppRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check backend Gemini status on mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setGeminiConfigured(res.geminiConfigured);
    });
  }, []);

  // Handle saving new diagnosis to dashboard history
  const handleSaveToDashboard = (record: SavedDiagnosisRecord) => {
    setDiagnoses((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      return exists ? prev : [record, ...prev];
    });
  };

  // Clear all saved diagnoses
  const handleClearHistory = () => {
    DiagnosisHistoryService.clearHistory();
    setDiagnoses([]);
  };

  // Delete an individual record
  const handleDeleteRecord = (id: string) => {
    const updated = DiagnosisHistoryService.deleteRecord(id);
    setDiagnoses(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-stone-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        geminiConfigured={geminiConfigured}
      />

      {/* Main Route Content */}
      <main className="flex-1 flex flex-col" id="main-content-viewport">
        {currentRoute === 'home' && (
          <HomePage onNavigate={handleRouteChange} language={language} />
        )}
        {currentRoute === 'diagnose' && (
          <DiagnosePage
            language={language}
            onSaveToDashboard={handleSaveToDashboard}
            geminiConfigured={geminiConfigured}
          />
        )}
        {currentRoute === 'assistant' && (
          <AssistantPage
            language={language}
            onLanguageToggle={handleLanguageToggle}
            geminiConfigured={geminiConfigured}
          />
        )}
        {currentRoute === 'market' && (
          <MarketPage language={language} />
        )}
        {currentRoute === 'dashboard' && (
          <DashboardPage
            language={language}
            onNavigate={handleRouteChange}
            diagnoses={diagnoses}
            onClearHistory={handleClearHistory}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* Footer */}
      <Footer language={language} />

      {/* Mobile Bottom Navigation (Visible on mobile/tablets < 768px) */}
      <MobileNav
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        language={language}
      />
    </div>
  );
}
