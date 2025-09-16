// app/index.tsx - Modern UI Design with Language Context
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { JSX, useState, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { checkAppAccess, getAccessStatus } from '../services/accessService';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import { getUsageStats } from '../services/usageService';
import { SubscriptionStatus, UsageStats } from '../types';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { texts: t, isLoading: languageLoading } = useLanguage();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [trialInfo, setTrialInfo] = useState<any>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.9)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;

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

  // Opening animation effect
  useEffect(() => {
    const animationSequence = Animated.sequence([
      // First: Header and logo appear
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Then: Action buttons appear
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
        delay: 200,
      }),
      
      // Finally: Features section appears
      Animated.timing(featuresOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 100,
      }),
    ]);

    animationSequence.start();
  }, []);

  // Check if should redirect to paywall
  useFocusEffect(
    React.useCallback(() => {
      const checkAndRedirect = async () => {
        try {
          // Debug current access status first
          console.log('🔍 Index screen - Getting debug access status...');
          await getAccessStatus();
          
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
      // Load usage stats
      const stats = await getUsageStats();
      setUsageStats(stats);
      
      // Load subscription status
      const subStatus = await checkSubscriptionStatus();
      setSubscriptionStatus(subStatus as SubscriptionStatus);
      
      // Load trial info
      const trial = await checkTrialStatus();
      setTrialInfo(trial);
      
      console.log('🏠 Home screen data loaded:', { stats, subStatus, trial });
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };
  const requestLocationAndOpenCamera = (): Promise<void> => {
    return new Promise((resolve) => {
      Alert.alert(
        t.locationForBetter,
        t.locationPermissionMessage,
        [
          { 
            text: t.skip, 
            style: 'cancel',
            onPress: () => {
              console.log('📍 User skipped location permission');
              router.push('/camera?locationEnabled=false');
              resolve();
            }
          },
          { 
            text: t.allow, 
            onPress: () => {
              console.log('📍 User allowed location permission');
              router.push('/camera?locationEnabled=true');
              resolve();
            }
          }
        ],
        { cancelable: false }
      );
    });
  };

  const takePhoto = (): void => {
    requestLocationAndOpenCamera();
  };

  const pickImage = async (): Promise<void> => {
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
  };


  const navigateToPremium = (): void => {
    router.push('/paywall?source=upgrade');
  };


  const renderUsageIndicator = (): JSX.Element => {
    // First check subscription status, then usage stats
    if (subscriptionStatus?.isPremium || usageStats?.isPremium) {
      const planType = subscriptionStatus?.planType || 'premium';
      return (
        <View style={styles.usageIndicator}>
          <Text style={styles.usageText}>
            ∞ {planType === 'lifetime' ? t.lifetimePlan : t.unlimitedAccess}
          </Text>
        </View>
      );
    }

    // Check if trial is active
    if (trialInfo?.isActive) {
      return (
        <View style={styles.usageIndicator}>
          <Text style={styles.usageText}>🎁 {t.freeTrialActive}</Text>
          <View style={styles.trialProgress}>
            <Text style={styles.trialProgressText}>
              {t.daysRemaining.replace('{count}', trialInfo.daysRemaining).replace('{s}', trialInfo.daysRemaining !== 1 ? 's' : '')}
            </Text>
          </View>
        </View>
      );
    }

    const remaining = Math.max(0, usageStats?.remainingFreeAnalyses || 0);
    const total = 1;
    const used = Math.max(0, total - remaining);

    return (
      <View style={styles.usageIndicator}>
        <Text style={styles.usageText}>{t.freeAnalysisLeft.replace('{remaining}', remaining.toString()).replace('{total}', total.toString())}</Text>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Clean Header */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.appName}</Text>
            
            {/* Right side - Premium status or Pro button */}
            <View style={styles.headerRight}>
              {(subscriptionStatus?.isPremium || usageStats?.isPremium) ? (
                <View style={styles.unlimitedIndicator}>
                  <Ionicons name="infinite" size={20} color="#10B981" />
                </View>
              ) : (
                <TouchableOpacity style={styles.proButton} onPress={navigateToPremium}>
                  <Text style={styles.proButtonText}>PRO</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>


      {/* Main Content with ScrollView */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Travel Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScaleAnim }],
              }
            ]}
          >
            <Image 
              source={require('../assets/images/paywall_and_index_icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.title}>{t.discoverHistory}</Text>
          <Text style={styles.subtitle}>
            {t.subtitle}
          </Text>
        </Animated.View>

        {/* Usage Stats Card */}
        <View style={styles.usageCard}>
          {renderUsageIndicator()}
        </View>

        {/* Quick Actions - Travel Style */}
        <Animated.View 
          style={[
            styles.quickActionsSection,
            {
              transform: [{ scale: buttonScaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <Text style={styles.sectionTitle}>{t.startYourJourney}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryAction} onPress={takePhoto}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="camera" size={32} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>{t.capture}</Text>
              <Text style={styles.actionSubtitle}>{t.takePhoto}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={pickImage}>
              <View style={styles.secondaryActionIconContainer}>
                <Ionicons name="images" size={32} color="#2c3e50" />
              </View>
              <Text style={styles.secondaryActionTitle}>{t.explore}</Text>
              <Text style={styles.secondaryActionSubtitle}>{t.choosePhoto}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Travel Features */}
        <Animated.View 
          style={[
            styles.featuresSection,
            { opacity: featuresOpacity }
          ]}
        >
          <Text style={styles.sectionTitle}>{t.whyTravelersLoveUs}</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="language" size={24} color="#000000" />
              </View>
              <Text style={styles.featureTitle}>{t.multiLanguage}</Text>
              <Text style={styles.featureText}>{t.languagesSupported}</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="location" size={24} color="#28a745" />
              </View>
              <Text style={styles.featureTitle}>{t.locationSmart}</Text>
              <Text style={styles.featureText}>{t.locationAware}</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="bookmark" size={24} color="#ffc107" />
              </View>
              <Text style={styles.featureTitle}>{t.saveAndShare}</Text>
              <Text style={styles.featureText}>{t.saveDiscoveries}</Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="sparkles" size={24} color="#dc3545" />
              </View>
              <Text style={styles.featureTitle}>{t.aiGuide}</Text>
              <Text style={styles.featureText}>{t.instantInsights}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <SafeAreaView style={styles.bottomNavSafeArea}>
          <View style={styles.bottomNav}>
            
            {/* Saved */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/saved')} activeOpacity={0.7}>
              <View style={styles.navItemContainer}>
                <Ionicons name="bookmark-outline" size={24} color="#8E8E93" />
                <Text style={styles.navLabel}>{t.saved}</Text>
              </View>
            </TouchableOpacity>

            {/* Home - Active (enlarged, centered) */}
            <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
              <View style={styles.activeNavItemContainer}>
                <View style={styles.activeNavBackground}>
                  <Ionicons name="home" size={28} color="#ffffff" />
                </View>
                <Text style={styles.activeNavLabel}>{t.home}</Text>
              </View>
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')} activeOpacity={0.7}>
              <View style={styles.navItemContainer}>
                <Ionicons name="settings-outline" size={24} color="#8E8E93" />
                <Text style={styles.navLabel}>{t.settings}</Text>
              </View>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Clean White Header Styles
  headerContainer: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
    flex: 1,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlimitedIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  proButton: {
    backgroundColor: '#13a4ec',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: 48,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  
  // Light Banners
  premiumActiveBanner: {
    backgroundColor: '#13a4ec',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumActiveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  premiumActiveSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  trialBanner: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  trialBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trialBannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  upgradeBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  upgradeBannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  warningBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  miniUpgradeButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  miniUpgradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    fontWeight: '400',
  },
  
  // Usage Card
  usageCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  
  // Usage Indicator
  usageIndicator: {
    alignItems: 'center',
  },
  usageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  trialProgress: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  trialProgressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
    backgroundColor: '#13a4ec',
  },
  
  // Travel Quick Actions
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#13a4ec',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(44,62,80,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  secondaryActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  secondaryActionSubtitle: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    opacity: 0.8,
  },
  
  // Travel Features Section
  featuresSection: {
    paddingHorizontal: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: (screenWidth - 64) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Bottom Navigation Styles
  bottomNavContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavSafeArea: {
    backgroundColor: '#ffffff',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  // Active nav item (enlarged)
  activeNavItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  activeNavBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#13a4ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Regular nav items
  navItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  activeNavLabel: {
    fontSize: 12,
    color: '#13a4ec',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  // Legacy styles (keeping for compatibility)
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeNavItem: {
    backgroundColor: '#f0f8ff',
  },
});