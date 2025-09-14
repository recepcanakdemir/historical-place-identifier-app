// services/subscriptionService.js - Updated for com.recapp.landmarkai
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { isPremiumUser, setPremiumStatus } from './usageService';

// RevenueCat API Keys - RevenueCat Dashboard'dan alacağınız gerçek keyler
const REVENUECAT_API_KEY_IOS = 'appl_boZGShDRWyOQDzbjYFyAkCJysPB'; // TODO: Gerçek iOS key
const REVENUECAT_API_KEY_ANDROID = 'goog_xxxxxxxxxxxxxxxx'; // TODO: Gerçek Android key

// Product IDs - Yeni bundle ID ile güncellenmiş
export const SUBSCRIPTION_IDS = {
  WEEKLY: 'com.recapp.landmarkai.weekly_premium',
  LIFETIME: 'com.recapp.landmarkai.lifetime_premium',
};

// Entitlement identifier - RevenueCat Dashboard'da tanımladığınız entitlement
const PREMIUM_ENTITLEMENT_ID = 'premium';

// Package identifiers - RevenueCat Offerings'te tanımladığınız package IDs
const PACKAGE_IDS = {
  WEEKLY: '$rc_weekly',
  LIFETIME: '$rc_lifetime',
};

let isRevenueCatConfigured = false;

// Initialize RevenueCat
export const initializePurchases = async () => {
  try {
    console.log('Initializing RevenueCat for LandmarkAI...');

    // API key seçimi
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    // Debug mode check - production'da remove edin
    if (apiKey.includes('xxxxxxxxxxxxxxxx')) {
      console.warn('RevenueCat API key not configured - using development mode');
      if (__DEV__) {
        // Development mode - mock başarılı initialization
        isRevenueCatConfigured = false;
        return { success: true, message: 'Development mode - Mock initialization' };
      } else {
        throw new Error('RevenueCat API keys not configured for production');
      }
    }

    // RevenueCat configure
    await Purchases.configure({ apiKey });

    // Debug mode enable (sadece development'ta)
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    // Customer info update listener
    Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      console.log('Customer info updated:', customerInfo);
      await updateLocalPremiumStatus(customerInfo);
    });

    isRevenueCatConfigured = true;
    console.log('RevenueCat initialized successfully for LandmarkAI');

    // Initial customer info check
    const customerInfo = await Purchases.getCustomerInfo();
    await updateLocalPremiumStatus(customerInfo);

    return { success: true, message: 'RevenueCat initialized' };

  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    isRevenueCatConfigured = false;

    // Production'da error, development'ta warn
    if (!__DEV__) {
      throw error;
    }

    return { success: false, error: error.message };
  }
};

// Update local premium status based on RevenueCat customer info
const updateLocalPremiumStatus = async (customerInfo) => {
  try {
    const hasEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;
    const currentLocalStatus = await isPremiumUser();

    if (currentLocalStatus !== hasEntitlement) {
      await setPremiumStatus(hasEntitlement);
      console.log(`LandmarkAI Premium status updated: ${currentLocalStatus} → ${hasEntitlement}`);
    }

  } catch (error) {
    console.error('Error updating local premium status:', error);
  }
};

