import { supabase } from '../lib/supabase';
import type { PricingRule } from '../lib/supabase';

// Cache for pricing rules (refresh every 5 minutes)
let pricingCache: PricingRule[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchPricingRules = async (): Promise<PricingRule[]> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pricingCache;
  }
  
  // Fetch fresh data
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('active', true);
  
  if (error) {
    console.error('Error fetching pricing rules:', error);
    // Return default fallback pricing
    return getDefaultPricingRules();
  }
  
  pricingCache = data || [];
  cacheTimestamp = now;
  
  return pricingCache;
};

// Fallback default pricing (in case database is unavailable)
// Updated pricing: Table A (1000/hr, 500/30min), Table B (800/hr, 400/30min)
const getDefaultPricingRules = (): PricingRule[] => [
  { id: '1', table_type: 'table_a', duration_minutes: 30, coaching: false, price: 500, active: true, created_at: '', updated_at: '' },
  { id: '2', table_type: 'table_a', duration_minutes: 30, coaching: true, price: 700, active: true, created_at: '', updated_at: '' },
  { id: '3', table_type: 'table_a', duration_minutes: 60, coaching: false, price: 1000, active: true, created_at: '', updated_at: '' },
  { id: '4', table_type: 'table_a', duration_minutes: 60, coaching: true, price: 1200, active: true, created_at: '', updated_at: '' },
  { id: '5', table_type: 'table_b', duration_minutes: 30, coaching: false, price: 400, active: true, created_at: '', updated_at: '' },
  { id: '6', table_type: 'table_b', duration_minutes: 30, coaching: true, price: 600, active: true, created_at: '', updated_at: '' },
  { id: '7', table_type: 'table_b', duration_minutes: 60, coaching: false, price: 800, active: true, created_at: '', updated_at: '' },
  { id: '8', table_type: 'table_b', duration_minutes: 60, coaching: true, price: 1000, active: true, created_at: '', updated_at: '' },
];

export const calculateBookingPrice = async (
  tableId: 'table_a' | 'table_b',
  duration: 30 | 60,
  coaching: boolean
): Promise<number> => {
  const pricingRules = await fetchPricingRules();
  
  const rule = pricingRules.find(
    r => r.table_type === tableId 
      && r.duration_minutes === duration 
      && r.coaching === coaching
  );
  
  return rule?.price || 0;
};

// Synchronous version with fallback (for compatibility)
export const calculateBookingPriceSync = (
  tableId: 'table_a' | 'table_b',
  duration: 30 | 60,
  coaching: boolean
): number => {
  // Use cached data or defaults
  const rules = pricingCache || getDefaultPricingRules();
  
  const rule = rules.find(
    r => r.table_type === tableId 
      && r.duration_minutes === duration 
      && r.coaching === coaching
  );
  
  return rule?.price || 0;
};

// Clear cache (useful when pricing is updated)
export const clearPricingCache = () => {
  pricingCache = null;
  cacheTimestamp = 0;
};

