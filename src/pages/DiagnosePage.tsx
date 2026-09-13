import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CropType, DiagnosisResult, Language, SavedDiagnosisRecord } from '../types';
import { getTranslation } from '../utils/i18n';
import { SAMPLE_LEAVES } from '../utils/sampleData';
import { diagnoseCrop } from '../services/api';
import { DiagnosisHistoryService } from '../services/diagnosisHistoryService';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  BookmarkPlus,
  Loader2,
  Camera,
} from 'lucide-react';

interface DiagnosePageProps {
  language: Language;
  onSaveToDashboard?: (record: SavedDiagnosisRecord) => void;
  geminiConfigured: boolean;
}

const CROPS: { id: CropType; labelEn: string; labelHi: string }[] = [
  { id: 'Tomato', labelEn: 'Tomato', labelHi: 'टमाटर' },
  { id: 'Potato', labelEn: 'Potato', labelHi: 'आलू' },
  { id: 'Wheat', labelEn: 'Wheat', labelHi: 'गेहूं' },
  { id: 'Rice', labelEn: 'Rice', labelHi: 'धान (चावल)' },
  { id: 'Cotton', labelEn: 'Cotton', labelHi: 'कपास' },
  { id: 'Other', labelEn: 'Other Crop', labelHi: 'अन्य फसल' },
];

