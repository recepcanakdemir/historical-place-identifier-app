// services/usageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const USAGE_STORAGE_KEY = 'user_usage_data';
const PREMIUM_STORAGE_KEY = 'user_premium_status';

// Constants
const FREE_ANALYSIS_LIMIT = 3;

// Get current usage data
export const getUserUsage = async () => {
  try {
    const usageData = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    if (!usageData) {
      // First time user - initialize with 3 free analyses
      const initialData = {
        analysisCount: 0,
        remainingFreeAnalyses: FREE_ANALYSIS_LIMIT,
        firstUsageDate: new Date().toISOString(),
        lastUsageDate: null,
      };
      await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(usageData);
  } catch (error) {
    console.error('Error getting usage data:', error);
    return {
      analysisCount: 0,
      remainingFreeAnalyses: FREE_ANALYSIS_LIMIT,
      firstUsageDate: new Date().toISOString(),
      lastUsageDate: null,
    };
  }
};

// Check if user is premium
export const isPremiumUser = async () => {
  try {
    const premiumStatus = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    return premiumStatus === 'true';
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// Set premium status
export const setPremiumStatus = async (isPremium) => {
  try {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, isPremium.toString());
    console.log('Premium status updated:', isPremium);
  } catch (error) {
    console.error('Error setting premium status:', error);
  }
};

// Check if user can perform analysis
export const canPerformAnalysis = async () => {
  const isPremium = await isPremiumUser();
  
  if (isPremium) {
    return {
      canAnalyze: true,
      reason: 'premium',
      remainingAnalyses: -1, // Unlimited
    };
  }
  
  const usage = await getUserUsage();
  const canAnalyze = usage.remainingFreeAnalyses > 0;
  
  return {
    canAnalyze,
    reason: canAnalyze ? 'free_available' : 'limit_reached',
    remainingAnalyses: usage.remainingFreeAnalyses,
  };
};

// Use one analysis (call this after successful analysis)
export const useAnalysis = async () => {
  const isPremium = await isPremiumUser();
  
  // Premium users don't have limits
  if (isPremium) {
    await updateAnalysisCount();
    return {
      success: true,
      remainingAnalyses: -1,
    };
  }
  
  const usage = await getUserUsage();
  
  if (usage.remainingFreeAnalyses <= 0) {
    return {
      success: false,
      remainingAnalyses: 0,
      error: 'No free analyses remaining',
    };
  }
  
  // Decrease remaining free analyses
  const updatedUsage = {
    ...usage,
    analysisCount: usage.analysisCount + 1,
    remainingFreeAnalyses: usage.remainingFreeAnalyses - 1,
    lastUsageDate: new Date().toISOString(),
  };
  
  await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updatedUsage));
  
  return {
    success: true,
    remainingAnalyses: updatedUsage.remainingFreeAnalyses,
  };
};

// Update total analysis count (for premium users)
const updateAnalysisCount = async () => {
  try {
    const usage = await getUserUsage();
    const updatedUsage = {
      ...usage,
      analysisCount: usage.analysisCount + 1,
      lastUsageDate: new Date().toISOString(),
    };
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updatedUsage));
  } catch (error) {
    console.error('Error updating analysis count:', error);
  }
};

// Get usage statistics
export const getUsageStats = async () => {
  const usage = await getUserUsage();
  const isPremium = await isPremiumUser();
  
  return {
    totalAnalyses: usage.analysisCount,
    remainingFreeAnalyses: isPremium ? -1 : usage.remainingFreeAnalyses, // Premium users get -1 to indicate unlimited
    isPremium,
    memberSince: usage.firstUsageDate,
    lastUsage: usage.lastUsageDate,
  };
};

// Reset usage (for testing purposes)
export const resetUsage = async () => {
  try {
    await AsyncStorage.removeItem(USAGE_STORAGE_KEY);
    await AsyncStorage.removeItem(PREMIUM_STORAGE_KEY);
    console.log('Usage data reset');
  } catch (error) {
    console.error('Error resetting usage:', error);
  }
};

// Grant premium access (for testing or promotional purposes)
export const grantPremiumAccess = async () => {
  await setPremiumStatus(true);
  console.log('Premium access granted');
};

// Revoke premium access
export const revokePremiumAccess = async () => {
  await setPremiumStatus(false);
  console.log('Premium access revoked');
};