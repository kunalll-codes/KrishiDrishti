import { useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { CropItem, StateLocation, DistrictLocation, MarketPriceRecord, PriceTrend } from '../types/market';
import { MarketService } from '../services/marketService';
import { getTranslation } from '../utils/i18n';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw,
  MapPin,
  Sprout,
  Building2,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface MarketPageProps {
  language: Language;
}

export function MarketPage({ language }: MarketPageProps) {
  const t = getTranslation(language);

  // Filter States
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Directory Data
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [states, setStates] = useState<StateLocation[]>([]);
  const [districts, setDistricts] = useState<DistrictLocation[]>([]);

  // Results State
  const [records, setRecords] = useState<MarketPriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<string>('');

  // Initial load of master datasets
  useEffect(() => {
    let isMounted = true;
    Promise.all([MarketService.getCrops(), MarketService.getStates()]).then(([cropsData, statesData]) => {
      if (!isMounted) return;
      setCrops(cropsData);
      setStates(statesData);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update district options when selectedState changes
  useEffect(() => {
    let isMounted = true;
    if (selectedState && selectedState !== 'all') {
      MarketService.getDistrictsByState(selectedState).then((districtsData) => {
        if (!isMounted) return;
        setDistricts(districtsData);
        // If current selectedDistrict does not exist in new state, reset it
        if (selectedDistrict !== 'all' && !districtsData.some((d) => d.id === selectedDistrict)) {
          setSelectedDistrict('all');
        }
      });
    } else {
      setDistricts([]);
      setSelectedDistrict('all');
    }
    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Query market prices whenever filters change
  const fetchPrices = useCallback(async (cropId: string, stateId: string, districtId: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await MarketService.queryMarketPrices({
        cropId,
        stateId,
        districtId,
      });
      setRecords(response.records);
      setLastFetched(response.lastFetched);
    } catch (err) {
      console.error('Error fetching market prices:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(selectedCrop, selectedState, selectedDistrict);
  }, [selectedCrop, selectedState, selectedDistrict, fetchPrices]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPrices(selectedCrop, selectedState, selectedDistrict, true);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCrop('all');
    setSelectedState('all');
    setSelectedDistrict('all');
  };

  // Preset shortcut for testing
  const applyPreset = (cropId: string, stateId: string, districtId: string) => {
    setSelectedCrop(cropId);
    setSelectedState(stateId);
    setSelectedDistrict(districtId);
  };

  // Check if a single specific crop + specific location is uniquely selected for the Summary card
  const summaryRecord = useMemo(() => {
    if (records.length === 1) {
      return records[0];
    }
    if (selectedCrop !== 'all' && selectedDistrict !== 'all' && records.length > 0) {
      return records[0];
    }
    return null;
  }, [records, selectedCrop, selectedDistrict]);

  // Trend Badge Helper
  const renderTrendBadge = (trend: PriceTrend, compact = false) => {
    let icon = <Minus className="w-3.5 h-3.5" />;
    let text = t.trendStable;
    let style = 'bg-stone-100 text-stone-700 border-stone-200';

    if (trend === 'increasing') {
      icon = <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />;
      text = t.trendIncreasing;
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (trend === 'decreasing') {
      icon = <TrendingDown className="w-3.5 h-3.5 text-amber-800" />;
      text = t.trendDecreasing;
      style = 'bg-amber-50 text-amber-900 border-amber-200';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}
        title={`${t.demoTrendLabel}: ${text}`}
      >
        {icon}
        <span className="whitespace-nowrap">
          {compact ? text : `${t.demoTrendLabel}: ${text}`}
        </span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10 pb-24 md:pb-16" id="market-page-container">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {t.marketTitle}
            </h1>
            {/* Highly Visible DEMO DATA Badge as required */}
            <span
              id="demo-data-badge"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300"
            >
              <AlertCircle className="w-3 h-3" />
              {t.demoDataBadge}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-700 max-w-xl">
            {t.marketSubtitle}
          </p>
        </div>

        {/* Refresh Action */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs min-h-[44px]"
          aria-label="Refresh market prices"
          id="btn-refresh-market"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : 'text-stone-500'}`} />
          <span>
            {isRefreshing
              ? language === 'hi'
                ? 'अद्यतन...'
                : 'Updating...'
              : language === 'hi'
              ? 'ताज़ा करें'
              : 'Refresh'}
          </span>
        </button>
      </div>

      {/* Mandatory Demo Data Notice Banner */}
      <div
        id="demo-data-notice-banner"
        className="mb-6 p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm leading-relaxed"
      >
        <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold uppercase tracking-wider text-[11px] block text-amber-950 sm:inline sm:mr-1">
            [{t.demoDataBadge}]
          </span>
          <span>{t.demoDataNotice}</span>
        </div>
      </div>

      {/* Filters Toolbar Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 sm:p-5 mb-6" id="market-filter-card">
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-stone-100">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-800" />
            {language === 'hi' ? 'मंडी फ़िल्टर' : 'Filter Mandi Results'}
          </span>
          {(selectedCrop !== 'all' || selectedState !== 'all' || selectedDistrict !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 font-medium transition-colors"
              id="btn-reset-filters"
            >
              <RotateCcw className="w-3 h-3" />
              {t.resetFilters}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="select-crop">
              {t.filterByCrop}
            </label>
            <div className="relative">
              <select
                id="select-crop"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700 min-h-[44px]"
              >
                <option value="all">{t.allCrops}</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'hi' ? c.nameHi : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. State Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="select-state">
              {t.filterByState}
            </label>
            <div className="relative">
              <select
                id="select-state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700 min-h-[44px]"
              >
                <option value="all">{t.allStates}</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {language === 'hi' ? s.nameHi : s.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. District / Mandi Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="select-district">
              {t.filterByDistrict}
            </label>
            <div className="relative">
              <select
                id="select-district"
                value={selectedDistrict}
                disabled={selectedState === 'all'}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed min-h-[44px]"
              >
                <option value="all">{t.allDistricts}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'hi' ? d.nameHi : d.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Test Shortcuts / Presets */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-stone-500 font-medium">
            {language === 'hi' ? 'त्वरित जांच:' : 'Quick shortcuts:'}
          </span>
          <button
            onClick={() => applyPreset('rice', 'rajasthan', 'jaipur')}
            className="text-[11px] px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            {language === 'hi' ? 'धान • जयपुर' : 'Rice • Jaipur'}
          </button>
          <button
            onClick={() => applyPreset('wheat', 'rajasthan', 'kota')}
            className="text-[11px] px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            {language === 'hi' ? 'गेहूं • कोटा' : 'Wheat • Kota'}
          </button>
          <button
            onClick={() => applyPreset('tomato', 'rajasthan', 'jaipur')}
            className="text-[11px] px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            {language === 'hi' ? 'टमाटर • जयपुर' : 'Tomato • Jaipur'}
          </button>
          <button
            onClick={() => applyPreset('potato', 'uttar-pradesh', 'agra')}
            className="text-[11px] px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            {language === 'hi' ? 'आलू • आगरा' : 'Potato • Agra'}
          </button>
        </div>
      </div>

      {/* Clean Summary Section (When specific crop and market match) */}
      {summaryRecord && !isLoading && (
        <div
          id="market-summary-section"
          className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 sm:p-5 mb-6"
        >
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stone-100">
            <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              {t.summaryTitle}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
              {t.demoMarketDataTag}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Selected Crop */}
            <div>
              <div className="text-xs text-stone-500 font-medium">
                {t.selectedCropLabel}
              </div>
              <div className="mt-0.5 text-base font-bold text-stone-900 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                {language === 'hi' ? summaryRecord.cropNameHi : summaryRecord.cropNameEn}
              </div>
            </div>

            {/* Market / Mandi */}
            <div>
              <div className="text-xs text-stone-500 font-medium">
                {t.selectedMarketLabel}
              </div>
              <div className="mt-0.5 text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-stone-600" />
                {language === 'hi' ? summaryRecord.marketNameHi : summaryRecord.marketNameEn}
              </div>
              <div className="text-[11px] text-stone-500">
                {language === 'hi' ? summaryRecord.stateNameHi : summaryRecord.stateNameEn}
              </div>
            </div>

            {/* Current Demo Modal Price */}
            <div>
              <div className="text-xs text-stone-500 font-medium">
                {t.currentDemoModalPrice}
              </div>
              <div className="mt-0.5 text-xl font-bold text-emerald-900 font-mono">
                ₹{summaryRecord.modalPrice.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-stone-500">
                {language === 'hi' ? summaryRecord.unitHi : summaryRecord.unitEn}
              </div>
            </div>

            {/* Price Range & Demo Trend */}
            <div>
              <div className="text-xs text-stone-500 font-medium">
                {t.colPriceRange}
              </div>
              <div className="mt-0.5 text-sm font-bold text-stone-800 font-mono">
                ₹{summaryRecord.minPrice.toLocaleString('en-IN')} – ₹{summaryRecord.maxPrice.toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5">
                {renderTrendBadge(summaryRecord.trend)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center" id="market-loading">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-700 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-stone-700">
            {language === 'hi' ? 'मंडी भाव लोड हो रहे हैं...' : 'Loading demo market prices...'}
          </p>
        </div>
      ) : records.length === 0 ? (
        /* Empty / No Data State as mandated in Section 6 & 10 */
        <div
          id="no-demo-data-state"
          className="bg-white rounded-xl border border-dashed border-stone-300 p-8 sm:p-10 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-500">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">
            {t.noDataTitle}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-5 leading-relaxed">
            {t.noDataSub}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={() => applyPreset('rice', 'rajasthan', 'jaipur')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {language === 'hi' ? 'धान (जयपुर मंडी)' : 'Rice (Jaipur Mandi)'}
            </button>
            <button
              onClick={() => applyPreset('wheat', 'rajasthan', 'kota')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {language === 'hi' ? 'गेहूं (कोटा मंडी)' : 'Wheat (Kota Mandi)'}
            </button>
            <button
              onClick={() => applyPreset('tomato', 'rajasthan', 'jaipur')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {language === 'hi' ? 'टमाटर (जयपुर मंडी)' : 'Tomato (Jaipur Mandi)'}
            </button>
            <button
              onClick={() => applyPreset('potato', 'uttar-pradesh', 'agra')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {language === 'hi' ? 'आलू (आगरा मंडी)' : 'Potato (Agra Mandi)'}
            </button>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden" id="market-results-container">
          
          {/* Section Header */}
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <span>{language === 'hi' ? 'मंडी परिणाम' : 'Market Records'}</span>
              <span className="text-stone-500 font-normal">({records.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                {t.colUpdated}: {lastFetched || records[0]?.lastUpdatedEn}
              </span>
            </div>
          </div>

          {/* Mobile View: Readable Cards (Section 7: no horizontal scroll) */}
          <div className="block sm:hidden divide-y divide-stone-100" id="market-mobile-cards">
            {records.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      {language === 'hi' ? item.cropNameHi : item.cropNameEn}
                    </div>
                    <div className="text-xs text-stone-700 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>
                        {language === 'hi' ? item.marketNameHi : item.marketNameEn},{' '}
                        {language === 'hi' ? item.stateNameHi : item.stateNameEn}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {t.demoMarketDataTag}
                  </span>
                </div>

                <div className="bg-stone-50 rounded-lg p-3 grid grid-cols-2 gap-2 border border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block font-medium">
                      {t.colPrice}
                    </span>
                    <span className="text-base font-bold text-emerald-900 font-mono">
                      ₹{item.modalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      {language === 'hi' ? item.unitHi : item.unitEn}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-500 block font-medium">
                      {t.colPriceRange}
                    </span>
                    <span className="text-xs font-semibold text-stone-800 font-mono">
                      ₹{item.minPrice.toLocaleString('en-IN')} – ₹{item.maxPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      {language === 'hi' ? 'न्यूनतम - अधिकतम' : 'Min - Max'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div>{renderTrendBadge(item.trend)}</div>
                  <div className="text-[11px] text-stone-500">
                    {language === 'hi' ? item.lastUpdatedHi : item.lastUpdatedEn}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet View: Structured Table */}
          <div className="hidden sm:block overflow-x-auto" id="market-desktop-table">
            <table className="w-full text-left text-sm" id="mandi-price-table">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.colCrop}</th>
                  <th className="py-3 px-4">{t.colMarket}</th>
                  <th className="py-3 px-4">{t.colPriceRange}</th>
                  <th className="py-3 px-4">{t.colPrice}</th>
                  <th className="py-3 px-4">{t.colTrend}</th>
                  <th className="py-3 px-4 text-right">{t.colUpdated}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {records.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/75 transition-colors">
                    {/* Crop */}
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{language === 'hi' ? item.cropNameHi : item.cropNameEn}</span>
                      </div>
                    </td>

                    {/* Market / Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {language === 'hi' ? item.marketNameHi : item.marketNameEn}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>
                          {language === 'hi' ? item.districtNameHi : item.districtNameEn},{' '}
                          {language === 'hi' ? item.stateNameHi : item.stateNameEn}
                        </span>
                      </div>
                    </td>

                    {/* Price Range */}
                    <td className="py-3.5 px-4 font-mono font-medium text-stone-700">
                      ₹{item.minPrice.toLocaleString('en-IN')} – ₹{item.maxPrice.toLocaleString('en-IN')}
                    </td>

                    {/* Modal Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-base text-emerald-900 font-mono">
                        ₹{item.modalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {language === 'hi' ? item.unitHi : item.unitEn}
                      </div>
                    </td>

                    {/* Demo Trend */}
                    <td className="py-3.5 px-4">
                      {renderTrendBadge(item.trend, true)}
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs text-stone-600 block">
                        {language === 'hi' ? item.lastUpdatedHi : item.lastUpdatedEn}
                      </span>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t.demoMarketDataTag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Mandatory Disclaimer Footer Note */}
      <div className="mt-6 p-4 rounded-xl bg-stone-100/90 border border-stone-200 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-700 leading-relaxed">
          <strong className="text-stone-900 font-semibold">
            {language === 'hi' ? 'पारदर्शिता एवं सूचना:' : 'Transparency Note:'}{' '}
          </strong>
          {t.marketDisclaimer}
        </div>
      </div>

    </div>
  );
}
