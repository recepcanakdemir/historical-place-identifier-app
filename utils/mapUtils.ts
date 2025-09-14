import { Alert, Linking, Platform } from 'react-native';
import { NearbyPlace } from '../types';

export const openInMaps = async (place: NearbyPlace, currentLocation?: { latitude: number; longitude: number }) => {
  try {
    // Priority order: Platform-specific coordinate links for best reliability
    const linkFormats = [];
    
    // Primary: Platform-optimized coordinate links
    if (place.mapsLinks) {
      if (Platform.OS === 'ios' && place.mapsLinks.ios) {
        linkFormats.push(place.mapsLinks.ios);
      }
      if (place.mapsLinks.universal) {
        linkFormats.push(place.mapsLinks.universal);
      }
      if (place.mapsLinks.googleWithName) {
        linkFormats.push(place.mapsLinks.googleWithName);
      }
      if (place.mapsLinks.mobileApp) {
        linkFormats.push(place.mapsLinks.mobileApp);
      }
    }
    
    // Secondary: Fallback to main maps link if available
    if (place.mapsLink && !linkFormats.includes(place.mapsLink)) {
      linkFormats.push(place.mapsLink);
    }
    
    // Try each link format until one works
    for (const link of linkFormats) {
      try {
        console.log('🗺️ Trying coordinate-based map link:', link);
        const canOpenLink = await Linking.canOpenURL(link);
        if (canOpenLink) {
          await Linking.openURL(link);
          console.log('✅ Successfully opened coordinate-based map link');
          return;
        }
      } catch (linkError) {
        console.log('⚠️ Failed to open link:', link, linkError.message);
      }
    }
    
    console.log('⚠️ No maps link available, falling back to coordinates');
    
    // Fallback to coordinate-based navigation if maps link fails
    if (place.latitude && place.longitude) {
      let url: string;
      
      if (Platform.OS === 'ios') {
        // Apple Maps with exact coordinates
        if (currentLocation) {
          // Directions from current location to exact coordinates
          url = `http://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${place.latitude},${place.longitude}&dirflg=w`;
        } else {
          // Just show the exact location with optional label
          const placeLabel = encodeURIComponent(place.name);
          url = `http://maps.apple.com/?ll=${place.latitude},${place.longitude}&q=${placeLabel}`;
        }
        
        const canOpenAppleMaps = await Linking.canOpenURL(url);
        if (canOpenAppleMaps) {
          await Linking.openURL(url);
          return;
        }
      }
      
      // Google Maps with exact coordinates (fallback for iOS, primary for Android)
      if (currentLocation) {
        // Directions from current location to exact coordinates
        url = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${place.latitude},${place.longitude}`;
      } else {
        // Just show the exact location
        url = `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`;
      }
      
      const canOpenGoogleMaps = await Linking.canOpenURL(url);
      if (canOpenGoogleMaps) {
        await Linking.openURL(url);
        return;
      }
    }
    
    // Last resort - text search
    console.log('⚠️ No coordinates available, falling back to text search');
    const fallbackQuery = encodeURIComponent(`${place.name} ${place.placeType}`);
    const url = `https://www.google.com/maps/search/${fallbackQuery}`;
    await Linking.openURL(url);
    
  } catch (error) {
    console.error('Error opening maps:', error);
    Alert.alert(
      'Maps Error',
      'Unable to open maps application. Please search for this place manually in your preferred maps app.',
      [{ text: 'OK' }]
    );
  }
};

export const getDirectionsUrl = (place: NearbyPlace, currentLocation?: { latitude: number; longitude: number }): string => {
  // Priority: Platform-optimized coordinate-based links
  if (place.mapsLinks) {
    // iOS: Prefer Apple Maps with coordinates
    if (Platform.OS === 'ios' && place.mapsLinks.ios) {
      return place.mapsLinks.ios;
    }
    // Universal: Coordinate-based Google Maps
    if (place.mapsLinks.universal) {
      return place.mapsLinks.universal;
    }
    // With place name context
    if (place.mapsLinks.googleWithName) {
      return place.mapsLinks.googleWithName;
    }
    // Directions mode if current location available
    if (currentLocation && place.mapsLinks.directions) {
      return place.mapsLinks.directions(currentLocation.latitude, currentLocation.longitude);
    }
  }
  
  // Fallback to main maps link
  if (place.mapsLink) {
    return place.mapsLink;
  }
  
  // Fallback to coordinate-based URLs
  if (place.latitude && place.longitude) {
    if (Platform.OS === 'ios') {
      if (currentLocation) {
        // Apple Maps directions with exact coordinates
        return `http://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${place.latitude},${place.longitude}&dirflg=w`;
      } else {
        // Just show the exact location
        const placeLabel = encodeURIComponent(place.name);
        return `http://maps.apple.com/?ll=${place.latitude},${place.longitude}&q=${placeLabel}`;
      }
    } else {
      if (currentLocation) {
        // Google Maps directions with exact coordinates
        return `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${place.latitude},${place.longitude}`;
      } else {
        // Just show the exact location
        return `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`;
      }
    }
  }
  
  // Last resort - text search
  const fallbackQuery = encodeURIComponent(`${place.name} ${place.placeType}`);
  
  if (Platform.OS === 'ios') {
    if (currentLocation) {
      return `http://maps.apple.com/?q=${fallbackQuery}&saddr=${currentLocation.latitude},${currentLocation.longitude}&dirflg=w`;
    } else {
      return `http://maps.apple.com/?q=${fallbackQuery}`;
    }
  } else {
    if (currentLocation) {
      return `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${fallbackQuery}`;
    } else {
      return `https://www.google.com/maps/search/${fallbackQuery}`;
    }
  }
};