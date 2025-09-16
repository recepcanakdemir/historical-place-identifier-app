// app/result.tsx - Updated with Paywall Integration
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveHistoricalPlace } from '../services/storageService';
import { canPerformAnalysis, getUsageStats, useAnalysis } from '../services/usageService';
import { analyzeHistoricalPlace } from '../services/visionService';
import { enrichNearbyPlacesWithPlaceId } from '../services/placesService';
import { PlaceInfo, UsageStats, NearbyPlace } from '../types';
import { NearbyPlaces } from '../components/NearbyPlaces';
import { ChatModal } from '../components/ChatModal';
import { openInMaps } from '../utils/mapUtils';
import { isChatServiceAvailable } from '../services/chatService';
import { useLanguage } from '../contexts/LanguageContext';

import React, { useEffect, useState, useRef } from 'react';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ 
    imageUri: string;
    locationData?: string;
    savedData?: string;
    fromSaved?: string;
    fromGallery?: string;
  }>();
  
  // Extract params
  
  const { imageUri, locationData, savedData, fromSaved, fromGallery } = params;
  const { texts: t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{latitude: number, longitude: number} | null>(null);
  
  // Usage tracking states
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  
  // Two-phase loading states
  const [nearbyPlacesEnriching, setNearbyPlacesEnriching] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (fromSaved === 'true' && savedData) {
      // Load from saved data - no limit check needed
      loadSavedData();
    } else if (imageUri) {
      // New analysis - check limits first
      checkLimitsAndAnalyze();
    }
  }, [imageUri, savedData, fromSaved]);

  // Animation effects
  useEffect(() => {
    if (loading) {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Start rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      
      // Start scanning line animation
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
      rotateAnimation.start();
      scanAnimation.start();
      
      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
        scanAnimation.stop();
      };
    }
  }, [loading, pulseAnim, rotateAnim, fadeAnim]);

  const loadSavedData = () => {
    try {
      if (!savedData) {
        setError('No saved data provided');
        setLoading(false);
        return;
      }
      
      const parsed = JSON.parse(savedData);
      
      // Fix location object issue for saved data too
      if (parsed.location && typeof parsed.location === 'object') {
        console.log('🔧 Converting saved location object to string:', parsed.location);
        if (parsed.location.latitude && parsed.location.longitude) {
          parsed.location = `${parsed.location.latitude}, ${parsed.location.longitude}`;
        } else {
          parsed.location = 'Location coordinates provided';
        }
      }
      
      setPlaceInfo(parsed);
      setIsSaved(true);
      setUserLocation(parsed.userLocation || '');
      setLoading(false);
    } catch (error) {
      console.error('Error parsing saved data:', error);
      setError('Failed to load saved data');
      setLoading(false);
    }
  };

  const checkLimitsAndAnalyze = async () => {
    try {
      setLoading(true);
      
      // Check if user can perform analysis
      const canAnalyze = await canPerformAnalysis();
      
      if (!canAnalyze.canAnalyze) {
        // User has reached limit - show upgrade modal
        const stats = await getUsageStats();
        setUsageStats(stats);
        setShowLimitModal(true);
        setLoading(false);
        return;
      }
      
      // User can analyze - proceed
      await performAnalysis();
      
      // After successful analysis, use one analysis credit
      const analysisResult = await useAnalysis();
      console.log('Analysis used, remaining:', analysisResult.remainingAnalyses);
      
    } catch (error) {
      console.error('Error in limit check:', error);
      setError('Failed to check usage limits');
      setLoading(false);
    }
  };

  // Background enrichment function for Phase 2
  const enrichNearbyPlacesInBackground = async (nearbyPlaces: NearbyPlace[], locationData: any = null) => {
    try {
      // Batch state updates for better performance
      setNearbyPlacesEnriching(true);
      
      console.log('🔧 Phase 2: Enriching nearby places with Place IDs...');
      
      // Add small delay to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const enrichedPlaces = await enrichNearbyPlacesWithPlaceId(nearbyPlaces, locationData);
      
      console.log('✅ Phase 2: Places enrichment completed');
      
      // Batch all final state updates together
      requestAnimationFrame(() => {
        setPlaceInfo(prevInfo => {
          if (!prevInfo) return prevInfo;
          return {
            ...prevInfo,
            nearbyMustSeePlaces: enrichedPlaces.map((place: any) => ({
              ...place,
              isEnriched: true
            }))
          };
        });
        setNearbyPlacesEnriching(false);
      });
      
    } catch (error) {
      console.error('❌ Background enrichment failed:', error);
      // Ensure state is cleaned up even on error
      requestAnimationFrame(() => {
        setNearbyPlacesEnriching(false);
      });
    }
  };

  const performAnalysis = async () => {
    try {
      // Parse location data if available AND not from gallery
      let parsedLocationData = null;
      if (locationData && fromGallery !== 'true') {
        try {
          parsedLocationData = JSON.parse(locationData);
          const locationStr = parsedLocationData.address?.city || 
                            parsedLocationData.address?.region || 
                            'Location detected';
          setUserLocation(locationStr);
          
          // Extract coordinates for map functionality
          if (parsedLocationData.latitude && parsedLocationData.longitude) {
            setCurrentLocationCoords({
              latitude: parsedLocationData.latitude,
              longitude: parsedLocationData.longitude
            });
          }
        } catch (e) {
          console.log('Could not parse location data');
        }
      }
      
      const result = await analyzeHistoricalPlace(imageUri, parsedLocationData);
      
      // Phase 1: Show initial results immediately
      // Fix location object issue before setting state
      if (result.location && typeof result.location === 'object') {
        console.log('🔧 Converting location object to string:', result.location);
        if (result.location.latitude && result.location.longitude) {
          result.location = `${result.location.latitude}, ${result.location.longitude}`;
        } else {
          result.location = 'Location coordinates provided';
        }
      }
      
      // Set initial place info (without enriched nearby places)
      if (result.nearbyMustSeePlaces && result.nearbyMustSeePlaces.length > 0) {
        // Mark places as not enriched initially
        result.nearbyMustSeePlaces = result.nearbyMustSeePlaces.map((place: any) => ({
          ...place,
          latitude: typeof place.latitude === 'number' && !isNaN(place.latitude) ? place.latitude : 
                   (typeof place.latitude === 'string' && !isNaN(parseFloat(place.latitude))) ? parseFloat(place.latitude) : 0,
          longitude: typeof place.longitude === 'number' && !isNaN(place.longitude) ? place.longitude : 
                    (typeof place.longitude === 'string' && !isNaN(parseFloat(place.longitude))) ? parseFloat(place.longitude) : 0,
          mapsLink: place.latitude && place.longitude 
            ? `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`
            : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`,
          isEnriched: false
        }));
      }
      
      setPlaceInfo(result);
      
      // Phase 2: Enrich nearby places with Place IDs in background (deferred for performance)
      if (result.nearbyMustSeePlaces && result.nearbyMustSeePlaces.length > 0) {
        InteractionManager.runAfterInteractions(() => {
          enrichNearbyPlacesInBackground(result.nearbyMustSeePlaces, parsedLocationData);
        });
      }
    } catch (err) {
      setError(t.failedToAnalyze);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!placeInfo || saving) return;
    
    try {
      setSaving(true);
      
      // Safely handle location for saving
      let locationForSaving = placeInfo.location;
      if (typeof locationForSaving === 'object' && locationForSaving) {
        const locationObj = locationForSaving as any;
        if (locationObj.latitude && locationObj.longitude) {
          locationForSaving = `${locationObj.latitude}, ${locationObj.longitude}`;
        }
      }
      
      const dataToSave = {
        ...placeInfo,
        location: locationForSaving, // Ensure location is a string
        imageUri,
        userLocation: userLocation || locationForSaving,
        originalLocationData: locationData,
      };
      
      await saveHistoricalPlace(dataToSave);
      setIsSaved(true);
      
      Alert.alert(
        t.savedSuccess,
        t.savedMessage,
        [{ text: t.ok }]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert(
        t.error,
        t.failedToSave,
        [{ text: t.ok }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!placeInfo) return;
    
    try {
      // Safely handle location for sharing
      let locationText = placeInfo.location;
      if (typeof locationText === 'object' && locationText) {
        const locationObj = locationText as any;
        if (locationObj.latitude && locationObj.longitude) {
          locationText = `${locationObj.latitude}, ${locationObj.longitude}`;
        }
      }
      
      const shareText = `🏛️ ${placeInfo.name}\n\n${placeInfo.description}\n\n📍 ${locationText}\n\nDiscovered with LandmarkAI app!`;
      
      await Share.share({
        message: shareText,
        title: placeInfo.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePlacePress = async (place: NearbyPlace) => {
    try {
      await openInMaps(place, currentLocationCoords || undefined);
    } catch (error) {
      console.error('Error opening place in maps:', error);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowLimitModal(false);
    // Navigate to paywall screen with limit source
    router.push('/paywall?source=limit');
  };

  const handleTryAgain = () => {
    router.back();
  };

  // Limit Modal Component
  const LimitReachedModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLimitModal}
      onRequestClose={() => setShowLimitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.limitModalContent}>
          <Text style={styles.limitModalIcon}>📸</Text>
          <Text style={styles.limitModalTitle}>{t.analysisLimitReachedModal}</Text>
          <Text style={styles.limitModalSubtitle}>
            {t.usedFreeAnalysisModal.replace('{count}', String(usageStats?.totalAnalyses || 1))}
          </Text>
          
          <View style={styles.limitModalFeatures}>
            <Text style={styles.featureTitle}>{t.upgradeForPremium}</Text>
            <Text style={styles.featureItem}>{t.unlimitedAnalysisFeature}</Text>
            <Text style={styles.featureItem}>{t.priorityAIFeature}</Text>
            <Text style={styles.featureItem}>{t.advancedSavingFeature}</Text>
          </View>
          
          <View style={styles.limitModalButtons}>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgradeToPremium}
            >
              <Text style={styles.upgradeButtonText}>{t.upgradeToPremium}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={handleTryAgain}
            >
              <Text style={styles.backButtonText}>{t.goBack}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text>{t.noImageProvided}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Clean Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.analysisResult}</Text>
            <View style={styles.headerRight}>
              {placeInfo && !loading && (
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {fromSaved !== 'true' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, isSaved && styles.actionButtonSaved]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Ionicons 
                          name={isSaved ? "heart" : "heart-outline"} 
                          size={16} 
                          color={isSaved ? "#EF4444" : "#6B7280"} 
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        
        {loading && (
          <View style={styles.modernLoadingContainer}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingIcon}>
                <Animated.View style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnim }]
                  }
                ]}>
                  <Animated.View style={{
                    transform: [{ rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })}]
                  }}>
                    <Ionicons name="scan" size={28} color="#000000" />
                  </Animated.View>
                </Animated.View>
              </View>
              
              <View style={styles.loadingTextContainer}>
                <Text style={styles.loadingTitle}>
                  {fromSaved === 'true' ? t.loadingSaved : t.analyzing}
                </Text>
                <Text style={styles.loadingSubtitle}>
                  {fromSaved === 'true' ? t.retrievingInfo : t.aiIdentifying}
                </Text>
              </View>
              
              <View style={styles.progressDots}>
                <Animated.View style={[
                  styles.dot,
                  { opacity: fadeAnim }
                ]} />
                <Animated.View style={[
                  styles.dot,
                  { opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })}
                ]} />
                <Animated.View style={[
                  styles.dot,
                  { opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.8]
                  })}
                ]} />
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleTryAgain}>
              <Text style={styles.retryButtonText}>{t.tryAgain}</Text>
            </TouchableOpacity>
          </View>
        )}

        {placeInfo && !loading && (
          <View style={styles.contentSection}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.landmarkName}>{placeInfo.name}</Text>
              <Text style={styles.landmarkDescription}>{placeInfo.description}</Text>
            </View>
            
            {/* Details Cards Grid */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>{t.keyInformation}</Text>
              {placeInfo.location && (
                <View style={styles.modernDetailCard}>
                  <View style={styles.detailHeader}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="location" size={16} color="#000000" />
                    </View>
                    <Text style={styles.modernDetailLabel}>{t.location}</Text>
                  </View>
                  <Text style={styles.modernDetailValue}>{placeInfo.location}</Text>
                </View>
              )}
              
              {placeInfo.yearBuilt && (
                <View style={styles.modernDetailCard}>
                  <View style={styles.detailHeader}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#000000" />
                    </View>
                    <Text style={styles.modernDetailLabel}>{t.built}</Text>
                  </View>
                  <Text style={styles.modernDetailValue}>{placeInfo.yearBuilt}</Text>
                </View>
              )}
              
              {placeInfo.architecture && (
                <View style={styles.modernDetailCard}>
                  <View style={styles.detailHeader}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="business-outline" size={16} color="#000000" />
                    </View>
                    <Text style={styles.modernDetailLabel}>{t.architecture}</Text>
                  </View>
                  <Text style={styles.modernDetailValue}>{placeInfo.architecture}</Text>
                </View>
              )}
            </View>
            
            {/* Historical Significance Section */}
            {placeInfo.significance && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="star" size={12} color="#000000" />
                  </View>
                  <Text style={styles.sectionTitle}>{t.historicalSignificance}</Text>
                </View>
                <View style={styles.significanceCard}>
                  <Text style={styles.significanceText}>{placeInfo.significance}</Text>
                </View>
              </View>
            )}
            
            {/* Fun Facts Section */}
            {placeInfo.funFacts && placeInfo.funFacts.length > 0 && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.funFactsIconContainer}>
                    <Ionicons name="bulb" size={12} color="#10B981" />
                  </View>
                  <Text style={styles.sectionTitle}>{t.funFacts}</Text>
                </View>
                <View style={styles.modernFunFactsCard}>
                  {placeInfo.funFacts.map((fact, index) => (
                    <View key={index} style={styles.modernFunFactItem}>
                      <View style={styles.modernFunFactIcon}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                      <Text style={styles.modernFunFactText}>{fact}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Nearby Places Section */}
            {placeInfo.nearbyMustSeePlaces && placeInfo.nearbyMustSeePlaces.length > 0 && (
              <View style={styles.modernSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="map" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.nearbyHeaderContent}>
                    <Text style={styles.sectionTitle}>{t.nearbyMustSee}</Text>
                    {nearbyPlacesEnriching && (
                      <View style={styles.enrichmentStatus}>
                        <ActivityIndicator size="small" color="#4A90E2" />
                        <Text style={styles.enrichmentText}>{t.enhancingLinks}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <NearbyPlaces 
                  places={placeInfo.nearbyMustSeePlaces} 
                  onPlacePress={handlePlacePress}
                />
              </View>
            )}
            
            
            {fromSaved === 'true' && (
              <View style={styles.modernSection}>
                <TouchableOpacity 
                  style={styles.modernViewSavedButton}
                  onPress={() => router.push('/saved')}
                >
                  <View style={styles.viewSavedContent}>
                    <Ionicons name="library" size={20} color="#000000" />
                    <Text style={styles.modernViewSavedText}>{t.viewAllSaved}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Limit Reached Modal */}
      <LimitReachedModal />
      
      {/* Floating Ask AI Button */}
      {placeInfo && !loading && isChatServiceAvailable() && (
        <TouchableOpacity 
          style={styles.floatingAskAI}
          onPress={() => setShowChatModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={20} color="#ffffff" />
          <Text style={styles.floatingAskAIText}>{t.askAI}</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      {placeInfo && (
        <ChatModal
          visible={showChatModal}
          landmarkInfo={placeInfo}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Clean Header Styles
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
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 80,
    justifyContent: 'flex-end',
  },
  
  content: {
    flex: 1,
  },
  
  // Header actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonSaved: {
    backgroundColor: '#FEF2F2',
  },
  
  // Modern loading styles
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingIcon: {
    marginBottom: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#13a4ec',
  },
  
  // Floating Ask AI Button
  floatingAskAI: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13a4ec',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    gap: 8,
  },
  floatingAskAIText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Section headers
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  image: { 
    width: '100%', 
    height: 250, 
    resizeMode: 'cover' 
  },
  loadingContainer: { 
    padding: 40, 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 15, 
    fontSize: 16, 
    color: '#666' 
  },
  errorContainer: { 
    padding: 20, 
    alignItems: 'center' 
  },
  errorText: { 
    color: '#e74c3c', 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  retryButton: { 
    backgroundColor: '#4A90E2', 
    padding: 12, 
    borderRadius: 8 
  },
  retryButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  // New content layout
  contentContainer: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  imageMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  landmarkName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
  },
  landmarkDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  placeName: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 15 
  },
  placeDescription: { 
    fontSize: 16, 
    color: '#555', 
    lineHeight: 24, 
    marginBottom: 20 
  },
  detailsGrid: { 
    gap: 12
  },
  detailCard: { 
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#13a4ec', 
    flex: 1,
  },
  detailValue: { 
    fontSize: 14, 
    color: '#333', 
    fontWeight: '500' 
  },
  significanceContainer: { 
    marginTop: 20, 
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8 
  },
  significanceTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 10 
  },
  significanceText: { 
    fontSize: 16, 
    color: '#374151', 
    lineHeight: 25,
    fontWeight: '400'
  },
  funFactsContainer: { 
    marginTop: 20, 
    padding: 15, 
    backgroundColor: '#fff3cd', 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    borderLeftColor: '#ffc107' 
  },
  funFactsTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 10 
  },
  funFactItem: { 
    flexDirection: 'row', 
    marginBottom: 8, 
    alignItems: 'flex-start' 
  },
  funFactBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  funFactText: { 
    fontSize: 15, 
    color: '#555', 
    flex: 1, 
    lineHeight: 22 
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#13a4ec',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  savedButton: {
    backgroundColor: '#50C878',
  },
  savingButton: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#6c757d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chatButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewSavedButton: {
    backgroundColor: '#6C5CE7',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  viewSavedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  limitModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  limitModalIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  limitModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  limitModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  limitModalFeatures: {
    width: '100%',
    marginBottom: 30,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  limitModalButtons: {
    width: '100%',
    gap: 10,
  },
  upgradeButton: {
    backgroundColor: '#13a4ec',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalBackButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  backButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Nearby Places Styles
  nearbyPlacesContainer: {
    marginTop: 25,
  },
  nearbyPlacesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  nearbyPlacesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  enrichmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enrichmentText: {
    fontSize: 12,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  
  // Modern redesign styles
  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  
  detailsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  
  modernSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  
  sectionIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },
  
  modernDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  modernDetailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  
  modernDetailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 22,
  },
  
  significanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  
  modernFunFactsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  
  funFactsIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 2,
  },
  
  modernFunFactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  
  modernFunFactIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  
  modernFunFactText: {
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
    flex: 1,
    fontWeight: '400',
  },
  
  nearbyHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  modernLoadingContainer: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  
  modernViewSavedButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  viewSavedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  modernViewSavedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginLeft: 12,
  },
  
  analyzingAnimation: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  
  analyzeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  
  scanLine: {
    position: 'absolute',
    width: 80,
    height: 2,
    backgroundColor: '#13a4ec',
    borderRadius: 1,
  },
  
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  
  infoContainer: {
    padding: 20,
  },
});