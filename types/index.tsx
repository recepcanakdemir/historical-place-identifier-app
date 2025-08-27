// types/index.ts - Updated Types

export interface PlaceInfo {
  name: string;
  description: string;
  location: string;
  yearBuilt?: string;
  significance?: string;
  architecture?: string;
  funFacts?: string[];
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