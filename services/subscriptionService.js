// services/subscriptionService.js - Fixed Errors
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native'; // Bu import eksikti!
import { setPremiumStatus } from './usageService';

// RevenueCat API Keys (replace with your actual keys)
const REVENUECAT_API_KEY_IOS = 'appl_your_api_key_here';
const REVENUECAT_API_KEY_ANDROID = 'goog_your_api_key_here';

// Subscription product IDs (must match App Store Connect)
export const SUBSCRIPTION_IDS = {
  MONTHLY: 'monthly_premium',
  YEARLY: 'yearly_premium',
};

// Initialize RevenueCat
export const initializePurchases = async () => {
  try {
    console.log('Initializing RevenueCat...');
    
    // Platform-specific API key
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    // Check if we have valid API key
    if (apiKey === 'appl_your_api_key_here' || apiKey === 'goog_your_api_key_here') {
      console.log('RevenueCat API key not configured - using mock mode');
      return false; // Skip initialization
    }
    
    await Purchases.configureWith({
      apiKey: apiKey,
      observerMode: false,
    });
    
    console.log('RevenueCat initialized successfully');
    
    // Check current subscription status
    await checkSubscriptionStatus();
    return true;
    
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
  }
};

// Check current subscription status
export const checkSubscriptionStatus = async () => {
  try {
    console.log('Checking subscription status...');
    
    // Check if RevenueCat is initialized by trying to get app user ID
    try {
      await Purchases.getAppUserID();
    } catch (e) {
      console.log('RevenueCat not initialized, returning mock status');
      await setPremiumStatus(false);
      return {
        isPremium: false,
        expirationDate: null,
        originalPurchaseDate: null,
      };
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check if user has active subscription
    const hasActiveSubscription = customerInfo.entitlements.active['premium'] !== undefined;
    
    console.log('Active subscription:', hasActiveSubscription);
    
    // Update local premium status
    await setPremiumStatus(hasActiveSubscription);
    
    return {
      isPremium: hasActiveSubscription,
      expirationDate: hasActiveSubscription 
        ? customerInfo.entitlements.active['premium'].expirationDate 
        : null,
      originalPurchaseDate: hasActiveSubscription 
        ? customerInfo.entitlements.active['premium'].originalPurchaseDate 
        : null,
    };
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Return safe defaults
    await setPremiumStatus(false);
    return { 
      isPremium: false, 
      expirationDate: null,
      originalPurchaseDate: null 
    };
  }
};

// Get available subscription packages
export const getSubscriptionPackages = async () => {
  try {
    console.log('Getting subscription packages...');
    
    // Check if RevenueCat is initialized
    try {
      await Purchases.getAppUserID();
    } catch (e) {
      console.log('RevenueCat not initialized, returning empty packages');
      return [];
    }
    
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null) {
      const packages = offerings.current.availablePackages;
      
      // Format packages for UI
      const formattedPackages = packages.map(pkg => ({
        id: pkg.identifier,
        product: pkg.product,
        title: pkg.product.title,
        description: pkg.product.description,
        price: pkg.product.priceString,
        period: pkg.packageType,
        originalPrice: pkg.product.price,
      }));
      
      console.log('Available packages:', formattedPackages);
      return formattedPackages;
    }
    
    return [];
    
  } catch (error) {
    console.error('Error getting packages:', error);
    return [];
  }
};

