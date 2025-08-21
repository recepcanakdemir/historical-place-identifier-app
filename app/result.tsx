// app/result.tsx - Updated with Usage Limits
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { analyzeHistoricalPlace } from '../services/visionService';
import { saveHistoricalPlace } from '../services/storageService';
import { canPerformAnalysis, useAnalysis, getUsageStats } from '../services/usageService';
import { PlaceInfo, UsageStats } from '../types';

export default function ResultScreen() {
  const { imageUri, locationData, savedData, fromSaved, fromGallery } = useLocalSearchParams<{ 
    imageUri: string;
    locationData?: string;
    savedData?: string;
    fromSaved?: string;
    fromGallery?: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  
  // Usage tracking states
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

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
        } catch (e) {
          console.log('Could not parse location data');
        }
      }
      
      const result = await analyzeHistoricalPlace(imageUri, parsedLocationData);
      setPlaceInfo(result);
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
      
      const dataToSave = {
        ...placeInfo,
        imageUri,
        userLocation: userLocation || placeInfo.location,
        originalLocationData: locationData,
      };
      
      await saveHistoricalPlace(dataToSave);
      setIsSaved(true);
      
      Alert.alert(
        'Saved!',
        'This historical place has been saved to your collection.',
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
      const shareText = `🏛️ ${placeInfo.name}\n\n${placeInfo.description}\n\n📍 ${placeInfo.location}\n\nDiscovered with Historical Place Finder app!`;
      
      await Share.share({
        message: shareText,
        title: placeInfo.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowLimitModal(false);
    // Navigate to premium screen (we'll create this next)
    router.push('/premium');
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
            You've used all {usageStats?.totalAnalyses || 3} free analyses!
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
});