import { useState } from 'react';
import { AppRoute, Language, SavedDiagnosisRecord } from '../types';
import { getTranslation } from '../utils/i18n';
import { DiagnosisHistoryService } from '../services/diagnosisHistoryService';
import {
  ScanSearch,
  BookmarkCheck,
  BellRing,
  ArrowRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Bot,
  TrendingUp,
  X,
  ShieldCheck,
  Info,
  Clock,
  Check,
  HelpCircle,
} from 'lucide-react';

interface DashboardPageProps {
  language: Language;
  onNavigate: (route: AppRoute) => void;
  diagnoses: SavedDiagnosisRecord[];
  onClearHistory: () => void;
  onDeleteRecord?: (id: string) => void;
}

export function DashboardPage({
  language,
  onNavigate,
  diagnoses,
  onClearHistory,
  onDeleteRecord,
}: DashboardPageProps) {
  const t = getTranslation(language);

  // Calculate real application metrics from current diagnosis records
  const { totalScans, savedCrops, recentAlerts, distinctCropList } =
    DiagnosisHistoryService.calculateMetrics(diagnoses);

  // Selected record for full detailed inspection modal
  const [selectedRecord, setSelectedRecord] = useState<SavedDiagnosisRecord | null>(null);

  // Confirm clear history popover state
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-16"
      id="dashboard-page-container"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            {t.dashboardTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600">
            {t.dashboardSub}
          </p>
        </div>

        <button
          onClick={() => onNavigate('diagnose')}
          id="btn-dashboard-diagnose-cta"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 text-white text-xs sm:text-sm font-medium hover:bg-emerald-900 transition-colors shadow-xs min-h-[44px]"
        >
          <ScanSearch className="w-4 h-4 text-emerald-200" />
          <span>{t.btnStartDiagnose}</span>
        </button>
      </div>

      {/* 3 Summary Stat Metrics (Real computed activity values: 0 when new) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8" id="dashboard-stats-grid">
        
        {/* Stat 1: Crop Scans */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t.statCropScans}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ScanSearch className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div className="text-3xl font-bold text-stone-900 font-mono tracking-tight">
            {totalScans}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {totalScans === 0
              ? (language === 'hi' ? 'अभी तक कोई स्कैन नहीं' : 'No scans completed yet')
              : (language === 'hi' ? `${totalScans} पत्ती जांच पूर्ण` : `${totalScans} leaf diagnosis completed`)}
          </p>
        </div>

        {/* Stat 2: Saved Crops */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t.statSavedCrops}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <BookmarkCheck className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div className="text-3xl font-bold text-stone-900 font-mono tracking-tight">
            {savedCrops}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 truncate">
            {savedCrops === 0
              ? (language === 'hi' ? 'कोई फसल सहेजी नहीं' : 'No unique crops recorded')
              : distinctCropList.slice(0, 3).join(', ') + (distinctCropList.length > 3 ? ` +${distinctCropList.length - 3}` : '')}
          </div>
        </div>

        {/* Stat 3: Recent Alerts */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {t.statRecentAlerts}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                recentAlerts > 0
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-stone-50 text-stone-500'
              }`}
            >
              <BellRing className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <div
            className={`text-3xl font-bold font-mono tracking-tight ${
              recentAlerts > 0 ? 'text-amber-800' : 'text-stone-900'
            }`}
          >
            {recentAlerts}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {recentAlerts === 0
              ? (language === 'hi' ? 'कोई सक्रिय चेतावनी नहीं' : 'All clear • No active alerts')
              : (language === 'hi' ? 'रोग / सावधानी की आवश्यकता' : 'Diseases or symptoms flagged')}
          </p>
        </div>

      </div>

      {/* Quick Actions Grid (Direct routes to 3 primary app capabilities) */}
      <div className="mb-8" id="dashboard-quick-actions">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
          {t.quickActionsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Action 1: Diagnose */}
          <button
            onClick={() => onNavigate('diagnose')}
            className="text-left p-4 rounded-xl bg-white border border-stone-200/90 hover:border-emerald-700/60 hover:shadow-xs transition-all flex items-start justify-between group min-h-[44px]"
          >
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-900 flex items-center justify-center mb-2">
                <ScanSearch className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-stone-900 text-sm group-hover:text-emerald-900 transition-colors">
                {t.actionDiagnoseCrop}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.actionDiagnoseDesc}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all mt-1 shrink-0 ml-2" />
          </button>

          {/* Action 2: Assistant */}
          <button
            onClick={() => onNavigate('assistant')}
            className="text-left p-4 rounded-xl bg-white border border-stone-200/90 hover:border-emerald-700/60 hover:shadow-xs transition-all flex items-start justify-between group min-h-[44px]"
          >
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-900 flex items-center justify-center mb-2">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-stone-900 text-sm group-hover:text-emerald-900 transition-colors">
                {t.actionAskAssistant}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.actionAskDesc}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all mt-1 shrink-0 ml-2" />
          </button>

          {/* Action 3: Market */}
          <button
            onClick={() => onNavigate('market')}
            className="text-left p-4 rounded-xl bg-white border border-stone-200/90 hover:border-emerald-700/60 hover:shadow-xs transition-all flex items-start justify-between group min-h-[44px]"
          >
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900 transition-colors">
                {t.actionCheckMarket}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.actionCheckMarketDesc}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all mt-1 shrink-0 ml-2" />
          </button>

        </div>
      </div>

      {/* Recent Diagnoses Section */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden mb-8" id="recent-diagnoses-container">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              {t.recentDiagnosesTitle}
            </h2>
            {diagnoses.length > 0 && (
              <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                {diagnoses.length}
              </span>
            )}
          </div>

          {diagnoses.length > 0 && (
            <div className="relative">
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  title="Clear history"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-700 transition-colors px-2.5 py-1.5 rounded-md hover:bg-stone-50 min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearHistoryBtn}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-700 font-medium hidden sm:inline">
                    {t.confirmClearHistory}
                  </span>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowConfirmClear(false);
                    }}
                    className="text-xs bg-red-700 text-white px-2.5 py-1.5 rounded font-medium hover:bg-red-800 transition-colors min-h-[36px]"
                  >
                    {language === 'hi' ? 'हाँ, हटाएं' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="text-xs text-stone-600 px-2 py-1.5 hover:bg-stone-100 rounded transition-colors min-h-[36px]"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {diagnoses.length === 0 ? (
          /* Clean Empty State */
          <div className="p-8 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3.5">
              <ScanSearch className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1.5">
              {t.noScansYet}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-5 leading-relaxed">
              {t.noScansYetDesc}
            </p>
            <button
              onClick={() => onNavigate('diagnose')}
              id="btn-diagnose-first-crop"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 text-white text-xs sm:text-sm font-medium hover:bg-emerald-900 transition-colors shadow-xs min-h-[44px]"
            >
              <span>{t.btnDiagnoseFirstCrop}</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        ) : (
          /* List of Actual Diagnoses */
          <div className="divide-y divide-stone-100">
            {diagnoses.map((item) => {
              const isAlert = item.isAlert;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-stone-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Thumbnail or letter badge */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.crop}
                        className="w-12 h-12 rounded-lg border border-stone-200 bg-stone-100 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.crop.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-semibold text-stone-900 text-sm truncate">
                          {language === 'hi' && item.cropHi ? item.cropHi : item.crop}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                            !isAlert
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {!isAlert ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>{t.statusHealthy}</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>{t.statusCritical}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-stone-800 line-clamp-1">
                        {item.assessment}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {item.date}
                        </span>
                        <span>•</span>
                        <span>
                          {item.confidenceRange
                            ? item.confidenceRange
                            : `${item.confidence}% ${t.confidenceLabel}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedRecord(item)}
                      className="text-xs font-medium text-emerald-900 hover:text-emerald-950 flex items-center gap-1 px-3 py-1.5 rounded-md border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors min-h-[44px]"
                    >
                      <span>{t.viewDetails}</span>
                      <ExternalLink className="w-3 h-3 text-emerald-700" />
                    </button>

                    {onDeleteRecord && (
                      <button
                        onClick={() => onDeleteRecord(item.id)}
                        title={t.deleteRecord}
                        className="p-2 text-stone-400 hover:text-red-700 rounded-md hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs mb-8" id="recent-activity-section">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
          {t.recentActivityTitle}
        </h2>

        {diagnoses.length === 0 ? (
          <p className="text-xs text-stone-500 py-2">
            {t.noActivityYet}
          </p>
        ) : (
          <div className="space-y-2.5">
            {diagnoses.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="text-xs flex items-center justify-between text-stone-700 py-1.5 border-b border-stone-100 last:border-0"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rec.isAlert ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="font-medium text-stone-900 truncate">
                    {language === 'hi' ? `${rec.crop} की जांच पूर्ण` : `${rec.crop} diagnosis completed`}
                  </span>
                  <span className="text-stone-400 hidden sm:inline">•</span>
                  <span className="text-stone-500 truncate hidden sm:inline">{rec.assessment}</span>
                </div>
                <span className="text-[11px] text-stone-400 shrink-0 ml-2">
                  {rec.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Detailed Diagnosis Inspection Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          id="diagnosis-detail-modal"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-xl p-5 sm:p-7 relative my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {language === 'hi' && selectedRecord.cropHi ? selectedRecord.cropHi : selectedRecord.crop}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border ${
                      !selectedRecord.isAlert
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {!selectedRecord.isAlert ? t.statusHealthy : t.statusCritical}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                  {selectedRecord.assessment}
                </h3>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-5">
              
              {/* Image and metrics header */}
              <div className="flex flex-col sm:flex-row items-start gap-4 bg-stone-50 p-3.5 rounded-lg border border-stone-200/80">
                {selectedRecord.imageUrl && (
                  <img
                    src={selectedRecord.imageUrl}
                    alt={selectedRecord.crop}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-stone-200 bg-white shrink-0"
                  />
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="font-semibold">{t.confidenceLabel}:</span>
                    <span>
                      {selectedRecord.confidenceRange
                        ? selectedRecord.confidenceRange
                        : `${selectedRecord.confidence}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="font-semibold">{language === 'hi' ? 'दिनांक' : 'Date'}:</span>
                    <span>{selectedRecord.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="font-semibold">{language === 'hi' ? 'स्थिति' : 'Condition'}:</span>
                    <span>{selectedRecord.isAlert ? (language === 'hi' ? 'संक्रमण / सावधानी आवश्यक' : 'Attention / Disease flagged') : (language === 'hi' ? 'स्वस्थ पत्ती' : 'Normal / Healthy')}</span>
                  </div>
                </div>
              </div>

              {/* Observed Symptoms */}
              {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{t.observedSymptoms}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedRecord.symptoms.map((sym, idx) => (
                      <li key={idx} className="text-xs text-stone-700 bg-stone-50 p-2 rounded border border-stone-200/70 flex items-start gap-2">
                        <span className="text-stone-400 mt-0.5">•</span>
                        <span>{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {selectedRecord.recommendedActions && selectedRecord.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{t.recommendedNextSteps}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedRecord.recommendedActions.map((act, idx) => (
                      <li key={idx} className="text-xs text-stone-800 bg-emerald-50/50 p-2 rounded border border-emerald-200/70 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prevention Advice */}
              {selectedRecord.prevention && selectedRecord.prevention.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{t.prevention}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedRecord.prevention.map((prev, idx) => (
                      <li key={idx} className="text-xs text-stone-700 bg-stone-50 p-2 rounded border border-stone-200/70 flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>{prev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Warning */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {selectedRecord.warning || t.defaultWarning}
                </p>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    onNavigate('assistant');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 transition-colors min-h-[44px]"
                >
                  <Bot className="w-4 h-4 text-emerald-200" />
                  <span>{t.btnAskAboutCrop}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    onNavigate('diagnose');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-800 text-xs font-medium hover:bg-stone-200 transition-colors min-h-[44px]"
                >
                  <ScanSearch className="w-4 h-4 text-stone-600" />
                  <span>{t.btnInspectAgain}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors min-h-[44px]"
              >
                {t.closeDetail}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
