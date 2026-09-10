// lib/location/relevance.ts
// Invisible Server-Trusted Location Relevance Engine
// Implements progressive geographic fallback and adaptive content fill
// without leaking precise device coordinates or public profile location.

export type GeographicTier = 'local' | 'nearby' | 'regional' | 'national' | 'global';

export interface LocationCoordinates {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}

export interface ScoredContent<T> {
  item: T;
  geoTier: GeographicTier;
  relevanceScore: number;
}

// Canonical Metro Clusters for India & international hubs
const METRO_CLUSTERS: Record<string, { cluster: string; region: string; country: string; members: string[] }> = {
  delhi_ncr: {
    cluster: 'Delhi NCR',
    region: 'North India',
    country: 'India',
    members: ['delhi', 'new delhi', 'south delhi', 'central delhi', 'north delhi', 'gurgaon', 'gurugram', 'noida', 'greater noida', 'ghaziabad', 'faridabad'],
  },
  mumbai_metro: {
    cluster: 'Mumbai Metropolitan Region',
    region: 'Maharashtra',
    country: 'India',
    members: ['mumbai', 'navi mumbai', 'thane', 'bandra', 'south mumbai', 'pune'],
  },
  bangalore_metro: {
    cluster: 'Bengaluru Tech Corridor',
    region: 'Karnataka',
    country: 'India',
    members: ['bangalore', 'bengaluru', 'whitefield', 'koramangala', 'indiranagar'],
  },
  goa_sanctuary: {
    cluster: 'Goa Coastal Haven',
    region: 'Goa',
    country: 'India',
    members: ['goa', 'north goa', 'south goa', 'panaji', 'vagator', 'anjuna', 'morjim'],
  },
  hyderabad_metro: {
    cluster: 'Hyderabad Metropolis',
    region: 'Telangana',
    country: 'India',
    members: ['hyderabad', 'secunderabad', 'hitec city', 'jubilee hills'],
  },
  kolkata_metro: {
    cluster: 'Kolkata Cultural Hub',
    region: 'West Bengal',
    country: 'India',
    members: ['kolkata', 'calcutta', 'salt lake', 'new town'],
  },
  chennai_metro: {
    cluster: 'Chennai Coastal Metropolis',
    region: 'Tamil Nadu',
    country: 'India',
    members: ['chennai', 'madras', 'ecr'],
  },
  jaipur_cluster: {
    cluster: 'Jaipur Royal Enclave',
    region: 'North India',
    country: 'India',
    members: ['jaipur', 'rajasthan'],
  },
  chandigarh_cluster: {
    cluster: 'Chandigarh Tri-City',
    region: 'North India',
    country: 'India',
    members: ['chandigarh', 'mohali', 'panchkula'],
  },
};

/**
 * Normalizes a city string for safe comparisons
 */
export function normalizeLocationString(str?: string | null): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Finds the metro cluster key for a given city string
 */
export function findClusterKey(cityName?: string | null): string | null {
  const norm = normalizeLocationString(cityName);
  if (!norm) return null;

  for (const [key, data] of Object.entries(METRO_CLUSTERS)) {
    if (data.members.some(m => norm.includes(m) || m.includes(norm))) {
      return key;
    }
  }
  return null;
}

/**
 * Determines the progressive geographic tier and numeric score between
 * user discovery location and item location.
 */
export function evaluateGeographicTier(
  userLocation: LocationCoordinates | null | undefined,
  itemLocation: LocationCoordinates | null | undefined,
  locationDiscoveryEnabled: boolean = true
): { tier: GeographicTier; score: number } {
  // If discovery location is disabled by user, all content is globally available with equal tier
  if (!locationDiscoveryEnabled || !userLocation || (!userLocation.city && !userLocation.region)) {
    return { tier: 'global', score: 25 };
  }

  // If item has no location explicitly specified, it is inherently universal/global
  if (!itemLocation || (!itemLocation.city && !itemLocation.region && !itemLocation.country)) {
    return { tier: 'global', score: 30 };
  }

  const userCityNorm = normalizeLocationString(userLocation.city);
  const itemCityNorm = normalizeLocationString(itemLocation.city);

  const userCluster = findClusterKey(userLocation.city);
  const itemCluster = findClusterKey(itemLocation.city);

  // 1. Local Tier: Exact city match
  if (userCityNorm && itemCityNorm && (userCityNorm === itemCityNorm || userCityNorm.includes(itemCityNorm) || itemCityNorm.includes(userCityNorm))) {
    return { tier: 'local', score: 100 };
  }

  // 2. Nearby Tier: Same metro cluster (e.g. South Delhi <-> Gurgaon in Delhi NCR)
  if (userCluster && itemCluster && userCluster === itemCluster) {
    return { tier: 'nearby', score: 85 };
  }

  // 3. Regional Tier: Same region/state
  const userRegion = (userLocation.region || (userCluster ? METRO_CLUSTERS[userCluster].region : '')).toLowerCase();
  const itemRegion = (itemLocation.region || (itemCluster ? METRO_CLUSTERS[itemCluster].region : '')).toLowerCase();

  if (userRegion && itemRegion && (userRegion === itemRegion || userRegion.includes(itemRegion) || itemRegion.includes(userRegion))) {
    return { tier: 'regional', score: 65 };
  }

  // 4. National Tier: Same country
  const userCountry = (userLocation.country || (userCluster ? METRO_CLUSTERS[userCluster].country : 'India')).toLowerCase();
  const itemCountry = (itemLocation.country || (itemCluster ? METRO_CLUSTERS[itemCluster].country : '')).toLowerCase();

  if (userCountry && itemCountry && userCountry === itemCountry) {
    return { tier: 'national', score: 45 };
  }

  // 5. Global Tier: Broad worldwide content
  return { tier: 'global', score: 20 };
}

