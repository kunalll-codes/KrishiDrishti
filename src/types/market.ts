export type PriceTrend = 'increasing' | 'stable' | 'decreasing';

export interface CropItem {
  id: string;
  nameEn: string;
  nameHi: string;
  category: 'cereal' | 'vegetable' | 'cash_crop' | 'oilseed' | 'pulse';
}

export interface MarketLocation {
  id: string;
  nameEn: string;
  nameHi: string;
}

export interface DistrictLocation {
  id: string;
  stateId: string;
  nameEn: string;
  nameHi: string;
  markets: MarketLocation[];
}

export interface StateLocation {
  id: string;
  nameEn: string;
  nameHi: string;
  districts: DistrictLocation[];
}

export interface MarketPriceRecord {
  id: string;
  cropId: string;
  cropNameEn: string;
  cropNameHi: string;
  stateId: string;
  stateNameEn: string;
  stateNameHi: string;
  districtId: string;
  districtNameEn: string;
  districtNameHi: string;
  marketNameEn: string;
  marketNameHi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unitEn: string;
  unitHi: string;
  trend: PriceTrend;
  lastUpdatedEn: string;
  lastUpdatedHi: string;
  isDemo: boolean;
}

export interface MarketFilter {
  cropId: string; // 'all' or specific crop id
  stateId: string; // 'all' or specific state id
  districtId: string; // 'all' or specific district id
}
