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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { analyzeHistoricalPlace } from '../services/visionService';

interface PlaceInfo {
  name: string;
  description: string;
  location?: string;
  yearBuilt?: string;
  significance?: string;
  architecture?: string;
  funFacts?: string[];
}

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [loading, setLoading] = useState(true);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageUri) {
      analyzePlaceFromImage();
    }
  }, [imageUri]);

  const analyzePlaceFromImage = async () => {
    try {
      setLoading(true);
      const result = await analyzeHistoricalPlace(imageUri);
      setPlaceInfo(result);
    } catch (err) {
      setError('Failed to analyze the image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tryAgain = () => {
    router.back();
  };

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
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={tryAgain}>
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
                  <Text style={styles.detailLabel}>🏗️ Built</Text>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Add all the styles from the original artifact here...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  errorContainer: { padding: 20, alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#4A90E2', padding: 12, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  infoContainer: { padding: 20 },
  placeName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  placeDescription: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 20 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 15, gap: 10 },
  detailCard: { backgroundColor: 'white', padding: 12, borderRadius: 8, minWidth: '45%', flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#4A90E2', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  significanceContainer: { marginTop: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 },
  significanceTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  significanceText: { fontSize: 16, color: '#555', lineHeight: 24 },
  funFactsContainer: { marginTop: 20, padding: 15, backgroundColor: '#fff3cd', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107' },
  funFactsTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  funFactItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  funFactBullet: { fontSize: 16, color: '#ffc107', marginRight: 8, marginTop: 2 },
  funFactText: { fontSize: 15, color: '#555', flex: 1, lineHeight: 22 },
});