// Purchase subscription
export const purchaseSubscription = async (packageToPurchase) => {
  try {
    console.log('Attempting to purchase:', packageToPurchase.id);
    
    // Check if RevenueCat is initialized
    try {
      await Purchases.getAppUserID();
    } catch (e) {
      return {
        success: false,
        message: 'Purchase system not available. Please try again later.',
      };
    }
    
    const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
    
    console.log('Purchase successful:', purchaseResult);
    
    // Check if the purchase grants premium access
    const hasActiveSubscription = purchaseResult.customerInfo.entitlements.active['premium'] !== undefined;
    
    if (hasActiveSubscription) {
      await setPremiumStatus(true);
      console.log('Premium access granted');
      
      return {
        success: true,
        customerInfo: purchaseResult.customerInfo,
        message: 'Welcome to Premium! You now have unlimited access.',
      };
    }
    
    return {
      success: false,
      message: 'Purchase completed but premium access not activated.',
    };
    
  } catch (error) {
    console.error('Purchase error:', error);
    
    // Handle different error types
    if (error.code === 'PURCHASE_CANCELLED') {
      return {
        success: false,
        message: 'Purchase was cancelled.',
        cancelled: true,
      };
    }
    
    if (error.code === 'PAYMENT_PENDING') {
      return {
        success: false,
        message: 'Payment is pending. You will receive access once payment is confirmed.',
        pending: true,
      };
    }
    
    return {
      success: false,
      message: 'Purchase failed. Please try again.',
      error: error.message,
    };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    console.log('Restoring purchases...');
    
    // Check if RevenueCat is initialized
    try {
      await Purchases.getAppUserID();
    } catch (e) {
      return {
        success: false,
        message: 'Restore system not available. Please try again later.',
      };
    }
    
    const customerInfo = await Purchases.restorePurchases();
    
    console.log('Restore result:', customerInfo);
    
    // Check if user has active subscription after restore
    const hasActiveSubscription = customerInfo.entitlements.active['premium'] !== undefined;
    
    await setPremiumStatus(hasActiveSubscription);
    
    if (hasActiveSubscription) {
      return {
        success: true,
        message: 'Premium access restored successfully!',
        isPremium: true,
      };
    }
    
    return {
      success: true,
      message: 'No previous purchases found.',
      isPremium: false,
    };
    
  } catch (error) {
    console.error('Restore error:', error);
    return {
      success: false,
      message: 'Failed to restore purchases. Please try again.',
      error: error.message,
    };
  }
};

// Get customer info
export const getCustomerInfo = async () => {
  try {
    // Check if RevenueCat is initialized
    try {
      await Purchases.getAppUserID();
    } catch (e) {
      return null;
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
};

// Set user identifier (useful for analytics)
export const setUserIdentifier = async (userId) => {
  try {
    await Purchases.logIn(userId);
    console.log('User identifier set:', userId);
  } catch (error) {
    console.error('Error setting user identifier:', error);
  }
};

// Log out user (useful when switching accounts)
export const logOutUser = async () => {
  try {
    await Purchases.logOut();
    await setPremiumStatus(false);
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

// Check if subscription is about to expire (for reminders)
export const isSubscriptionExpiringSoon = async (daysThreshold = 7) => {
  try {
    const status = await checkSubscriptionStatus();
    
    if (!status.isPremium || !status.expirationDate) {
      return false;
    }
    
    const expirationDate = new Date(status.expirationDate);
    const currentDate = new Date();
    const timeDiff = expirationDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff <= daysThreshold && daysDiff > 0;
    
  } catch (error) {
    console.error('Error checking expiration:', error);
    return false;
  }
};

// Helper function to format subscription period
export const formatSubscriptionPeriod = (period) => {
  switch (period) {
    case 'MONTHLY':
      return 'per month';
    case 'ANNUAL':
      return 'per year';
    case 'WEEKLY':
      return 'per week';
    default:
      return '';
  }
};

// Helper function to calculate savings for yearly plan
export const calculateYearlySavings = (monthlyPrice, yearlyPrice) => {
  const yearlyMonthlyEquivalent = monthlyPrice * 12;
  const savings = yearlyMonthlyEquivalent - yearlyPrice;
  const savingsPercentage = Math.round((savings / yearlyMonthlyEquivalent) * 100);
  
  return {
    savingsAmount: savings,
    savingsPercentage: savingsPercentage,
    monthsFreetrate: Math.round(savings / monthlyPrice),
  };
};