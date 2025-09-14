// types/index.ts - Updated Types

export interface NearbyPlace {
  name: string;
  description: string;
  approximateDistance: string;
  placeType: string;
  mapsLink: string;    // Primary Google Maps link
  latitude: number;    // Coordinates (from AI or Places API)
  longitude: number;   // Coordinates (from AI or Places API)
  placeId?: string;    // Google Places ID for reliable linking
  mapsLinks?: {        // Multiple link types for different platforms
    universal: string;
    mobileApp: string;
    appleMaps: string;
  };
  address?: string;    // Full address from Places API
  rating?: number;     // Google rating if available
  verifiedName?: string; // Verified name from Places API
  isEnriched?: boolean; // Flag to indicate if Place ID lookup is complete
}

export interface PlaceInfo {
  name: string;
  description: string;
  location: string;
  yearBuilt?: string;
  significance?: string;
  architecture?: string;
  funFacts?: string[];
  nearbyMustSeePlaces?: NearbyPlace[];
  imageUri?: string;
  userLocation?: string;
  savedAt?: string;
  id?: string;
}

export interface UsageStats {
  totalAnalyses: number;
  remainingFreeAnalyses: number;
  isPremium: boolean;
  memberSince: string;
  lastUsage?: string | null;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  expirationDate?: string | null;
  originalPurchaseDate?: string | null;
  productIdentifier?: string;
  planType?: 'weekly' | 'lifetime' | null;
}

export interface SubscriptionPlan {
  id: 'weekly' | 'lifetime';
  title: string;
  price: string;
  period?: string;
  savings?: string;
  popular?: boolean;
  features: string[];
  originalPrice?: number;
  trialDays?: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  timestamp: number;
}

export interface AnalysisResult {
  canAnalyze: boolean;
  reason: 'premium' | 'free_available' | 'limit_reached';
  remainingAnalyses: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  customerInfo?: any;
  error?: string;
}

export interface AccessResult {
  hasAccess: boolean;
  reason: string;
  shouldShowPaywall: boolean;
  paywallSource?: 'onboarding' | 'upgrade' | 'limit' | 'settings';
}
// types/index.tsx'te Package interface'i ekleyin:
export interface Package {
  id: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: number;
  currencyCode: string;
  subscriptionPeriod?: string | null;
  packageType: string;
  rcPackage?: any;
}