// Check current subscription status
export const checkSubscriptionStatus = async () => {
  try {
    console.log('Checking subscription status...');
    if (!isRevenueCatConfigured) {
      // Fallback to local status if RevenueCat not configured
      const isPremium = await isPremiumUser();
      return {
        isPremium,
        planType: isPremium ? 'premium' : null,
        expirationDate: null,
        originalPurchaseDate: null,
        productIdentifier: null,
        source: 'local'
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (entitlement) {
      const isLifetime = entitlement.productIdentifier === SUBSCRIPTION_IDS.LIFETIME;

      return {
        isPremium: true,
        planType: isLifetime ? 'lifetime' : 'subscription',
        expirationDate: entitlement.expirationDate,
        originalPurchaseDate: entitlement.originalPurchaseDate,
        productIdentifier: entitlement.productIdentifier,
        willRenew: entitlement.willRenew,
        periodType: entitlement.periodType,
        source: 'revenuecat'
      };
    }

    // No active entitlement - check local status as backup
    const localPremium = await isPremiumUser();
    return {
      isPremium: localPremium,
      planType: localPremium ? 'local_premium' : null,
      expirationDate: null,
      originalPurchaseDate: null,
      productIdentifier: null,
      source: localPremium ? 'local' : 'none'
    };

  } catch (error) {
    console.error('Error checking subscription status:', error);

    // Fallback to local status on error
    const isPremium = await isPremiumUser();
    return {
      isPremium,
      planType: isPremium ? 'local_premium' : null,
      expirationDate: null,
      originalPurchaseDate: null,
      productIdentifier: null,
      error: error.message,
      source: 'local_fallback'
    };
  }
};

// Get available subscription packages from RevenueCat
export const getSubscriptionPackages = async () => {
  try {
    console.log('Getting subscription packages...');

    if (!isRevenueCatConfigured) {
      throw new error("Revenuecat not configured");
    }

    const offerings = await Purchases.getOfferings()
    console.log('Offerings:', offerings);

    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      console.warn('No offerings available, returning mock packages');
      return getMockPackages();
    }

    return offerings.current.availablePackages.map(pkg => ({
      id: pkg.identifier,
      title: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.priceString,
      localizedPrice: pkg.product.price,
      currencyCode: pkg.product.currencyCode,
      subscriptionPeriod: pkg.product.subscriptionPeriod,
      introPrice: pkg.product.introPrice,
      freeTrialPeriod: pkg.product.freeTrialPeriod,
      packageType: pkg.packageType,
      storeProduct: pkg.storeProduct,
      rcPackage: pkg, // RevenueCat package object for purchasing
    }));

  } catch (error) {
    console.error('Error getting packages:', error);
    return getMockPackages();
  }
};

// Mock packages for development/fallback
const getMockPackages = () => {
  return [
    {
      id: PACKAGE_IDS.WEEKLY,
      title: 'LandmarkAI Weekly Premium',
      description: 'Unlimited landmark analysis for 1 week',
      price: '$5.99',
      localizedPrice: 5.99,
      currencyCode: 'USD',
      subscriptionPeriod: 'P1W',
      packageType: 'WEEKLY',
      rcPackage: null,
    },
    {
      id: PACKAGE_IDS.LIFETIME,
      title: 'LandmarkAI Lifetime Premium',
      description: 'One-time payment for lifetime access to all premium features',
      price: '$29.99',
      localizedPrice: 29.99,
      currencyCode: 'USD',
      subscriptionPeriod: null,
      packageType: 'LIFETIME',
      rcPackage: null,
    }
  ];
};

// Purchase subscription with proper error handling
/*export const purchaseSubscription = async (planId) => {
  try {
    console.log(`Attempting to purchase plan: ${planId}`);

    if (!isRevenueCatConfigured) {
      return await mockPurchase(planId);
    }

    // Get current offerings
    const offerings = await Purchases.getOfferings();
    // Tüm paketleri detaylı görmek için
    offerings.current.availablePackages.forEach((pkg, index) => {
      console.log(`------ Paket ${index + 1} ------`);
      console.log("Identifier:", pkg.identifier);
      console.log("Package Type:", pkg.packageType);
      console.log("Product Identifier:", pkg.product.identifier);
      console.log("Product Title:", pkg.product.title);
      console.log("Product Description:", pkg.product.description);
      console.log("Price:", pkg.product.priceString);
      console.log("Currency Code:", pkg.product.currencyCode);
      console.log("Intro Price:", pkg.product.introPrice);
      console.log("Subscription Period:", pkg.product.subscriptionPeriod);
      console.log("------ -------- ------\n");
    });

    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      throw new Error('No subscription packages available');
    }

    // Find the package to purchase
    let packageToPurchase = null;

    console.log('Looking for planId:', planId);
    console.log('PACKAGE_IDS.LIFETIME:', PACKAGE_IDS.LIFETIME);
    console.log('Available identifiers:', offerings.current.availablePackages.map(pkg => pkg.identifier));

    /*if (planId === 'lifetime' || planId === PACKAGE_IDS.LIFETIME) {
      console.log('Entering lifetime condition');
      packageToPurchase = offerings.current.availablePackages.find(pkg => {
        console.log('Checking pkg:', pkg.identifier, 'against', PACKAGE_IDS.LIFETIME);
        return pkg.identifier === PACKAGE_IDS.LIFETIME ||
          pkg.product.identifier === SUBSCRIPTION_IDS.LIFETIME;
      });
      console.log('Found packageToPurchase:', packageToPurchase);
    }



    if (planId === 'weekly' || planId === PACKAGE_IDS.WEEKLY) {
      packageToPurchase = offerings.current.availablePackages.find(pkg =>
        pkg.identifier === PACKAGE_IDS.WEEKLY ||
        pkg.product.identifier === SUBSCRIPTION_IDS.WEEKLY
      );
    } else if (planId === 'lifetime' || planId === PACKAGE_IDS.LIFETIME) {
      packageToPurchase = offerings.current.availablePackages.find(pkg =>
        pkg.identifier === PACKAGE_IDS.LIFETIME ||
        pkg.product.identifier === SUBSCRIPTION_IDS.LIFETIME
      );
    }


    if (!packageToPurchase) {
      throw new Error(`Package not found for plan: ${planId}`);
    }

    // Make the purchase
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);

    // Update local premium status
    await updateLocalPremiumStatus(customerInfo);

    // Check if purchase was successful
    const hasEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;

    if (hasEntitlement) {
      console.log('Purchase successful:', productIdentifier);
      return {
        success: true,
        customerInfo,
        productIdentifier,
        message: 'Welcome to LandmarkAI Premium! Enjoy unlimited landmark identification.',
      };
    } else {
      // Purchase completed but entitlement not active (shouldn't happen)
      console.warn('Purchase completed but entitlement not active');
      return {
        success: false,
        message: 'Purchase completed but premium access not activated. Please contact support.',
        customerInfo,
      };
    }

  } catch (error) {
    console.error('Purchase error:', error);

    // Handle specific purchase errors
    if (error.code) {
      switch (error.code) {
        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED:
          return {
            success: false,
            message: 'Purchase was cancelled',
            errorCode: 'CANCELLED',
          };

        case Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING:
          return {
            success: false,
            message: 'Payment is pending approval. Please check back later.',
            errorCode: 'PENDING',
          };

        case Purchases.PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE:
          return {
            success: false,
            message: 'This product is not available for purchase in your region.',
            errorCode: 'NOT_AVAILABLE',
          };

        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED:
          return {
            success: false,
            message: 'Purchases are not allowed on this device.',
            errorCode: 'NOT_ALLOWED',
          };

        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_INVALID:
          return {
            success: false,
            message: 'Purchase is invalid. Please try again.',
            errorCode: 'INVALID',
          };

        case Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR:
          return {
            success: false,
            message: 'Network error. Please check your connection and try again.',
            errorCode: 'NETWORK',
          };

        default:
          return {
            success: false,
            message: 'Purchase failed. Please try again.',
            errorCode: 'UNKNOWN',
            error: error.message,
          };
      }
    }

    // Fallback to mock purchase in development
    /*if (__DEV__ && !isRevenueCatConfigured) {
      console.log('Falling back to mock purchase in development');
      return await mockPurchase(planId);
    }

    return {
      success: false,
      message: 'Purchase failed. Please try again.',
      error: error.message,
    };
  }
};*/
export const purchaseSubscription = async (planId) => {
  try {
    console.log(`Attempting to purchase plan: ${planId}`);

    if (!isRevenueCatConfigured) {
      return await mockPurchase(planId);
    }

    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      throw new Error('No subscription packages available');
    }

    // Unified package matching - consistent for both plans
    const packageToPurchase = offerings.current.availablePackages.find(pkg => {
      // Primary: RevenueCat identifier match
      if (planId === 'weekly' && pkg.identifier === PACKAGE_IDS.WEEKLY) return true;
      if (planId === 'lifetime' && pkg.identifier === PACKAGE_IDS.LIFETIME) return true;
      
      // Fallback: Product identifier match
      if (planId === 'weekly' && pkg.product.identifier === SUBSCRIPTION_IDS.WEEKLY) return true;
      if (planId === 'lifetime' && pkg.product.identifier === SUBSCRIPTION_IDS.LIFETIME) return true;
      
      return false;
    });

    if (!packageToPurchase) {
      console.error(`Package not found for plan: ${planId}`);
      throw new Error(`Package not found for plan: ${planId}`);
    }

    // Make the purchase
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);

    // Update local premium status
    await updateLocalPremiumStatus(customerInfo);

    // Check if purchase was successful
    const hasEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;

    if (hasEntitlement) {
      console.log('Purchase successful:', productIdentifier);
      return {
        success: true,
        customerInfo,
        productIdentifier,
        message: 'Welcome to LandmarkAI Premium! Enjoy unlimited landmark identification.',
      };
    } else {
      console.warn('Purchase completed but entitlement not active');
      return {
        success: false,
        message: 'Purchase completed but premium access not activated. Please contact support.',
        customerInfo,
      };
    }

  } catch (error) {
    console.error('Purchase error:', error);
       if (error.userCancelled === true) {
        return {
            success: false,
            message: 'Purchase was cancelled',
            errorCode: 'CANCELLED',
        };
    }

    // Handle specific purchase errors
    if (error.code) {
      switch (error.code) {
        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED:
          return {
            success: false,
            message: 'Purchase was cancelled',
            errorCode: 'CANCELLED',
          };

        case Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING:
          return {
            success: false,
            message: 'Payment is pending approval. Please check back later.',
            errorCode: 'PENDING',
          };

        case Purchases.PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE:
          return {
            success: false,
            message: 'This product is not available for purchase in your region.',
            errorCode: 'NOT_AVAILABLE',
          };

        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED:
          return {
            success: false,
            message: 'Purchases are not allowed on this device.',
            errorCode: 'NOT_ALLOWED',
          };

        case Purchases.PURCHASES_ERROR_CODE.PURCHASE_INVALID:
          return {
            success: false,
            message: 'Purchase is invalid. Please try again.',
            errorCode: 'INVALID',
          };

        case Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR:
          return {
            success: false,
            message: 'Network error. Please check your connection and try again.',
            errorCode: 'NETWORK',
          };

        default:
          return {
            success: false,
            message: 'Purchase failed. Please try again.',
            errorCode: 'UNKNOWN',
            error: error.message,
          };
      }
    }

    // Fallback for errors without code
    return {
      success: false,
      message: 'Purchase failed. Please try again.',
      error: error.message,
    };
  }
};