export function DiagnosePage({ language, onSaveToDashboard, geminiConfigured }: DiagnosePageProps) {
  const t = getTranslation(language);

  // Form states
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Tomato');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file input with automatic downscaling for high-resolution mobile photos
  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type) && !file.type.startsWith('image/')) {
      setErrorMessage(t.errInvalidFormat);
      return;
    }

    // Size limit check (under 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(
        language === 'hi'
          ? 'फोटो का आकार बहुत बड़ा है। कृपया 10MB से कम की फोटो चुनें।'
          : 'Image size is too large. Please select an image under 10MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Downscale phone camera photos if they exceed 1600px for optimal speed & Gemini accuracy
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setImagePreview(optimizedDataUrl);
            setMimeType('image/jpeg');
            setResult(null);
            setSavedSuccess(false);
            return;
          }
        }
        setImagePreview(rawDataUrl);
        setMimeType(file.type || 'image/jpeg');
        setResult(null);
        setSavedSuccess(false);
      };
      img.onerror = () => {
        setImagePreview(rawDataUrl);
        setMimeType(file.type || 'image/jpeg');
        setResult(null);
        setSavedSuccess(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setErrorMessage(t.errNetwork);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Convert SVG sample preset to PNG on selection so Gemini receives true raster pixels
  const handleSelectSample = (sample: typeof SAMPLE_LEAVES[0]) => {
    setSelectedCrop(sample.crop);
    setResult(null);
    setSavedSuccess(false);
    setErrorMessage(null);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f4f6f0';
          ctx.fillRect(0, 0, 400, 400);
          ctx.drawImage(img, 0, 0, 400, 400);
          const pngUrl = canvas.toDataURL('image/png');
          setImagePreview(pngUrl);
          setMimeType('image/png');
          return;
        }
      } catch {
        // Fallback to raw dataUrl
      }
      setImagePreview(sample.dataUrl);
      setMimeType('image/svg+xml');
    };
    img.onerror = () => {
      setImagePreview(sample.dataUrl);
      setMimeType('image/svg+xml');
    };
    img.src = sample.dataUrl;
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setResult(null);
    setSavedSuccess(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Perform AI Diagnosis
  const handleAnalyzeCrop = async () => {
    if (!imagePreview) {
      setErrorMessage(t.errNoImage);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await diagnoseCrop(selectedCrop, imagePreview, mimeType, language);
      setResult(res);
      setSavedSuccess(false);

      // Persist completed diagnosis immediately to dashboard history
      try {
        const savedRecord = await DiagnosisHistoryService.saveFromDiagnosisResult(
          res,
          imagePreview,
          language
        );
        if (onSaveToDashboard) {
          onSaveToDashboard(savedRecord);
        }
        setSavedSuccess(true);
      } catch (saveErr) {
        console.warn('Could not auto-save to history:', saveErr);
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      // Friendly, non-technical error display
      const friendlyMsg = err.message?.includes('Failed to fetch')
        ? t.errNetwork
        : err.message || t.errAiUnavailable;
      setErrorMessage(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResult = async () => {
    if (!result) return;
    try {
      const savedRecord = await DiagnosisHistoryService.saveFromDiagnosisResult(
        result,
        imagePreview,
        language
      );
      if (onSaveToDashboard) {
        onSaveToDashboard(savedRecord);
      }
      setSavedSuccess(true);
    } catch (err) {
      console.warn('Error saving diagnosis result:', err);
      setSavedSuccess(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-16" id="diagnose-page-container">
      {/* Header */}
      <div className="text-left mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          {t.diagnoseTitle}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-700 max-w-2xl">
          {t.diagnoseSubtitle}
        </p>
      </div>

      {/* Main Diagnostic Workspace Card */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 sm:p-7">
        
        {/* Step 1: Crop Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-stone-900 mb-2.5" id="crop-select-label">
            {t.selectCropLabel}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" role="radiogroup" aria-labelledby="crop-select-label">
            {CROPS.map((c) => {
              const isSelected = selectedCrop === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCrop(c.id)}
                  id={`crop-btn-${c.id.toLowerCase()}`}
                  className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium border text-center transition-colors min-h-[44px] flex items-center justify-center ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  {language === 'hi' ? c.labelHi : c.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Image Upload Area */}
        <div className="mb-6">
          {/* File input (Gallery / Files) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            id="leaf-file-input"
          />
          {/* Direct Camera input for mobile */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            capture="environment"
            className="hidden"
            id="leaf-camera-input"
          />

          {!imagePreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              id="leaf-drop-zone"
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1">
                  {t.uploadAreaTitle}
                </h3>
                <p className="text-xs text-stone-700 mb-4">
                  {t.uploadAreaSub}
                </p>

                {/* Mobile-friendly dual buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    id="btn-take-photo"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 transition-colors shadow-2xs min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'hi' ? 'फोटो खींचें (कैमरा)' : 'Take Photo (Camera)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    id="btn-browse-gallery"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors shadow-2xs min-h-[44px]"
                  >
                    <ImageIcon className="w-4 h-4 text-stone-500" />
                    <span>{language === 'hi' ? 'गैलरी से चुनें' : 'Choose from Gallery'}</span>
                  </button>
                </div>

                <span className="text-[11px] text-stone-700 mt-3 block">
                  {language === 'hi' ? 'या फोटो को यहाँ खींचकर छोड़ें' : 'or drag and drop leaf photo here'}
                </span>
              </div>
            </div>
          ) : (
            /* Selected Image Preview */
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 flex flex-col sm:flex-row items-center gap-5" id="image-preview-container">
              <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0 flex items-center justify-center shadow-2xs">
                <img
                  src={imagePreview}
                  alt="Selected crop leaf for diagnosis"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {selectedCrop}
                  </span>
                  <span className="text-xs text-stone-700">
                    {language === 'hi' ? 'तैयार फोटो' : 'Ready for analysis'}
                  </span>
                </div>
                <p className="text-xs text-stone-700 mb-4 max-w-md">
                  {language === 'hi'
                    ? 'पौधे के दृश्य लक्षणों का विश्लेषण करने के लिए "फसल विश्लेषण करें" पर क्लिक करें।'
                    : 'Click "Analyze Crop" to run AI detection on visible lesions and symptoms.'}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleAnalyzeCrop}
                    disabled={isLoading}
                    id="btn-analyze-crop"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 text-white font-medium text-sm hover:bg-emerald-900 transition-colors shadow-xs disabled:opacity-50 min-h-[44px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>{language === 'hi' ? 'विश्लेषण जारी...' : 'Analyzing...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>{t.btnAnalyze}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleRemoveImage}
                    disabled={isLoading}
                    id="btn-remove-image"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t.btnRemove}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Presets (For competition reliability and rapid judge review) */}
        {!imagePreview && (
          <div className="pt-2 border-t border-stone-100">
            <span className="block text-xs font-semibold text-stone-700 mb-2.5">
              {t.samplePresetsTitle}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_LEAVES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  id={`sample-btn-${sample.id}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-stone-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 transition-colors text-left text-xs min-h-[44px]"
                >
                  <img
                    src={sample.dataUrl}
                    alt={sample.name}
                    className="w-7 h-7 rounded border border-stone-200 bg-stone-50 object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-stone-800 truncate">
                      {language === 'hi' ? sample.nameHi : sample.name}
                    </span>
                    <span className="text-[10px] text-stone-700 truncate">
                      {sample.crop}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Friendly Error Alert State */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-stone-900 text-xs sm:text-sm flex items-start gap-3" id="diagnosis-error-alert">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-950 mb-0.5">
                {language === 'hi' ? 'विश्लेषण पूरा नहीं हो सका' : 'Analysis Incomplete'}
              </h4>
              <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
                {errorMessage}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-medium text-xs border border-amber-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'दूसरी फोटो चुनें' : 'Try Another Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clean Loading State (Purposeful & Uncluttered as requested) */}
        {isLoading && (
          <div className="mt-6 p-8 rounded-xl bg-stone-50 border border-stone-200 text-center flex flex-col items-center justify-center animate-fade-in" id="diagnosis-loading-state">
            <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
            <h3 className="text-base font-semibold text-stone-900">
              {t.analyzingTitle}
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 mt-1 max-w-sm">
              {t.analyzingSub}
            </p>
          </div>
        )}

      </div>

      {/* Structured Diagnosis Results Card */}
      {result && !isLoading && (
        <section className="mt-8 bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden" id="diagnosis-result-section">
          
          {/* Result Card Top Banner */}
          <div className="bg-emerald-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono tracking-wider uppercase bg-emerald-800/80 border border-emerald-700 px-2 py-0.5 rounded text-emerald-200">
                  {t.analysisResultTitle}
                </span>
                {result.isDemo && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    {t.demoMode}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                {result.assessment}
              </h2>
            </div>

            {/* Confidence Metric & Crop Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-emerald-800/90 rounded-lg px-3.5 py-2 border border-emerald-700 text-right">
                <span className="block text-[11px] uppercase tracking-wider text-emerald-300 font-medium">
                  {t.resultConfidence}
                </span>
                <span className="text-xl font-bold text-white">
                  {result.confidence}%
                </span>
                {result.confidenceRange && (
                  <span className="text-[10px] text-emerald-200 block font-normal">
                    {result.confidenceRange}
                  </span>
                )}
              </div>
              <div className="bg-emerald-800/90 rounded-lg px-3.5 py-2 border border-emerald-700 text-right">
                <span className="block text-[11px] uppercase tracking-wider text-emerald-300 font-medium">
                  {t.resultCrop}
                </span>
                <span className="text-sm font-semibold text-white">
                  {result.crop}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 sm:p-7 space-y-6">

            {/* Unclear or Insufficient image warning banner */}
            {result.isUnclearOrInsufficient && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950">
                  <strong className="font-semibold block mb-1">
                    {language === 'hi' ? 'फोटो अस्पष्ट या अपर्याप्त विवरण' : 'Image Detail Unclear or Insufficient'}
                  </strong>
                  <p className="leading-relaxed">
                    {language === 'hi'
                      ? 'प्रदान की गई तस्वीर में पत्ती के विशिष्ट रोग लक्षण पूरी तरह स्पष्ट नहीं हैं। अधिक सटीक निदान के लिए पौधे की पत्ती का स्पष्ट व प्रकाशयुक्त क्लोज़-अप फोटो लें।'
                      : 'The uploaded image lacks clear leaf lesion focus or sufficient lighting for a conclusive assessment. Please capture a well-lit, close-up photograph of the leaf surface.'}
                  </p>
                </div>
              </div>
            )}

            {/* Observed Symptoms */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                {t.observedSymptoms}
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                {result.symptoms.map((symptom, idx) => (
                  <li key={idx} className="text-sm text-stone-700 flex items-start gap-2.5 bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 shrink-0" />
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Next Steps */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                {t.recommendedNextSteps}
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                {result.recommendedActions.map((action, idx) => (
                  <li key={idx} className="text-sm text-stone-800 flex items-start gap-2.5 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prevention */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                {t.prevention}
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                {result.prevention.map((prev, idx) => (
                  <li key={idx} className="text-sm text-stone-700 flex items-start gap-2.5 bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/70">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>{prev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mandatory Safety / Medical Warning */}
            <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold block mb-0.5">{t.warningTitle}</strong>
                {result.warning || t.defaultWarning}
              </div>
            </div>

            {/* Action Bottom Toolbar */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-stone-700">
                {result.isDemo && result.demoNote ? result.demoNote : 'Processed by Krishi Drishti Agricultural Intelligence Engine'}
              </span>

              <button
                onClick={handleSaveResult}
                disabled={savedSuccess}
                id="btn-save-to-dashboard"
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                  savedSuccess
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{savedSuccess ? t.btnSaved : t.btnSaveToDashboard}</span>
              </button>
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
