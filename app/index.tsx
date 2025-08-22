// app/index.tsx - Updated with New Pricing Logic
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { JSX, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkAppAccess } from '../services/accessService';
import { getCurrentLanguage, getUITexts } from '../services/languageService';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import { getUsageStats } from '../services/usageService';
import { SubscriptionStatus, UsageStats } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [uiTexts, setUITexts] = useState(getUITexts('en'));
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const insets = useSafeAreaInsets();

  // Helper function to check trial status
  const checkTrialStatus = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const trialActive = await AsyncStorage.getItem('trial_active');
      const trialEndDate = await AsyncStorage.getItem('trial_end_date');
      
      if (trialActive === 'true' && trialEndDate) {
        const endDate = new Date(trialEndDate);
        const now = new Date();
        
        if (now < endDate) {
          return {
            isActive: true,
            endDate: trialEndDate,
            daysRemaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          };
        } else {
          // Trial expired
          await AsyncStorage.setItem('trial_active', 'false');
          return {
            isActive: false,
            endDate: trialEndDate,
            daysRemaining: 0
          };
        }
      }
      
      return {
        isActive: false,
        endDate: null,
        daysRemaining: 0
      };
      
    } catch (error) {
      console.error('Error checking trial status:', error);
      return {
        isActive: false,
        endDate: null,
        daysRemaining: 0
      };
    }
  };

  // Check if should redirect to paywall
  useFocusEffect(
    React.useCallback(() => {
      const checkAndRedirect = async () => {
        try {
          // Use new unified access service
          const accessResult = await checkAppAccess();
          console.log('🏠 Index screen - Access result:', accessResult);
          
          if (!accessResult.hasAccess && accessResult.shouldShowPaywall) {
            const source = accessResult.paywallSource || 'upgrade';
            console.log(`🎯 Redirecting to paywall with source: ${source}`);
            router.replace(`/paywall?source=${source}`);
            return;
          }
          
          // If has access, load normal data
          console.log('✅ User can access main app');
          loadAppData();
          
        } catch (error) {
          console.error('❌ Error checking access status:', error);
          // On error, load app normally
          loadAppData();
        }
      };
      
      checkAndRedirect();
    }, [])
  );

  const loadAppData = async (): Promise<void> => {
    try {
      // Load language
      const language = await getCurrentLanguage();
      setCurrentLang(language);
      setUITexts(getUITexts(language));
      
      // Load usage stats
      const stats = await getUsageStats();
      setUsageStats(stats);
      
      // Load subscription status
      const subStatus = await checkSubscriptionStatus();
      setSubscriptionStatus(subStatus);
      
      // Load trial info
      const trial = await checkTrialStatus();
      setTrialInfo(trial);
      
      console.log('🏠 Home screen data loaded:', { language, stats, subStatus, trial });
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };

  const takePhoto = (): void => {
    closeMenu();
    setTimeout(() => router.push('/camera'), 100);
  };

  const pickImage = async (): Promise<void> => {
    closeMenu();
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        router.push({
          pathname: '/result',
          params: { 
            imageUri: result.assets[0].uri,
            fromGallery: 'true'
          }
        });
      }
    }, 100);
  };

  const openMenu = (): void => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (): void => {
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const navigateToSaved = (): void => {
    closeMenu();
    setTimeout(() => router.push('/saved'), 200);
  };

  const navigateToSettings = (): void => {
    closeMenu();
    setTimeout(() => router.push('/settings'), 200);
  };

  const navigateToPremium = (): void => {
    closeMenu();
    setTimeout(() => router.push('/paywall?source=upgrade'), 200);
  };

  const renderPremiumBanner = (): JSX.Element | null => {
    // Check if user is premium
    if (subscriptionStatus?.isPremium || usageStats?.isPremium) {
      const planType = subscriptionStatus?.planType || 'premium';
      return (
        <View style={styles.premiumActiveBanner}>
          <Text style={styles.premiumActiveText}>
            ✨ {planType === 'lifetime' ? 'Lifetime Premium' : 'Premium Active'}
          </Text>
          <Text style={styles.premiumActiveSubtext}>Unlimited analyses</Text>
        </View>
      );
    }

    // Check if trial is active
    if (trialInfo?.isActive) {
      return (
        <View style={styles.trialBanner}>
          <Text style={styles.trialBannerText}>🎁 Free Trial Active</Text>
          <Text style={styles.trialBannerSubtext}>
            {trialInfo.daysRemaining} day{trialInfo.daysRemaining !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      );
    }

    const remaining = Math.max(0, usageStats?.remainingFreeAnalyses || 0);

    if (remaining === 0) {
      return (
        <TouchableOpacity 
          style={styles.upgradeBanner}
          onPress={navigateToPremium}
        >
          <Text style={styles.upgradeBannerText}>🔒 No free analyses left</Text>
          <Text style={styles.upgradeBannerSubtext}>Tap to upgrade to Premium</Text>
        </TouchableOpacity>
      );
    }

    if (remaining <= 1) {
      return (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>⚡ {remaining} free analysis left</Text>
          <TouchableOpacity 
            style={styles.miniUpgradeButton}
            onPress={navigateToPremium}
          >
            <Text style={styles.miniUpgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderUsageIndicator = (): JSX.Element => {
    // First check subscription status, then usage stats
    if (subscriptionStatus?.isPremium || usageStats?.isPremium) {
      const planType = subscriptionStatus?.planType || 'premium';
      return (
        <View style={styles.usageIndicator}>
          <Text style={styles.usageText}>
            ∞ {planType === 'lifetime' ? 'Lifetime Access' : 'Unlimited Access'}
          </Text>
        </View>
      );
    }

    // Check if trial is active
    if (trialInfo?.isActive) {
      return (
        <View style={styles.usageIndicator}>
          <Text style={styles.usageText}>🎁 Free Trial Active</Text>
          <View style={styles.trialProgress}>
            <Text style={styles.trialProgressText}>
              {trialInfo.daysRemaining} day{trialInfo.daysRemaining !== 1 ? 's' : ''} remaining
            </Text>
          </View>
        </View>
      );
    }

    const remaining = Math.max(0, usageStats?.remainingFreeAnalyses || 0);
    const total = 3;
    const used = Math.max(0, total - remaining);

    return (
      <View style={styles.usageIndicator}>
        <Text style={styles.usageText}>{remaining} of {total} free analyses left</Text>
        <View style={styles.progressBar}>
          {[...Array(total)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < used ? styles.progressDotUsed : styles.progressDotRemaining
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={openMenu}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{uiTexts.appName || 'Historical Places'}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Premium/Usage Banner */}
      {renderPremiumBanner()}

      {/* Main Content with ScrollView */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoEmoji}>🏛️</Text>
          </View>
        </View>

        <Text style={styles.title}>{uiTexts.discoverHistory || 'Discover History'}</Text>
        <Text style={styles.subtitle}>
          {uiTexts.subtitle || 'Explore monuments and landmarks with AI-powered historical insights'}
        </Text>

        {/* Usage Indicator */}
        {renderUsageIndicator()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>📷</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>{uiTexts.takePhoto || 'Take Photo'}</Text>
                <Text style={styles.buttonSubtext}>{uiTexts.withLocation || 'with location detection'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🖼️</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>{uiTexts.chooseGallery || 'Choose from Gallery'}</Text>
                <Text style={styles.buttonSubtext}>{uiTexts.analyzeAny || 'analyze any image'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>{uiTexts.languagesSupported || '10+ languages supported'}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>{uiTexts.locationAware || 'Location-aware analysis'}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💾</Text>
            <Text style={styles.featureText}>{uiTexts.saveDiscoveries || 'Save your discoveries'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Hamburger Menu Modal */}
      {menuVisible && (
        <Modal
          animationType="none"
          transparent={true}
          visible={menuVisible}
          onRequestClose={closeMenu}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackground} 
              onPress={closeMenu}
              activeOpacity={1}
            />
            
            <Animated.View 
              style={[
                styles.menuContainer,
                { 
                  transform: [{ translateX: slideAnim }],
                  paddingTop: insets.top,
                }
              ]}
            >
              <View style={[styles.menuHeader, { marginTop: 0 }]}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuItems}>
                {/* Premium Status in Menu */}
                <View style={styles.menuPremiumStatus}>
                  {subscriptionStatus?.isPremium ? (
                    <Text style={styles.menuPremiumActiveText}>
                      ✨ {subscriptionStatus.planType === 'lifetime' ? 'Lifetime' : 'Premium'} Member
                    </Text>
                  ) : trialInfo?.isActive ? (
                    <Text style={styles.menuTrialActiveText}>
                      🎁 Free Trial ({trialInfo.daysRemaining} days left)
                    </Text>
                  ) : (
                    <TouchableOpacity 
                      style={styles.menuUpgradeButton}
                      onPress={navigateToPremium}
                    >
                      <Text style={styles.menuUpgradeText}>⭐ Upgrade to Premium</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={navigateToSaved}>
                  <Text style={styles.menuIcon}>💾</Text>
                  <Text style={styles.menuItemText}>Saved Places</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                {!subscriptionStatus?.isPremium && (
                  <TouchableOpacity style={styles.menuItem} onPress={navigateToPremium}>
                    <Text style={styles.menuIcon}>⭐</Text>
                    <Text style={styles.menuItemText}>Premium</Text>
                    <Text style={styles.menuArrow}>›</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.menuDivider} />

                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>Historical Place Finder</Text>
                  <Text style={styles.menuFooterSubtext}>v1.0.0</Text>
                  {usageStats && (
                    <Text style={styles.menuFooterUsage}>
                      {usageStats.totalAnalyses} total analyses
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburgerButton: {
    width: 30,
    height: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 30,
  },
  
  // Premium/Trial Banners
  premiumActiveBanner: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  premiumActiveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumActiveSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  trialBanner: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trialBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trialBannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  upgradeBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  upgradeBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeBannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  miniUpgradeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  miniUpgradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  
  // Usage Indicator
  usageIndicator: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  trialProgress: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trialProgressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotUsed: {
    backgroundColor: '#FF6B6B',
  },
  progressDotRemaining: {
    backgroundColor: '#4A90E2',
  },
  
  buttonContainer: {
    gap: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#50C878',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#50C878',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  featuresList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  
  // Modal and Menu styles (keeping existing styles)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalBackground: {
    flex: 1,
  },
  menuContainer: {
    width: 280,
    backgroundColor: 'white',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#4A90E2',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuPremiumStatus: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  menuPremiumActiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  menuTrialActiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  menuUpgradeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  menuUpgradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: '#999',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  menuFooter: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  menuFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  menuFooterSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  menuFooterUsage: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});