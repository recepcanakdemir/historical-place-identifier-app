// services/reviewService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
// Conditional import for expo-store-review to handle missing native module
let StoreReview;
try {
  StoreReview = require('expo-store-review');
} catch (error) {
  console.warn('expo-store-review not available:', error.message);
  StoreReview = null;
}

// Storage keys for review tracking
const REVIEW_STORAGE_KEYS = {
  SHOWN_COUNT: 'review_popup_shown_count',
  LAST_SHOWN_DATE: 'review_popup_last_shown',
  USER_REVIEWED: 'user_reviewed_app',
  USER_DECLINED: 'user_declined_review',
  ANALYSIS_COUNT_FOR_REVIEW: 'analysis_count_for_review',
  NATIVE_REVIEW_ATTEMPTS: 'native_review_attempts',
  LAST_NATIVE_REVIEW_DATE: 'last_native_review_date'
};

// Constants
const ANALYSES_BEFORE_FIRST_POPUP = 3; // Show after 3 successful analyses
const ANALYSES_BEFORE_RETRY = 5; // Show again after 5 more analyses if user said "later"
const DAYS_BEFORE_RETRY = 7; // Wait 7 days before asking again
const MAX_POPUP_ATTEMPTS = 3; // Maximum times to show the popup
const MAX_NATIVE_ATTEMPTS = 3; // Maximum native review attempts per year
const DAYS_BETWEEN_NATIVE_ATTEMPTS = 120; // 4 months between native attempts

// App Store configuration
const APP_STORE_CONFIG = {
  bundleId: 'com.recapp.landmarkai',
  appId: '6751427610',
  getAppStoreUrl: () => {
    return `https://apps.apple.com/app/id6751427610`;
  }
};

/**
 * Increment analysis count for review tracking
 */
export const trackAnalysisForReview = async () => {
  try {
    const currentCount = await getAnalysisCountForReview();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.ANALYSIS_COUNT_FOR_REVIEW, newCount.toString());
    console.log('🔢 Analysis count for review:', newCount);
    return newCount;
  } catch (error) {
    console.error('Error tracking analysis for review:', error);
    return 0;
  }
};

/**
 * Get current analysis count for review
 */
export const getAnalysisCountForReview = async () => {
  try {
    const count = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.ANALYSIS_COUNT_FOR_REVIEW);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting analysis count:', error);
    return 0;
  }
};

/**
 * Check if review popup should be shown
 */
export const shouldShowReviewPopup = async () => {
  try {
    // Check if user already reviewed or permanently declined
    const userReviewed = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.USER_REVIEWED);
    const userDeclined = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.USER_DECLINED);
    
    if (userReviewed === 'true' || userDeclined === 'true') {
      console.log('🚫 Review popup: User already reviewed or declined');
      return false;
    }

    // Check maximum attempts
    const shownCount = await getShownCount();
    if (shownCount >= MAX_POPUP_ATTEMPTS) {
      console.log('🚫 Review popup: Maximum attempts reached');
      return false;
    }

    // Check analysis count threshold
    const analysisCount = await getAnalysisCountForReview();
    const threshold = shownCount === 0 ? ANALYSES_BEFORE_FIRST_POPUP : ANALYSES_BEFORE_RETRY;
    
    if (analysisCount < threshold) {
      console.log(`🚫 Review popup: Need ${threshold - analysisCount} more analyses`);
      return false;
    }

    // Check time-based cooldown
    const lastShownDate = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.LAST_SHOWN_DATE);
    if (lastShownDate) {
      const daysSinceLastShown = (Date.now() - new Date(lastShownDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < DAYS_BEFORE_RETRY) {
        console.log(`🚫 Review popup: Wait ${Math.ceil(DAYS_BEFORE_RETRY - daysSinceLastShown)} more days`);
        return false;
      }
    }

    console.log('✅ Review popup: Should show');
    return true;
  } catch (error) {
    console.error('Error checking if should show review popup:', error);
    return false;
  }
};

/**
 * Mark review popup as shown
 */
export const markReviewPopupShown = async () => {
  try {
    const currentCount = await getShownCount();
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.SHOWN_COUNT, (currentCount + 1).toString());
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.LAST_SHOWN_DATE, new Date().toISOString());
    console.log('📊 Review popup shown count:', currentCount + 1);
  } catch (error) {
    console.error('Error marking review popup as shown:', error);
  }
};

/**
 * Get how many times popup has been shown
 */
export const getShownCount = async () => {
  try {
    const count = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.SHOWN_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting shown count:', error);
    return 0;
  }
};

/**
 * Get native review attempts count
 */
export const getNativeReviewAttempts = async () => {
  try {
    const count = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.NATIVE_REVIEW_ATTEMPTS);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting native review attempts:', error);
    return 0;
  }
};

/**
 * Check if native review is available and allowed
 */
export const canUseNativeReview = async () => {
  try {
    // Check if platform supports native review and module is available
    if (Platform.OS !== 'ios' || !StoreReview || !StoreReview.isAvailableAsync) {
      return false;
    }

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }

    // Check attempt limits
    const attempts = await getNativeReviewAttempts();
    if (attempts >= MAX_NATIVE_ATTEMPTS) {
      return false;
    }

    // Check time-based cooldown for native reviews
    const lastNativeDate = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.LAST_NATIVE_REVIEW_DATE);
    if (lastNativeDate) {
      const daysSinceLastNative = (Date.now() - new Date(lastNativeDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastNative < DAYS_BETWEEN_NATIVE_ATTEMPTS) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking native review availability:', error);
    return false;
  }
};

/**
 * Request native iOS review
 */