/**
 * Adaptive Content Fill Algorithm:
 * Ranks items by combining topic affinity, geographic relevance, recency, and quality.
 * If local content is scarce, nearby, regional, national, and global real content progressively
 * fills the feed without showing an artificial empty state.
 */
export function rankContentByLocation<T>(
  items: T[],
  userLocation: LocationCoordinates | null | undefined,
  getItemLocation: (item: T) => LocationCoordinates | null | undefined,
  getItemDate?: (item: T) => string | number | Date | null | undefined,
  getItemPopularity?: (item: T) => number,
  locationDiscoveryEnabled: boolean = true
): ScoredContent<T>[] {
  const now = Date.now();

  const scored: ScoredContent<T>[] = items.map(item => {
    const itemLoc = getItemLocation(item);
    const { tier, score: geoScore } = evaluateGeographicTier(userLocation, itemLoc, locationDiscoveryEnabled);

    // Recency Score (decay over 30 days)
    let recencyScore = 50;
    if (getItemDate) {
      const dateVal = getItemDate(item);
      if (dateVal) {
        const ms = new Date(dateVal).getTime();
        if (!isNaN(ms)) {
          const ageHours = Math.max(0, (now - ms) / (1000 * 3600));
          recencyScore = Math.max(0, 100 - (ageHours * 0.15)); // decay slowly
        }
      }
    }

    // Engagement / Popularity score
    let popScore = 50;
    if (getItemPopularity) {
      const pop = getItemPopularity(item) || 0;
      popScore = Math.min(100, pop * 5);
    }

    // Composite Score: Geography (50%) + Recency (35%) + Engagement (15%)
    const compositeScore = (geoScore * 0.5) + (recencyScore * 0.35) + (popScore * 0.15);

    return {
      item,
      geoTier: tier,
      relevanceScore: Math.round(compositeScore * 10) / 10,
    };
  });

  // Deterministic multi-factor sort:
  // Primary: geoTier rank (local -> nearby -> regional -> national -> global)
  // Secondary: relevanceScore DESC
  const tierWeight: Record<GeographicTier, number> = {
    local: 5,
    nearby: 4,
    regional: 3,
    national: 2,
    global: 1,
  };

  scored.sort((a, b) => {
    const diffTier = tierWeight[b.geoTier] - tierWeight[a.geoTier];
    if (diffTier !== 0) return diffTier;
    return b.relevanceScore - a.relevanceScore;
  });

  return scored;
}

/**
 * List of canonical metros supported for user discovery selection
 */
export const SUPPORTED_DISCOVERY_METROS = [
  { id: 'delhi_ncr', name: 'Delhi NCR', city: 'Delhi', region: 'North India', country: 'India' },
  { id: 'mumbai_metro', name: 'Mumbai', city: 'Mumbai', region: 'Maharashtra', country: 'India' },
  { id: 'bangalore_metro', name: 'Bengaluru', city: 'Bengaluru', region: 'Karnataka', country: 'India' },
  { id: 'goa_sanctuary', name: 'Goa', city: 'Goa', region: 'Goa', country: 'India' },
  { id: 'hyderabad_metro', name: 'Hyderabad', city: 'Hyderabad', region: 'Telangana', country: 'India' },
  { id: 'kolkata_metro', name: 'Kolkata', city: 'Kolkata', region: 'West Bengal', country: 'India' },
  { id: 'chennai_metro', name: 'Chennai', city: 'Chennai', region: 'Tamil Nadu', country: 'India' },
  { id: 'pune_metro', name: 'Pune', city: 'Pune', region: 'Maharashtra', country: 'India' },
  { id: 'jaipur_cluster', name: 'Jaipur', city: 'Jaipur', region: 'North India', country: 'India' },
  { id: 'chandigarh_cluster', name: 'Chandigarh', city: 'Chandigarh', region: 'North India', country: 'India' },
  { id: 'global', name: 'Global (All Sanctuaries)', city: '', region: '', country: '' },
];
