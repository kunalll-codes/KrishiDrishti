export type Language = 'en' | 'hi';

export type AppRoute = 'home' | 'diagnose' | 'assistant' | 'market' | 'dashboard';

export type CropType = 'Tomato' | 'Potato' | 'Wheat' | 'Rice' | 'Cotton' | 'Other';

export interface DiagnosisResult {
  crop: string;
  assessment: string;
  confidence: number;
  confidenceRange?: string;
  symptoms: string[];
  observedSymptoms?: string[];
  recommendedActions: string[];
  recommendedNextSteps?: string[];
  prevention: string[];
  preventionGuidance?: string[];
  warning: string;
  uncertaintyWarning?: string;
  isUnclearOrInsufficient?: boolean;
  unclearReason?: string;
  isDemo?: boolean;
  demoNote?: string;
  timestamp?: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isDemo?: boolean;
  isStreaming?: boolean;
}

export interface MarketItem {
  id: string;
  crop: string;
  cropHi: string;
  market: string;
  marketHi: string;
  state: string;
  price: string;
  priceNumeric: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  updated: string;
  updatedHi: string;
}

export interface SavedDiagnosisRecord {
  id: string;
  timestamp: number;
  crop: string;
  cropHi?: string;
  assessment: string;
  confidence: number;
  confidenceRange?: string;
  date: string;
  imageUrl?: string;
  status: 'critical' | 'moderate' | 'healthy';
  isAlert: boolean;
  symptoms?: string[];
  recommendedActions?: string[];
  prevention?: string[];
  warning?: string;
  isUnclearOrInsufficient?: boolean;
}

export interface SampleLeaf {
  id: string;
  name: string;
  nameHi: string;
  crop: CropType;
  condition: string;
  conditionHi: string;
  dataUrl: string; // inline SVG data URL for fast competition testing
}