export const requestNativeReview = async () => {
  try {
    if (Platform.OS !== 'ios' || !StoreReview) {
      throw new Error('Native review not available');
    }

    const canUse = await canUseNativeReview();
    if (!canUse) {
      throw new Error('Native review not available');
    }

    // Track the attempt
    const currentAttempts = await getNativeReviewAttempts();
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.NATIVE_REVIEW_ATTEMPTS, (currentAttempts + 1).toString());
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.LAST_NATIVE_REVIEW_DATE, new Date().toISOString());

    // Request the native review
    await StoreReview.requestReview();
    
    console.log('🌟 Native review requested');
    return { success: true, type: 'native', message: 'Native review prompt shown' };
  } catch (error) {
    console.error('Error requesting native review:', error);
    return { success: false, type: 'native', message: error.message };
  }
};

/**
 * Handle user clicking "Rate Now" (App Store fallback)
 */
export const handleRateNow = async () => {
  try {
    const appStoreUrl = APP_STORE_CONFIG.getAppStoreUrl();
    const canOpen = await Linking.canOpenURL(appStoreUrl);
    
    if (canOpen) {
      await Linking.openURL(appStoreUrl);
      // Mark as reviewed to prevent future popups
      await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.USER_REVIEWED, 'true');
      console.log('🌟 User rated the app via App Store');
      return { success: true, type: 'appstore', message: 'Thank you for rating our app!' };
    } else {
      throw new Error('Cannot open App Store URL');
    }
  } catch (error) {
    console.error('Error opening App Store:', error);
    return { success: false, type: 'appstore', message: 'Unable to open App Store. Please search for LandmarkAI manually.' };
  }
};

/**
 * Handle user clicking "Maybe Later"
 */
export const handleMaybeLater = async () => {
  try {
    // Reset analysis count to require more analyses before next popup
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.ANALYSIS_COUNT_FOR_REVIEW, '0');
    console.log('⏰ User chose maybe later');
    return { success: true, message: 'We\'ll ask again later!' };
  } catch (error) {
    console.error('Error handling maybe later:', error);
    return { success: false, message: 'Error occurred' };
  }
};

/**
 * Handle user clicking "No Thanks"
 */
export const handleNoThanks = async () => {
  try {
    // Mark as declined to never show again
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.USER_DECLINED, 'true');
    console.log('🚫 User declined to review');
    return { success: true, message: 'Understood, we won\'t ask again.' };
  } catch (error) {
    console.error('Error handling no thanks:', error);
    return { success: false, message: 'Error occurred' };
  }
};

/**
 * Enhanced review request that tries native first, then falls back to custom modal
 */
export const requestReview = async () => {
  try {
    // Try native review first
    const nativeResult = await requestNativeReview();
    if (nativeResult.success) {
      // Mark as reviewed to prevent future popups since native review was shown
      await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.USER_REVIEWED, 'true');
      return { success: true, type: 'native', usedNative: true };
    }

    // Fall back to custom modal
    console.log('🔄 Falling back to custom review modal');
    return { success: true, type: 'custom', usedNative: false };
  } catch (error) {
    console.error('Error in review request:', error);
    return { success: true, type: 'custom', usedNative: false }; // Always fall back to custom
  }
};

/**
 * Manual review request (for settings screen)
 */
export const requestManualReview = async () => {
  try {
    // For manual requests, always try native first if available
    const canUse = await canUseNativeReview();
    if (canUse) {
      return await requestNativeReview();
    } else {
      // Fallback to App Store URL
      return await handleRateNow();
    }
  } catch (error) {
    console.error('Error in manual review request:', error);
    return await handleRateNow(); // Always fall back to App Store
  }
};

/**
 * Reset review data (for testing/debugging)
 */
export const resetReviewData = async () => {
  try {
    await AsyncStorage.multiRemove([
      REVIEW_STORAGE_KEYS.SHOWN_COUNT,
      REVIEW_STORAGE_KEYS.LAST_SHOWN_DATE,
      REVIEW_STORAGE_KEYS.USER_REVIEWED,
      REVIEW_STORAGE_KEYS.USER_DECLINED,
      REVIEW_STORAGE_KEYS.ANALYSIS_COUNT_FOR_REVIEW,
      REVIEW_STORAGE_KEYS.NATIVE_REVIEW_ATTEMPTS,
      REVIEW_STORAGE_KEYS.LAST_NATIVE_REVIEW_DATE
    ]);
    console.log('🔄 Review data reset');
    return { success: true, message: 'Review data reset successfully' };
  } catch (error) {
    console.error('Error resetting review data:', error);
    return { success: false, message: 'Error resetting review data' };
  }
};

/**
 * Get review debug info
 */
export const getReviewDebugInfo = async () => {
  try {
    const shownCount = await getShownCount();
    const analysisCount = await getAnalysisCountForReview();
    const userReviewed = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.USER_REVIEWED);
    const userDeclined = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.USER_DECLINED);
    const lastShownDate = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.LAST_SHOWN_DATE);
    const nativeAttempts = await getNativeReviewAttempts();
    const lastNativeDate = await AsyncStorage.getItem(REVIEW_STORAGE_KEYS.LAST_NATIVE_REVIEW_DATE);
    const canUseNative = await canUseNativeReview();
    
    return {
      shownCount,
      analysisCount,
      userReviewed: userReviewed === 'true',
      userDeclined: userDeclined === 'true',
      lastShownDate,
      nativeAttempts,
      lastNativeDate,
      canUseNative,
      shouldShow: await shouldShowReviewPopup()
    };
  } catch (error) {
    console.error('Error getting review debug info:', error);
    return null;
  }
};