import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NearbyPlace } from '../types';

interface NearbyPlacesProps {
  places: NearbyPlace[];
  onPlacePress?: (place: NearbyPlace) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
}

export function NearbyPlaces({ places, onPlacePress, currentLocation }: NearbyPlacesProps) {
  const [showMap, setShowMap] = useState(false);

  if (!places || places.length === 0) {
    return null;
  }

  // Calculate map region based on places and current location
  const getMapRegion = () => {
    // Filter out invalid coordinates (0,0) and ensure they're numbers
    const validPoints = places
      .filter(p => p.latitude && p.longitude && p.latitude !== 0 && p.longitude !== 0)
      .map(p => ({ 
        latitude: Number(p.latitude), 
        longitude: Number(p.longitude) 
      }));
      
    if (currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      validPoints.push({
        latitude: Number(currentLocation.latitude),
        longitude: Number(currentLocation.longitude)
      });
    }

    if (validPoints.length === 0) {
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const latitudes = validPoints.map(point => point.latitude);
    const longitudes = validPoints.map(point => point.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = (maxLat - minLat) * 1.5 || 0.05;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Nearby Must-See Places</Text>
        <Text style={styles.subtitle}>
          Discover interesting places within walking distance
        </Text>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(false)}
          >
            <Text style={[styles.toggleButtonText, !showMap && styles.toggleButtonTextActive]}>
              📋 List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(true)}
          >
            <Text style={[styles.toggleButtonText, showMap && styles.toggleButtonTextActive]}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={getMapRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onMapReady={() => console.log('🗺️ Map loaded successfully')}
            onError={(error) => {
              console.warn('⚠️ Map error (non-critical):', error);
              // Don't crash the app - map errors are often non-critical
            }}
            loadingEnabled={true}
            loadingIndicatorColor="#4A90E2"
            loadingBackgroundColor="rgba(255,255,255,0.8)"
          >
            {places
              .filter(place => place.latitude && place.longitude && place.latitude !== 0 && place.longitude !== 0)
              .map((place, index) => (
                <Marker
                  key={`place-${index}`}
                  coordinate={{
                    latitude: Number(place.latitude),
                    longitude: Number(place.longitude),
                  }}
                  title={place.name}
                  description={`${place.approximateDistance} • ${place.placeType}`}
                  onPress={() => onPlacePress?.(place)}
                />
              ))}
            {currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0 && (
              <Marker
                key="current-location"
                coordinate={{
                  latitude: Number(currentLocation.latitude),
                  longitude: Number(currentLocation.longitude)
                }}
                title="Your Location"
                description="You are here"
                pinColor="blue"
              />
            )}
          </MapView>
        </View>
      ) : (
        <View style={styles.placesGrid}>
          {places.map((place, index) => (
            <TouchableOpacity
              key={index}
              style={styles.placeCard}
              onPress={() => onPlacePress?.(place)}
              activeOpacity={0.7}
            >
              <View style={styles.placeHeader}>
                <View style={styles.placeNameContainer}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <Text style={styles.placeType}>
                    {getPlaceTypeEmoji(place.placeType)} {place.placeType}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => onPlacePress?.(place)}
                >
                  <Text style={styles.locationIcon}>📍</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.placeDescription} numberOfLines={2}>
                {place.description}
              </Text>
              
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>
                  🚶‍♂️ {place.approximateDistance}
                </Text>
                <Text style={styles.tapHint}>Tap to open in maps</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const getPlaceTypeEmoji = (placeType: string): string => {
  const type = placeType.toLowerCase();
  if (type.includes('museum')) return '🏛️';
  if (type.includes('park')) return '🌳';
  if (type.includes('historical') || type.includes('history')) return '🏛️';
  if (type.includes('church') || type.includes('cathedral') || type.includes('mosque')) return '⛪';
  if (type.includes('monument')) return '🗿';
  if (type.includes('castle')) return '🏰';
  if (type.includes('market')) return '🏪';
  if (type.includes('viewpoint') || type.includes('scenic')) return '🌄';
  if (type.includes('bridge')) return '🌉';
  if (type.includes('tower')) return '🗼';
  return '📍';
};

// Map dimensions can be calculated dynamically if needed

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#e8f3ff',
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4A90E2',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A90E2',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  placesGrid: {
    gap: 12,
    marginTop: 10,
  },
  placeCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeNameContainer: {
    flex: 1,
    marginRight: 10,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  placeType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A90E2',
    backgroundColor: '#e8f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  locationButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  locationIcon: {
    fontSize: 18,
    color: 'white',
  },
  placeDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A90E2',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tapHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
});