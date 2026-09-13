import { DiagnosisResult, Language, SavedDiagnosisRecord } from '../types';

const STORAGE_KEY = 'krishi_drishti_history';
const MAX_STORED_RECORDS = 30;

/**
 * Checks if a diagnosis indicates an alert condition (disease, severe pest, warning, or inspection required)
 * versus a normal healthy crop state.
 */
export function isDiagnosisAlert(assessment: string, status?: string, symptoms?: string[]): boolean {
  const lower = (assessment || '').toLowerCase();

  // Explicit healthy signals
  const isExplicitlyHealthy =
    lower.includes('healthy') ||
    lower.includes('स्वस्थ') ||
    lower.includes('no disease') ||
    lower.includes('normal foliage') ||
    lower.includes('सामान्य') ||
    lower.includes('रोगमुक्त') ||
    lower.includes('no visible disease');

  if (isExplicitlyHealthy) {
    return false;
  }

  // Explicit disease / symptom / infection signals
  const hasDiseaseSignals =
    lower.includes('blight') ||
    lower.includes('rust') ||
    lower.includes('rot') ||
    lower.includes('wilt') ||
    lower.includes('spot') ||
    lower.includes('mildew') ||
    lower.includes('virus') ||
    lower.includes('pest') ||
    lower.includes('lesion') ||
    lower.includes('curl') ||
    lower.includes('canker') ||
    lower.includes('smut') ||
    lower.includes('infestation') ||
    lower.includes('deficiency') ||
    lower.includes('fungal') ||
    lower.includes('bacterial') ||
    lower.includes('caterpillar') ||
    lower.includes('borer') ||
    lower.includes('झुलसा') ||
    lower.includes('रतुआ') ||
    lower.includes('सड़न') ||
    lower.includes('धब्बा') ||
    lower.includes('धब्बे') ||
    lower.includes('कीट') ||
    lower.includes('फफूंद') ||
    lower.includes('रोग') ||
    lower.includes('संक्रमण');

  if (hasDiseaseSignals) {
    return true;
  }

  if (status === 'critical' || status === 'moderate') {
    return true;
  }

  if (symptoms && symptoms.length > 0 && !isExplicitlyHealthy) {
    return true;
  }

  return false;
}

/**
 * Creates an optimized tiny thumbnail to avoid hitting browser localStorage limits (5MB).
 */
export async function createThumbnail(dataUrl?: string | null, maxDim = 100): Promise<string | undefined> {
  if (!dataUrl) return undefined;

  // SVG strings or already small data URLs (< 6KB) can be stored as-is
  if (dataUrl.startsWith('data:image/svg') || dataUrl.length < 6000) {
    return dataUrl;
  }

  // In browser environment, use an off-screen canvas to downsample photos to tiny thumbnails
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL('image/jpeg', 0.65);
            resolve(thumb);
            return;
          }
        } catch {
          // If canvas operations fail, resolve empty or original if small
        }
        resolve(undefined);
      };
      img.onerror = () => resolve(undefined);
      img.src = dataUrl;
    });
  }

  return undefined;
}

/**
 * Diagnosis History Service
 * Provides client-side local persistence, metrics computation, and safe parsing.
 */
