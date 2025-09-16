import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { NearbyPlace } from '../types';

interface NearbyPlacesProps {
  places: NearbyPlace[];
  onPlacePress?: (place: NearbyPlace) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
}

// Component for place image with loading and fallback states
function PlaceImage({ place, isGrid = false }: { place: NearbyPlace, isGrid?: boolean }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!place.photoUrl || imageError) {
    // Fallback placeholder
    return (
      <View style={isGrid ? styles.gridImagePlaceholder : styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={isGrid ? 32 : 24} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={isGrid ? styles.gridImageContainer : styles.imageContainer}>
      <Image
        source={{ uri: place.photoUrl }}
        style={isGrid ? styles.gridPlaceImage : styles.placeImage}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        resizeMode="cover"
      />
      {imageLoading && (
        <View style={isGrid ? styles.gridImageLoader : styles.imageLoader}>
          <ActivityIndicator size="small" color="#13a4ec" />
        </View>
      )}
    </View>
  );
}

export function NearbyPlaces({ places, onPlacePress, currentLocation }: NearbyPlacesProps) {
  const [showMap, setShowMap] = useState(false);
  
  // Category colors for different place types
  const getCategoryColor = (placeType: string) => {
    const type = placeType.toLowerCase();
    if (type.includes('museum')) {
      return { backgroundColor: '#FEF3C7', textColor: '#92400E' }; // Yellow for museums
    } else if (type.includes('mosque') || type.includes('church') || type.includes('temple')) {
      return { backgroundColor: '#DBEAFE', textColor: '#1E40AF' }; // Blue for religious sites
    } else if (type.includes('palace') || type.includes('castle')) {
      return { backgroundColor: '#FCE7F3', textColor: '#BE185D' }; // Pink for palaces/castles
    } else if (type.includes('park') || type.includes('garden')) {
      return { backgroundColor: '#D1FAE5', textColor: '#047857' }; // Green for parks
    } else if (type.includes('market') || type.includes('bazaar')) {
      return { backgroundColor: '#FED7AA', textColor: '#C2410C' }; // Orange for markets
    } else {
      return { backgroundColor: '#E5E7EB', textColor: '#374151' }; // Gray for others
    }
  };

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
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.3, 0.01);
    const deltaLon = Math.max((maxLon - minLon) * 1.3, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLon,
    };
  };

  return (
    <View style={styles.container}>
      {/* Modern Toggle */}
      <View style={styles.modernToggle}>
        <TouchableOpacity
          style={[styles.toggleOption, !showMap && styles.toggleOptionActive]}
          onPress={() => setShowMap(false)}
        >
          <Ionicons 
            name="list" 
            size={16} 
            color={!showMap ? "#000000" : "#6B7280"} 
          />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, showMap && styles.toggleOptionActive]}
          onPress={() => setShowMap(true)}
        >
          <Ionicons 
            name="map" 
            size={16} 
            color={showMap ? "#000000" : "#6B7280"} 
          />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={getMapRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onMapReady={() => console.log('🗺️ Map loaded successfully')}
            onError={(error: any) => {
              console.warn('⚠️ Map error (non-critical):', error);
              // Don't crash the app - map errors are often non-critical
            }}
            loadingEnabled={true}
            loadingIndicatorColor="#000000"
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
          {places.map((place, index) => {
            const categoryColors = getCategoryColor(place.placeType);
            return (
              <TouchableOpacity
                key={index}
                style={styles.gridPlaceCard}
                onPress={() => onPlacePress?.(place)}
                activeOpacity={0.7}
              >
                {/* Large Place Image */}
                <PlaceImage place={place} isGrid={true} />
                
                {/* Content */}
                <View style={styles.gridContent}>
                  <Text style={styles.gridPlaceName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  
                  {/* Category and Distance Row */}
                  <View style={styles.gridInfoRow}>
                    <View style={[
                      styles.categoryTag, 
                      { backgroundColor: categoryColors.backgroundColor }
                    ]}>
                      <Text style={[
                        styles.categoryText,
                        { color: categoryColors.textColor }
                      ]} numberOfLines={1}>
                        {place.placeType}
                      </Text>
                    </View>
                    
                    <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={12} color="#6B7280" />
                      <Text style={styles.gridDistance}>
                        {place.approximateDistance}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Description */}
                  {place.description && (
                    <Text style={styles.gridDescription} numberOfLines={2}>
                      {place.description}
                    </Text>
                  )}
                  
                  {/* Rating */}
                  {place.rating && (
                    <View style={styles.gridRatingContainer}>
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <Text style={styles.gridRatingText}>{place.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  
  // Modern Toggle Design
  modernToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '600',
  },

  // Map Styles
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },

  // List Styles
  placesContainer: {
    gap: 12,
  },
  
  // Grid Styles
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridPlaceCard: {
    width: '48%', // Two cards per row with gap
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  gridPlaceImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gridImageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  gridContent: {
    padding: 12,
  },
  gridPlaceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  gridInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '60%',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridDistance: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  gridDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  gridRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  gridRatingText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  modernPlaceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  modernPlaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modernPlaceType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modernPlaceDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 4,
  },
  modernDistance: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  arrowContainer: {
    marginLeft: 8,
  },

  // Image Styles
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },

  // Rating and bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});