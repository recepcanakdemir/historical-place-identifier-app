// services/onboardingService.js - Premium-Based Onboarding
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPremiumUser } from './usageService';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const FIRST_LAUNCH_KEY = 'first_launch';

// Check if this is the first launch ever
export const isFirstLaunch = async () => {
  try {
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    const isFirst = hasLaunched === null;
    console.log('isFirstLaunch check:', isFirst);
    return isFirst;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
};

// Mark app as launched (only for tracking purposes)
export const markAsLaunched = async () => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    console.log('App marked as launched');
    return true;
  } catch (error) {
    console.error('Error marking as launched:', error);
    return false;
  }
};

// Check if onboarding has been completed (legacy)
export const isOnboardingCompleted = async () => {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const isCompleted = completed === 'true';
    console.log('isOnboardingCompleted check:', isCompleted);
    return isCompleted;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Complete onboarding for this session only
export const completeOnboarding = async () => {
  try {
    // Mark as launched if first time
    await markAsLaunched();
    
    // Set a session flag that onboarding was completed for this session
    await AsyncStorage.setItem('session_onboarding_completed', 'true');
    
    console.log('Onboarding completed for this session');
    return true;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }
};

// NEW LOGIC: Show onboarding if user is NOT premium
export const shouldShowOnboarding = async () => {
  try {
    // Only check local usageService for premium status
    const isPremium = await isPremiumUser();
    console.log('🔍 Premium check from usageService:', isPremium);
    
    if (isPremium) {
      console.log('shouldShowOnboarding: false (user is premium)');
      return false;
    }
    
    console.log('shouldShowOnboarding: true (user is not premium)');
    return true;
    
  } catch (error) {
    console.error('Error checking onboarding requirements:', error);
    // Default to showing onboarding on error
    return true;
  }
};

// Reset onboarding (for testing)
export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    await AsyncStorage.removeItem('session_onboarding_completed');
    console.log('Onboarding reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return false;
  }
};

// Force mark as not first launch (emergency fix)
export const markAsNotFirstLaunch = async () => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    console.log('Marked as not first launch');
    return true;
  } catch (error) {
    console.error('Error marking as not first launch:', error);
    return false;
  }
};