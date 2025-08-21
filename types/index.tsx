// types/index.ts - All Type Definitions

export interface UsageStats {
  totalAnalyses: number;
  remainingFreeAnalyses: number;
  isPremium: boolean;
  memberSince: string;
  lastUsage: string | null;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  expirationDate?: string | null;
  originalPurchaseDate?: string | null;
}

export interface PlaceInfo {
  name: string;
  description: string;
  location?: string;
  yearBuilt?: string;
  significance?: string;
  architecture?: string;
  funFacts?: string[];
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  savings?: string;
  features: string[];
  popular?: boolean;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface AnalysisResult {
  canAnalyze: boolean;
  reason: 'premium' | 'free_available' | 'limit_reached';
  remainingAnalyses: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  cancelled?: boolean;
  pending?: boolean;
  error?: string;
  customerInfo?: any;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  isPremium: boolean;
  error?: string;
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

export interface SavedPlace extends PlaceInfo {
  id: string;
  imageUri: string;
  userLocation?: string;
  originalLocationData?: string;
  savedAt: string;
}

// Type guards for runtime type checking
export const isUsageStats = (obj: any): obj is UsageStats => {
  return obj && 
    typeof obj.totalAnalyses === 'number' &&
    typeof obj.remainingFreeAnalyses === 'number' &&
    typeof obj.isPremium === 'boolean' &&
    typeof obj.memberSince === 'string';
};

export const isSubscriptionStatus = (obj: any): obj is SubscriptionStatus => {
  return obj && typeof obj.isPremium === 'boolean';
};