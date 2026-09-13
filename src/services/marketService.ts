import { CropItem, StateLocation, DistrictLocation, MarketPriceRecord, MarketFilter } from '../types/market';
import { SUPPORTED_CROPS, SUPPORTED_LOCATIONS, DEMO_MARKET_RECORDS } from '../data/marketData';

/**
 * ============================================================================
 * KRISHI DRISHTI — MARKET INFORMATION SERVICE LAYER
 * ============================================================================
 * 
 * FUTURE VERIFIED LIVE MARKET DATA INTEGRATION:
 * ----------------------------------------------------------------------------
 * This service provides an abstracted interface for retrieving agricultural mandi
 * prices across India.
 * 
 * In this Phase 3 MVP, it queries structured, verified demonstration data (`isDemo: true`)
 * clearly labelled to ensure transparency with farmers.
 * 
 * To integrate live mandi prices in production:
 * 1. Official Source:
 *    Connect to the Government of India's Open Government Data (OGD) Platform
 *    (data.gov.in) — specifically the "Daily Mandi Price / Agmarknet" API or
 *    the electronic National Agriculture Market (eNAM - enam.gov.in) API.
 * 
 * 2. Secure Server Proxy:
 *    Implement an Express server endpoint (e.g. `/api/market/prices`) that stores
 *    the official API key securely on the backend (`process.env.AGMARKNET_API_KEY`),
 *    fetches live commodity prices, and caches responses in Redis/Memory for 15-30
 *    minutes to prevent hitting rate limits during peak morning trading hours.
 * 
 * 3. Graceful Fallback:
 *    If the live government gateway experiences downtime or latency, the service
 *    can gracefully fall back to cached records with an explicit notice, or indicate
 *    connection status.
 * 
 * 4. Transparent Badging:
 *    Only when connected to an authenticated, verified official source should the
 *    `isDemo` flag be set to `false`.
 * ============================================================================
 */

export class MarketService {
  /**
   * Retrieves all supported agricultural crops
   */
  public static async getCrops(): Promise<CropItem[]> {
    return [...SUPPORTED_CROPS];
  }

  /**
   * Retrieves all supported states
   */
  public static async getStates(): Promise<StateLocation[]> {
    return [...SUPPORTED_LOCATIONS];
  }

  /**
   * Retrieves districts for a specific state
   */
  public static async getDistrictsByState(stateId: string): Promise<DistrictLocation[]> {
    if (!stateId || stateId === 'all') {
      return [];
    }
    const state = SUPPORTED_LOCATIONS.find((s) => s.id === stateId);
    return state ? [...state.districts] : [];
  }

  /**
   * Queries market price records based on user filters.
   * Currently retrieves demo records, but adheres strictly to the contract
   * needed for future live API integration.
   */
  public static async queryMarketPrices(filter: MarketFilter): Promise<{
    records: MarketPriceRecord[];
    isDemo: boolean;
    lastFetched: string;
  }> {
    // Simulate a brief, natural asynchronous lookup
    await new Promise((resolve) => setTimeout(resolve, 80));

    let results = [...DEMO_MARKET_RECORDS];

    // Filter by crop
    if (filter.cropId && filter.cropId !== 'all') {
      results = results.filter((r) => r.cropId === filter.cropId);
    }

    // Filter by state
    if (filter.stateId && filter.stateId !== 'all') {
      results = results.filter((r) => r.stateId === filter.stateId);
    }

    // Filter by district / market
    if (filter.districtId && filter.districtId !== 'all') {
      results = results.filter((r) => r.districtId === filter.districtId);
    }

    return {
      records: results,
      isDemo: true, // Always true for prototype demo data
      lastFetched: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
