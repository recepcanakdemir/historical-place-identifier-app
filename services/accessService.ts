// services/accessService.ts - Unified Access Control
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessResult } from '../types';
import { isPremiumUser } from './usageService';

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
    
    // 2. Check if free trial session is active
    const freeTrialActive = await AsyncStorage.getItem(FREE_TRIAL_SESSION_KEY);
    if (freeTrialActive === 'true') {
      console.log('✅ Access granted - Free trial session active');
      return {
        hasAccess: true,
        reason: 'free_trial_session',
        shouldShowPaywall: false
      };
    }
    
    // 3. Check if this is first launch
    const isFirstLaunch = await checkFirstLaunch();
    if (isFirstLaunch) {
      console.log('🎯 First launch - Show paywall');
      await markAsLaunched();
      return {
        hasAccess: false,
        reason: 'first_launch',
        shouldShowPaywall: true,
        paywallSource: 'onboarding'
      };
    }
    
    // 4. User needs access
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
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return hasLaunched === null;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
};

/**
 * Mark app as launched
 */
export const markAsLaunched = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    console.log('📱 App marked as launched');
    return true;
  } catch (error) {
    console.error('Error marking as launched:', error);
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
    const isPremium = await isPremiumUser();
    const freeTrialActive = await isFreeTrialSessionActive();
    const isFirstLaunch = await checkFirstLaunch();
    const freeTrialUsed = await hasFreeTrialBeenUsed();
    
    return {
      isPremium,
      freeTrialSessionActive: freeTrialActive,
      isFirstLaunch,
      freeTrialUsed,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting access status:', error);
    return null;
  }
};