export class DiagnosisHistoryService {
  /**
   * Retrieves all saved diagnosis records from localStorage.
   * If corrupted or missing, safely resets and returns empty array without throwing.
   */
  public static getHistory(): SavedDiagnosisRecord[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn('Invalid diagnosis history format in localStorage. Resetting.');
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      // Validate and sanitize each item
      const validRecords: SavedDiagnosisRecord[] = [];
      for (const item of parsed) {
        if (item && typeof item === 'object' && item.id && item.crop && item.assessment) {
          const isAlert = typeof item.isAlert === 'boolean'
            ? item.isAlert
            : isDiagnosisAlert(item.assessment, item.status, item.symptoms);

          validRecords.push({
            id: String(item.id),
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
            crop: String(item.crop),
            cropHi: item.cropHi ? String(item.cropHi) : undefined,
            assessment: String(item.assessment),
            confidence: typeof item.confidence === 'number' ? item.confidence : 85,
            confidenceRange: item.confidenceRange ? String(item.confidenceRange) : undefined,
            date: String(item.date || 'Today'),
            imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
            status: item.status === 'healthy' || item.status === 'critical' || item.status === 'moderate'
              ? item.status
              : (isAlert ? 'critical' : 'healthy'),
            isAlert,
            symptoms: Array.isArray(item.symptoms) ? item.symptoms : undefined,
            recommendedActions: Array.isArray(item.recommendedActions) ? item.recommendedActions : undefined,
            prevention: Array.isArray(item.prevention) ? item.prevention : undefined,
            warning: item.warning ? String(item.warning) : undefined,
            isUnclearOrInsufficient: Boolean(item.isUnclearOrInsufficient),
          });
        }
      }

      return validRecords;
    } catch (err) {
      console.warn('Error reading diagnosis history from localStorage:', err);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return [];
    }
  }

  /**
   * Saves a full list of records into localStorage with safety checks.
   */
  private static setHistory(records: SavedDiagnosisRecord[]): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const slice = records.slice(0, MAX_STORED_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
    } catch (err) {
      console.warn('Could not save diagnosis history to localStorage (quota or storage disabled):', err);
      // If quota exceeded, try saving without image URLs
      try {
        const minimalRecords = records.slice(0, 15).map((r) => ({
          ...r,
          imageUrl: undefined,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalRecords));
      } catch {
        // ignore secondary failure
      }
    }
  }

  /**
   * Adds an already-formed record to history.
   */
  public static addRecord(record: SavedDiagnosisRecord): SavedDiagnosisRecord[] {
    const current = this.getHistory();
    // Prepend new record, ensure unique ID
    const filtered = current.filter((r) => r.id !== record.id);
    const updated = [record, ...filtered];
    this.setHistory(updated);
    return updated;
  }

  /**
   * Converts a successful DiagnosisResult into a persistent SavedDiagnosisRecord.
   */
  public static async saveFromDiagnosisResult(
    result: DiagnosisResult,
    imagePreview?: string | null,
    language: Language = 'en'
  ): Promise<SavedDiagnosisRecord> {
    const isAlert = isDiagnosisAlert(result.assessment, undefined, result.symptoms);
    
    // Status calculation
    let status: 'critical' | 'moderate' | 'healthy' = 'healthy';
    if (isAlert) {
      status = result.confidence >= 85 ? 'critical' : 'moderate';
    } else {
      status = 'healthy';
    }

    // Format readable date
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateString = `${dateFormatted}, ${timeFormatted}`;

    // Generate thumbnail safely
    const thumb = await createThumbnail(imagePreview, 110);

    const record: SavedDiagnosisRecord = {
      id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      crop: result.crop,
      cropHi: language === 'hi' ? result.crop : undefined,
      assessment: result.assessment,
      confidence: result.confidence || 85,
      confidenceRange: result.confidenceRange,
      date: fullDateString,
      imageUrl: thumb,
      status,
      isAlert,
      symptoms: result.symptoms || result.observedSymptoms,
      recommendedActions: result.recommendedActions || result.recommendedNextSteps,
      prevention: result.prevention || result.preventionGuidance,
      warning: result.warning || result.uncertaintyWarning,
      isUnclearOrInsufficient: result.isUnclearOrInsufficient,
    };

    this.addRecord(record);
    return record;
  }

  /**
   * Calculates actual application metrics directly from the diagnosis records.
   * For empty history: Crop Scans = 0, Saved Crops = 0, Recent Alerts = 0.
   */
  public static calculateMetrics(records: SavedDiagnosisRecord[]): {
    totalScans: number;
    savedCrops: number;
    recentAlerts: number;
    distinctCropList: string[];
  } {
    const totalScans = records.length;

    // Distinct crops
    const cropMap = new Map<string, string>();
    for (const r of records) {
      const normalized = (r.crop || '').trim().toLowerCase();
      if (normalized && !cropMap.has(normalized)) {
        cropMap.set(normalized, r.crop);
      }
    }
    const distinctCropList = Array.from(cropMap.values());
    const savedCrops = distinctCropList.length;

    // Recent alerts: diagnoses indicating possible disease, symptoms, or warnings
    const recentAlerts = records.filter((r) => r.isAlert).length;

    return {
      totalScans,
      savedCrops,
      recentAlerts,
      distinctCropList,
    };
  }

  /**
   * Clears all saved diagnosis records.
   */
  public static clearHistory(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Deletes a single record by id.
   */
  public static deleteRecord(id: string): SavedDiagnosisRecord[] {
    const current = this.getHistory();
    const updated = current.filter((r) => r.id !== id);
    this.setHistory(updated);
    return updated;
  }
}