// Mock purchase for development/testing
const mockPurchase = async (planId) => {
  console.log(`Mock purchase for plan: ${planId}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate success (90% of the time in development)
  if (Math.random() > 0.1) {
    await setPremiumStatus(true);
    return {
      success: true,
      customerInfo: null,
      productIdentifier: planId === 'weekly' ? SUBSCRIPTION_IDS.WEEKLY : SUBSCRIPTION_IDS.LIFETIME,
      message: 'Mock purchase completed successfully! Welcome to LandmarkAI Premium.',
      isMock: true,
    };
  } else {
    return {
      success: false,
      message: 'Mock purchase failed (random failure for testing)',
      errorCode: 'MOCK_FAILURE',
      isMock: true,
    };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    console.log('Restoring purchases...');

    if (!isRevenueCatConfigured) {
      // Check local status as fallback
      const isPremium = await isPremiumUser();
      return {
        success: true,
        message: isPremium ? 'Premium access found locally!' : 'No previous purchases found.',
        isPremium,
        source: 'local',
      };
    }

    const customerInfo = await Purchases.restorePurchases();

    // Update local status based on restored info
    await updateLocalPremiumStatus(customerInfo);

    const hasEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;

    return {
      success: true,
      message: hasEntitlement ? 'LandmarkAI Premium access restored successfully!' : 'No previous purchases found.',
      isPremium: hasEntitlement,
      customerInfo,
      source: 'revenuecat',
    };

  } catch (error) {
    console.error('Restore error:', error);

    // Fallback to local status check
    const isPremium = await isPremiumUser();

    return {
      success: false,
      message: 'Failed to restore purchases. Please try again.',
      error: error.message,
      isPremium, // Return local status as fallback
      source: 'error_fallback',
    };
  }
};

// Rest of the functions remain the same...
// (getCustomerInfo, setUserIdentifier, logOutUser, isSubscriptionExpiringSoon, etc.)
// They don't need bundle ID specific changes

export const getCustomerInfo = async () => {
  try {
    if (!isRevenueCatConfigured) {
      const isPremium = await isPremiumUser();
      return {
        originalAppUserId: 'local_user',
        entitlements: {
          active: isPremium ? {
            [PREMIUM_ENTITLEMENT_ID]: {
              expirationDate: null,
              originalPurchaseDate: new Date().toISOString(),
              productIdentifier: 'local_premium'
            }
          } : {}
        },
        source: 'local'
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    return {
      ...customerInfo,
      source: 'revenuecat'
    };

  } catch (error) {
    console.error('Error getting customer info:', error);

    // Fallback to local status
    const isPremium = await isPremiumUser();
    return {
      originalAppUserId: 'error_fallback',
      entitlements: {
        active: isPremium ? {
          [PREMIUM_ENTITLEMENT_ID]: {
            expirationDate: null,
            originalPurchaseDate: new Date().toISOString(),
            productIdentifier: 'local_premium'
          }
        } : {}
      },
      error: error.message,
      source: 'error_fallback'
    };
  }
};

// Set user identifier for RevenueCat
export const setUserIdentifier = async (userId) => {
  try {
    if (!isRevenueCatConfigured) {
      console.log('RevenueCat not configured, storing user ID locally');
      return { success: true, source: 'local' };
    }

    const { customerInfo } = await Purchases.logIn(userId);
    await updateLocalPremiumStatus(customerInfo);

    console.log('User identifier set:', userId);
    return { success: true, customerInfo, source: 'revenuecat' };

  } catch (error) {
    console.error('Error setting user identifier:', error);
    return { success: false, error: error.message };
  }
};

// Log out user
export const logOutUser = async () => {
  try {
    if (isRevenueCatConfigured) {
      await Purchases.logOut();
    }

    // Clear local premium status
    await setPremiumStatus(false);

    console.log('User logged out');
    return { success: true };

  } catch (error) {
    console.error('Error logging out user:', error);

    // Still clear local status even if RevenueCat logout fails
    await setPremiumStatus(false);

    return { success: false, error: error.message };
  }
};

// Check if subscription is about to expire
export const isSubscriptionExpiringSoon = async (daysThreshold = 7) => {
  try {
    if (!isRevenueCatConfigured) {
      return { expiringSoon: false, source: 'local' };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (!entitlement || !entitlement.expirationDate) {
      return { expiringSoon: false, reason: 'no_expiration', source: 'revenuecat' };
    }

    const expirationDate = new Date(entitlement.expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

    return {
      expiringSoon: daysUntilExpiration <= daysThreshold && daysUntilExpiration > 0,
      daysUntilExpiration,
      expirationDate: entitlement.expirationDate,
      productIdentifier: entitlement.productIdentifier,
      source: 'revenuecat'
    };

  } catch (error) {
    console.error('Error checking expiration:', error);
    return {
      expiringSoon: false,
      error: error.message,
      source: 'error'
    };
  }
};

// Sync RevenueCat with local status (call this periodically)
export const syncSubscriptionStatus = async () => {
  try {
    if (!isRevenueCatConfigured) {
      console.log('RevenueCat not configured, skipping sync');
      return { success: false, reason: 'not_configured' };
    }

    console.log('Syncing subscription status...');

    const customerInfo = await Purchases.getCustomerInfo();
    await updateLocalPremiumStatus(customerInfo);

    const hasEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;
    const localPremium = await isPremiumUser();

    console.log(`Sync complete: RevenueCat=${hasEntitlement}, Local=${localPremium}`);

    return {
      success: true,
      revenueCatPremium: hasEntitlement,
      localPremium: localPremium,
      synced: hasEntitlement === localPremium
    };

  } catch (error) {
    console.error('Error syncing subscription status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper functions
export const isRevenueCatReady = () => isRevenueCatConfigured;

export const formatSubscriptionPeriod = (period) => {
  if (!period) return '';

  switch (period) {
    case 'P1W':
      return 'per week';
    case 'P1M':
    case 'MONTHLY':
      return 'per month';
    case 'P1Y':
    case 'ANNUAL':
      return 'per year';
    case 'WEEKLY':
      return 'per week';
    default:
      return '';
  }
};

export const getLocalizedPrice = (product, fallbackPrice = '$0.00') => {
  if (product && product.priceString) {
    return product.priceString;
  }
  return fallbackPrice;
};

// Development helper - reset all subscription data
export const resetSubscriptionData = async () => {
  if (!__DEV__) {
    console.warn('resetSubscriptionData can only be called in development');
    return { success: false, reason: 'not_dev_mode' };
  }

  try {
    await setPremiumStatus(false);

    if (isRevenueCatConfigured) {
      await Purchases.logOut();
    }

    console.log('LandmarkAI subscription data reset (development only)');
    return { success: true };

  } catch (error) {
    console.error('Error resetting subscription data:', error);
    return { success: false, error: error.message };
  }
};