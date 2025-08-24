// services/subscriptionService.js - Fixed TypeScript Compatibility
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { isPremiumUser, setPremiumStatus } from './usageService';

// RevenueCat API Keys - UPDATED WITH YOUR KEY
const REVENUECAT_API_KEY_IOS = 'appl_ksqMEeVADqtPxthKZRrxOfDQzBb'; // Your actual key here
const REVENUECAT_API_KEY_ANDROID = 'goog_your_api_key_here';

// Get the appropriate API key for current platform
const getAPIKey = () => {
  return Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
};

// Subscription product IDs (must match App Store Connect)
export const SUBSCRIPTION_IDS = {
  WEEKLY: 'weekly_premium',
  YEARLY: 'yearly_premium',
};

// Initialize RevenueCat
export const initializePurchases = async () => {
  try {
    const apiKey = getAPIKey();
    console.log('🚀 Initializing RevenueCat...');
    console.log('Platform:', Platform.OS);
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    // Check if we have a real API key
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      console.log('⚠️ RevenueCat API key not configured properly - using mock mode');
      return false;
    }
    
    // Configure RevenueCat with real API key
    await Purchases.configure({ apiKey });
    console.log('✅ RevenueCat initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing RevenueCat:', error);
    console.log('📱 Falling back to mock mode');
    return false;
  }
};

// Helper function to normalize planType to match TypeScript types
const normalizePlanType = (productIdentifier) => {
  if (!productIdentifier) return null;
  
  const id = productIdentifier.toLowerCase();
  if (id.includes('lifetime') || id.includes('yearly')) {
    return 'lifetime';
  } else if (id.includes('weekly')) {
    return 'weekly';
  }
  return null;
};

// Check current subscription status
// Check current subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const apiKey = getAPIKey();
    
    // If no real API key, use mock mode
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      return await checkSubscriptionStatusMock();
    }
    
    console.log('🔍 Checking RevenueCat subscription status...');
    
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    let planType = null;
    let expirationDate = null;
    let originalPurchaseDate = null;
    
    if (isPremium) {
      const premiumEntitlement = customerInfo.entitlements.active['premium'];
      expirationDate = premiumEntitlement.expirationDate;
      originalPurchaseDate = premiumEntitlement.originalPurchaseDate;
      
      // Use explicit type checking
      const productId = premiumEntitlement.productIdentifier;
      if (productId) {
        const id = productId.toLowerCase();
        if (id.includes('lifetime') || id.includes('yearly')) {
          planType = 'lifetime';
        } else if (id.includes('weekly')) {
          planType = 'weekly';
        }
      }
    }
    
    console.log('📊 RevenueCat subscription status:', { isPremium, planType });
    
    // Explicit return object matching SubscriptionStatus interface
    return {
      isPremium: isPremium,
      planType: planType, // This will be 'weekly' | 'lifetime' | null
      expirationDate: expirationDate,
      originalPurchaseDate: originalPurchaseDate,
    };
    
  } catch (error) {
    console.error('❌ Error checking RevenueCat subscription:', error);
    return await checkSubscriptionStatusMock();
  }
};
// Get available subscription packages from RevenueCat
export const getSubscriptionPackages = async () => {
  try {
    const apiKey = getAPIKey();
    
    // If no real API key, use mock mode
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      return await getSubscriptionPackagesMock();
    }
    
    console.log('📦 Getting RevenueCat offerings...');
    
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      console.log('⚠️ No current offering found, using mock data');
      return await getSubscriptionPackagesMock();
    }
    
    const packages = [];
    
    // Convert RevenueCat packages to our format
    Object.values(offerings.current.availablePackages).forEach(pkg => {
      const packageData = {
        id: pkg.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        price: pkg.product.priceString,
        period: pkg.packageType,
        originalPrice: pkg.product.price,
        revenueCatPackage: pkg // Store original package for purchasing
      };
      
      packages.push(packageData);
    });
    
    // If no packages found, return mock data
    if (packages.length === 0) {
      console.log('⚠️ No packages found in offering, using mock data');
      return await getSubscriptionPackagesMock();
    }
    
    console.log('✅ Found RevenueCat packages:', packages.map(p => p.id));
    return packages;
    
  } catch (error) {
    console.error('❌ Error getting RevenueCat packages:', error);
    return await getSubscriptionPackagesMock();
  }
};

