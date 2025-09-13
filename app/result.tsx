// app/result.tsx - Updated with Paywall Integration
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { saveHistoricalPlace } from '../services/storageService';
import { canPerformAnalysis, getUsageStats, useAnalysis } from '../services/usageService';
import { analyzeHistoricalPlace } from '../services/visionService';
import { enrichNearbyPlaces, enrichNearbyPlacesWithPlaceId } from '../services/placesService';
import { PlaceInfo, UsageStats, NearbyPlace } from '../types';
import { NearbyPlaces } from '../components/NearbyPlaces';
import { ChatModal } from '../components/ChatModal';
import { openInMaps } from '../utils/mapUtils';
import { isChatServiceAvailable } from '../services/chatService';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ 
    imageUri: string;
    locationData?: string;
    savedData?: string;
    fromSaved?: string;
    fromGallery?: string;
  }>();
  
  // Debug params to find any objects
  console.log('🔍 PARAMS INSPECTION:');
  Object.keys(params).forEach(key => {
    const value = params[key];
    console.log(`  ${key}:`, typeof value, value);
    if (typeof value === 'object') {
      console.error(`❌ FOUND OBJECT in params.${key}:`, value);
    }
  });
  
  const { imageUri, locationData, savedData, fromSaved, fromGallery } = params;
  
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
  const [enrichmentProgress, setEnrichmentProgress] = useState<{ completed: number; total: number } | null>(null);
  
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
      const result = await useAnalysis();
      console.log('Analysis used, remaining:', result.remainingAnalyses);
      
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
      setEnrichmentProgress({ completed: 0, total: nearbyPlaces.length });
      
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
            nearbyMustSeePlaces: enrichedPlaces.map(place => ({
              ...place,
              isEnriched: true
            }))
          };
        });
        setNearbyPlacesEnriching(false);
        setEnrichmentProgress(null);
      });
      
    } catch (error) {
      console.error('❌ Background enrichment failed:', error);
      // Ensure state is cleaned up even on error
      requestAnimationFrame(() => {
        setNearbyPlacesEnriching(false);
        setEnrichmentProgress(null);
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
        result.nearbyMustSeePlaces = result.nearbyMustSeePlaces.map(place => ({
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
      setError('Failed to analyze the image. Please try again.');
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
      if (typeof locationForSaving === 'object' && locationForSaving?.latitude && locationForSaving?.longitude) {
        locationForSaving = `${locationForSaving.latitude}, ${locationForSaving.longitude}`;
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
        'Saved!',
        'This landmark has been saved to your collection.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert(
        'Error',
        'Failed to save this place. Please try again.',
        [{ text: 'OK' }]
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
      if (typeof locationText === 'object' && locationText?.latitude && locationText?.longitude) {
        locationText = `${locationText.latitude}, ${locationText.longitude}`;
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
          <Text style={styles.limitModalTitle}>Analysis Limit Reached</Text>
          <Text style={styles.limitModalSubtitle}>
            You&apos;ve used your {usageStats?.totalAnalyses || 1} free analysis!
          </Text>
          
          <View style={styles.limitModalFeatures}>
            <Text style={styles.featureTitle}>Upgrade to Premium for:</Text>
            <Text style={styles.featureItem}>✨ Unlimited analyses</Text>
            <Text style={styles.featureItem}>🚀 Priority AI processing</Text>
            <Text style={styles.featureItem}>💾 Advanced saving features</Text>
          </View>
          
          <View style={styles.limitModalButtons}>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgradeToPremium}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleTryAgain}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text>No image provided</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        {/* Location banner - only for camera photos */}
        {userLocation && fromGallery !== 'true' && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationBannerText}>📍 {userLocation}</Text>
          </View>
        )}
        
        {/* Gallery banner */}
        {fromGallery === 'true' && (
          <View style={styles.galleryBanner}>
            <Text style={styles.galleryBannerText}>🖼️ Analyzed from gallery image</Text>
          </View>
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>
              {fromSaved === 'true' ? 'Loading saved data...' : 'Analyzing image...'}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleTryAgain}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {placeInfo && !loading && (
          <View style={styles.infoContainer}>
            <Text style={styles.placeName}>{placeInfo.name}</Text>
            <Text style={styles.placeDescription}>{placeInfo.description}</Text>
            
            <View style={styles.detailsGrid}>
              {placeInfo.location && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>📍 Location</Text>
                  <Text style={styles.detailValue}>{placeInfo.location}</Text>
                </View>
              )}
              
              {placeInfo.yearBuilt && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>🗓️ Built</Text>
                  <Text style={styles.detailValue}>{placeInfo.yearBuilt}</Text>
                </View>
              )}
              
              {placeInfo.architecture && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>🏛️ Architecture</Text>
                  <Text style={styles.detailValue}>{placeInfo.architecture}</Text>
                </View>
              )}
            </View>
            
            {placeInfo.significance && (
              <View style={styles.significanceContainer}>
                <Text style={styles.significanceTitle}>🎯 Historical Significance</Text>
                <Text style={styles.significanceText}>{placeInfo.significance}</Text>
              </View>
            )}
            
            {placeInfo.funFacts && placeInfo.funFacts.length > 0 && (
              <View style={styles.funFactsContainer}>
                <Text style={styles.funFactsTitle}>💡 Fun Facts</Text>
                {placeInfo.funFacts.map((fact, index) => (
                  <View key={index} style={styles.funFactItem}>
                    <Text style={styles.funFactBullet}>•</Text>
                    <Text style={styles.funFactText}>{fact}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Nearby Places Section */}
            {placeInfo.nearbyMustSeePlaces && placeInfo.nearbyMustSeePlaces.length > 0 && (
              <View style={styles.nearbyPlacesContainer}>
                <View style={styles.nearbyPlacesHeader}>
                  <Text style={styles.nearbyPlacesTitle}>🗺️ Nearby Must-See Places</Text>
                  {nearbyPlacesEnriching && (
                    <View style={styles.enrichmentStatus}>
                      <ActivityIndicator size="small" color="#4A90E2" />
                      <Text style={styles.enrichmentText}>Enhancing links...</Text>
                    </View>
                  )}
                </View>
                <NearbyPlaces 
                  places={placeInfo.nearbyMustSeePlaces} 
                  onPlacePress={handlePlacePress}
                />
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {fromSaved !== 'true' && (
                <TouchableOpacity 
                  style={[
                    styles.saveButton, 
                    isSaved && styles.savedButton,
                    saving && styles.savingButton
                  ]}
                  onPress={handleSave}
                  disabled={isSaved || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {isSaved ? '✓ Saved' : '💾 Save Place'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Text style={styles.shareButtonText}>📤 Share Discovery</Text>
              </TouchableOpacity>
              
              {/* Ask AI Chat Button */}
              {placeInfo && isChatServiceAvailable() && (
                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={() => setShowChatModal(true)}
                >
                  <Text style={styles.chatButtonText}>🤖 Ask AI</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {fromSaved === 'true' && (
              <TouchableOpacity 
                style={styles.viewSavedButton}
                onPress={() => router.push('/saved')}
              >
                <Text style={styles.viewSavedButtonText}>📚 View All Saved Places</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Limit Reached Modal */}
      <LimitReachedModal />
      
      {/* Chat Modal */}
      {placeInfo && (
        <ChatModal
          visible={showChatModal}
          landmarkInfo={placeInfo}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  scrollView: { 
    flex: 1 
  },
  image: { 
    width: '100%', 
    height: 250, 
    resizeMode: 'cover' 
  },
  locationBanner: {
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    padding: 10,
    alignItems: 'center',
  },
  locationBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  galleryBanner: {
    backgroundColor: 'rgba(80, 200, 120, 0.9)',
    padding: 10,
    alignItems: 'center',
  },
  galleryBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
  infoContainer: { 
    padding: 20 
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
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginVertical: 15, 
    gap: 10 
  },
  detailCard: { 
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 8, 
    minWidth: '45%', 
    flex: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  detailLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4A90E2', 
    marginBottom: 4 
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
    color: '#555', 
    lineHeight: 24 
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
    fontSize: 16, 
    color: '#ffc107', 
    marginRight: 8, 
    marginTop: 2 
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
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#9b59b6',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
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
});