// services/subscriptionService.js - Mock Mode Using Local Premium
import { Platform } from 'react-native';
import { isPremiumUser, setPremiumStatus } from './usageService';

// RevenueCat API Keys (replace with your actual keys when ready)
const REVENUECAT_API_KEY_IOS = 'appl_your_api_key_here';
const REVENUECAT_API_KEY_ANDROID = 'goog_your_api_key_here';

// Subscription product IDs (must match App Store Connect)
export const SUBSCRIPTION_IDS = {
  WEEKLY: 'weekly_premium',
  YEARLY: 'yearly_premium',
};

// Initialize RevenueCat (Mock Mode)
export const initializePurchases = async () => {
  try {
    console.log('Initializing RevenueCat in Mock Mode...');
    
    // Since we don't have real API keys, just skip RevenueCat
    console.log('RevenueCat API key not configured - using mock mode');
    return false; // Skip initialization
    
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
  }
};

// Check current subscription status (Mock - uses local premium)
export const checkSubscriptionStatus = async () => {
  try {
    console.log('Checking subscription status in mock mode...');
    
    // Use local premium status instead of RevenueCat
    const isPremium = await isPremiumUser();
    console.log('Mock subscription check - isPremium:', isPremium);
    
    return {
      isPremium: isPremium,
      expirationDate: isPremium ? null : null, // Premium doesn't expire in mock mode
      originalPurchaseDate: isPremium ? new Date().toISOString() : null,
    };
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { 
      isPremium: false, 
      expirationDate: null,
      originalPurchaseDate: null 
    };
  }
};

// Get available subscription packages (Mock)
export const getSubscriptionPackages = async () => {
  try {
    console.log('Getting subscription packages in mock mode...');
    
    // Return mock packages
    return [
      {
        id: 'weekly',
        title: 'Weekly Premium',
        description: 'Unlimited historical analysis',
        price: '$2.99',
        period: 'weekly',
        originalPrice: 2.99,
      },
      {
        id: 'yearly',
        title: 'Yearly Premium',
        description: 'Unlimited historical analysis - Best Value',
        price: '$29.99',
        period: 'yearly',
        originalPrice: 29.99,
      }
    ];
    
  } catch (error) {
    console.error('Error getting packages:', error);
    return [];
  }
};

// Purchase subscription (Mock)
export const purchaseSubscription = async (packageToPurchase) => {
  try {
    console.log('Mock purchase for:', packageToPurchase.id);
    
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Grant premium access locally
    await setPremiumStatus(true);
    console.log('Mock purchase completed - Premium access granted');
    
    return {
      success: true,
      customerInfo: null,
      message: 'Mock purchase completed successfully!',
    };
    
  } catch (error) {
    console.error('Mock purchase error:', error);
    return {
      success: false,
      message: 'Mock purchase failed. Please try again.',
      error: error.message,
    };
  }
};

// Restore purchases (Mock)
export const restorePurchases = async () => {
  try {
    console.log('Mock restore purchases...');
    
    // Simulate restore delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check current premium status
    const isPremium = await isPremiumUser();
    
    if (isPremium) {
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
    console.error('Mock restore error:', error);
    return {
      success: false,
      message: 'Failed to restore purchases. Please try again.',
      error: error.message,
    };
  }
};

// Get customer info (Mock)
export const getCustomerInfo = async () => {
  try {
    const isPremium = await isPremiumUser();
    
    return {
      isPremium,
      entitlements: {
        active: isPremium ? { 'premium': { 
          expirationDate: null,
          originalPurchaseDate: new Date().toISOString()
        }} : {}
      }
    };
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
};

// Set user identifier (Mock)
export const setUserIdentifier = async (userId) => {
  try {
    console.log('Mock user identifier set:', userId);
  } catch (error) {
    console.error('Error setting user identifier:', error);
  }
};

// Log out user (Mock)
export const logOutUser = async () => {
  try {
    await setPremiumStatus(false);
    console.log('Mock user logged out');
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

// Check if subscription is about to expire (Mock - always false)
export const isSubscriptionExpiringSoon = async (daysThreshold = 7) => {
  // In mock mode, premium never expires
  return false;
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