// Purchase subscription via RevenueCat
export const purchaseSubscription = async (packageToPurchase) => {
  try {
    const apiKey = getAPIKey();
    
    // If no real API key, use mock mode
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      return await purchaseSubscriptionMock(packageToPurchase);
    }
    
    console.log('💳 Attempting RevenueCat purchase:', packageToPurchase.id);
    
    // Check if we have the RevenueCat package object
    if (!packageToPurchase.revenueCatPackage) {
      throw new Error('RevenueCat package object not found');
    }
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase.revenueCatPackage);
    
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isPremium) {
      // Also update local premium status for consistency
      await setPremiumStatus(true);
    }
    
    console.log('✅ RevenueCat purchase completed:', { isPremium });
    
    return {
      success: true,
      customerInfo,
      isPremium,
      message: 'Purchase completed successfully!'
    };
    
  } catch (error) {
    console.error('❌ RevenueCat purchase error:', error);
    
    if (error.userCancelled) {
      return {
        success: false,
        message: 'Purchase cancelled by user.',
        cancelled: true
      };
    }
    
    return {
      success: false,
      message: 'Purchase failed. Please try again.',
      error: error.message
    };
  }
};

// Restore purchases via RevenueCat
export const restorePurchases = async () => {
  try {
    const apiKey = getAPIKey();
    
    // If no real API key, use mock mode
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      return await restorePurchasesMock();
    }
    
    console.log('🔄 Restoring RevenueCat purchases...');
    
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isPremium) {
      // Update local premium status
      await setPremiumStatus(true);
      
      return {
        success: true,
        message: 'Premium access restored successfully!',
        isPremium: true
      };
    }
    
    return {
      success: true,
      message: 'No previous purchases found.',
      isPremium: false
    };
    
  } catch (error) {
    console.error('❌ RevenueCat restore error:', error);
    return {
      success: false,
      message: 'Failed to restore purchases. Please try again.',
      error: error.message
    };
  }
};

// Get customer info from RevenueCat
export const getCustomerInfo = async () => {
  try {
    const apiKey = getAPIKey();
    
    // If no real API key, use local data
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
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
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    return {
      isPremium,
      entitlements: customerInfo.entitlements
    };
    
  } catch (error) {
    console.error('❌ Error getting RevenueCat customer info:', error);
    
    // Fallback to local data
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
  }
};

// Set user identifier for RevenueCat
export const setUserIdentifier = async (userId) => {
  try {
    const apiKey = getAPIKey();
    
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      console.log('Mock user identifier set:', userId);
      return;
    }
    
    await Purchases.logIn(userId);
    console.log('👤 RevenueCat user identifier set:', userId);
  } catch (error) {
    console.error('❌ Error setting RevenueCat user identifier:', error);
  }
};

// Log out user from RevenueCat
export const logOutUser = async () => {
  try {
    const apiKey = getAPIKey();
    
    if (apiKey.includes('myappkey') || apiKey.includes('your_api_key_here')) {
      await setPremiumStatus(false);
      console.log('Mock user logged out');
      return;
    }
    
    await Purchases.logOut();
    await setPremiumStatus(false);
    console.log('👋 RevenueCat user logged out');
  } catch (error) {
    console.error('❌ Error logging out RevenueCat user:', error);
  }
};

// MOCK MODE FUNCTIONS (fallback when API key not configured properly)
const checkSubscriptionStatusMock = async () => {
  console.log('🔍 Checking subscription status in mock mode...');
  const isPremium = await isPremiumUser();
  console.log('Mock subscription check - isPremium:', isPremium);
  
  // Explicit return object
  return {
    isPremium: isPremium,
    planType: isPremium ? 'lifetime' : null, // Explicit 'lifetime' not string
    expirationDate: isPremium ? null : null,
    originalPurchaseDate: isPremium ? new Date().toISOString() : null,
  };
};
const getSubscriptionPackagesMock = async () => {
  console.log('📦 Getting subscription packages in mock mode...');
  
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
};

const purchaseSubscriptionMock = async (packageToPurchase) => {
  console.log('💳 Mock purchase for:', packageToPurchase.id);
  
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
};

const restorePurchasesMock = async () => {
  console.log('🔄 Mock restore purchases...');
  
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
};

// Check if subscription is about to expire
export const isSubscriptionExpiringSoon = async (daysThreshold = 7) => {
  try {
    const status = await checkSubscriptionStatus();
    
    if (!status.isPremium || !status.expirationDate) {
      return false;
    }
    
    const expirationDate = new Date(status.expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= daysThreshold;
  } catch (error) {
    console.error('❌ Error checking subscription expiration:', error);
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