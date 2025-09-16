// services/accessService.ts - Unified Access Control
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessResult } from '../types';
import { isPremiumUser, getUsageStats } from './usageService';

const FREE_TRIAL_SESSION_KEY = 'free_trial_active';
const FIRST_LAUNCH_KEY = 'first_launch';
const FREE_TRIAL_USED_KEY = 'free_trial_used'; // Yeni key

/**
 * Check if user has access to the main app
 */
export const checkAppAccess = async (): Promise<AccessResult> => {
  try {
    console.log('🔐 Checking app access...');
    
    // 1. Check if user is premium
    const isPremium = await isPremiumUser();
    if (isPremium) {
      console.log('✅ Access granted - Premium user');
      return {
        hasAccess: true,
        reason: 'premium',
        shouldShowPaywall: false
      };
    }
    
    // 2. PRIORITY: Check if free trial session is active FIRST
    const freeTrialActive = await AsyncStorage.getItem(FREE_TRIAL_SESSION_KEY);
    console.log('🎁 Free trial session status:', freeTrialActive);
    
    if (freeTrialActive === 'true') {
      // Check if user still has free analyses left
      const usageStats = await getUsageStats();
      console.log('📊 Usage stats for trial check:', usageStats);
      
      if (usageStats.remainingFreeAnalyses > 0) {
        console.log('✅ Access granted - Free trial session active with analyses remaining');
        return {
          hasAccess: true,
          reason: 'free_trial_session',
          shouldShowPaywall: false
        };
      } else {
        console.log('🚫 Free trial session active but no analyses remaining - show upgrade paywall');
        return {
          hasAccess: false,
          reason: 'trial_exhausted',
          shouldShowPaywall: true,
          paywallSource: 'upgrade'
        };
      }
    }
    
    // 3. Check if this is first launch (only if no active trial)
    const isFirstLaunch = await checkFirstLaunch();
    if (isFirstLaunch) {
      console.log('🎯 First launch - Show onboarding paywall');
      await markAsLaunched();
      return {
        hasAccess: false,
        reason: 'first_launch',
        shouldShowPaywall: true,
        paywallSource: 'onboarding'
      };
    }
    
    // 4. User needs access - not first launch, no trial
    console.log('🚫 Access denied - User needs premium or free trial');
    return {
      hasAccess: false,
      reason: 'needs_access',
      shouldShowPaywall: true,
      paywallSource: 'upgrade'
    };
    
  } catch (error) {
    console.error('❌ Error checking app access:', error);
    // On error, allow access but log the issue
    return {
      hasAccess: true,
      reason: 'error_fallback',
      shouldShowPaywall: false
    };
  }
};

/**
 * Check if this is the first launch
 */
export const checkFirstLaunch = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking first launch...');
    
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    
    const isFirstLaunch = hasLaunched === null;
    console.log('🎯 Is first launch?', isFirstLaunch);
    
    return isFirstLaunch;
  } catch (error) {
    console.error('❌ Error checking first launch:', error);
    return false;
  }
};

/**
 * Mark app as launched
 */
export const markAsLaunched = async (): Promise<boolean> => {
  try {
    console.log('🏷️  Marking app as launched...');
    
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    
    // Verify the write was successful
    const verification = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    console.log('🔍 Verification - stored value:', verification);
    
    console.log('📱 App marked as launched successfully');
    return true;
  } catch (error) {
    console.error('❌ Error marking as launched:', error);
    return false;
  }
};

/**
 * Start free trial session
 */
export const startFreeTrialSession = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(FREE_TRIAL_SESSION_KEY, 'true');
    // Mark that free trial has been used
    await AsyncStorage.setItem(FREE_TRIAL_USED_KEY, 'true');
    console.log('🎁 Free trial session started and marked as used');
    return true;
  } catch (error) {
    console.error('Error starting free trial session:', error);
    return false;
  }
};

/**
 * End free trial session
 */
export const endFreeTrialSession = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(FREE_TRIAL_SESSION_KEY);
    console.log('🏁 Free trial session ended');
    return true;
  } catch (error) {
    console.error('Error ending free trial session:', error);
    return false;
  }
};
/**
 * Check if free trial session is active
 */
export const isFreeTrialSessionActive = async (): Promise<boolean> => {
  try {
    const isActive = await AsyncStorage.getItem(FREE_TRIAL_SESSION_KEY);
    return isActive === 'true';
  } catch (error) {
    console.error('Error checking free trial session:', error);
    return false;
  }
};

/**
 * Check if free trial has been used before
 */
export const hasFreeTrialBeenUsed = async (): Promise<boolean> => {
  try {
    const hasBeenUsed = await AsyncStorage.getItem(FREE_TRIAL_USED_KEY);
    return hasBeenUsed === 'true';
  } catch (error) {
    console.error('Error checking if free trial has been used:', error);
    return false;
  }
};

/**
 * Reset all access data (for testing/debugging)
 */
export const resetAccessData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      FREE_TRIAL_SESSION_KEY,
      FIRST_LAUNCH_KEY,
      FREE_TRIAL_USED_KEY
    ]);
    console.log('🔄 Access data reset');
    return true;
  } catch (error) {
    console.error('Error resetting access data:', error);
    return false;
  }
};

/**
 * Get current access status for debugging
 */
export const getAccessStatus = async () => {
  try {
    console.log('🔍 Getting access status for debugging...');
    
    const isPremium = await isPremiumUser();
    const freeTrialActive = await isFreeTrialSessionActive();
    const isFirstLaunch = await checkFirstLaunch();
    const freeTrialUsed = await hasFreeTrialBeenUsed();
    
    // Additional AsyncStorage inspection
    console.log('🔑 Raw AsyncStorage values:');
    const rawFreeTrialSession = await AsyncStorage.getItem(FREE_TRIAL_SESSION_KEY);
    const rawFirstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    const rawFreeTrialUsed = await AsyncStorage.getItem(FREE_TRIAL_USED_KEY);
    
    console.log('   - Trial session active:', rawFreeTrialSession);
    console.log('   - First launch completed:', rawFirstLaunch);
    console.log('   - Trial used:', rawFreeTrialUsed);
    
    const status = {
      isPremium,
      freeTrialSessionActive: freeTrialActive,
      isFirstLaunch,
      freeTrialUsed,
      rawStorage: {
        freeTrialSession: rawFreeTrialSession,
        firstLaunch: rawFirstLaunch,
        freeTrialUsed: rawFreeTrialUsed
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Complete access status:', status);
    return status;
  } catch (error) {
    console.error('❌ Error getting access status:', error);
    return null;
  }
};