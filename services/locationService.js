// services/locationService.js
import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  try {
    // Check current permission status first
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    // Request permission only if not already granted
    if (existingStatus !== 'granted') {
      console.log('📍 Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('📍 Location permission denied:', finalStatus);
      return null;
    }

    console.log('📍 Getting current location...');
    
    // Get current position with timeout
    const location = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location timeout')), 10000)
      )
    ]);

    console.log('📍 Location obtained:', location.coords.latitude, location.coords.longitude);

    // Get address from coordinates (with error handling)
    let address = null;
    try {
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      address = addressResult[0] || null;
      console.log('📍 Address resolved:', address?.city || 'Unknown city');
    } catch (addressError) {
      console.warn('⚠️ Address resolution failed:', addressError.message);
      // Continue without address - location coordinates are still useful
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: address,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Error getting location:', error.message);
    
    // Provide specific error messages
    if (error.message.includes('timeout')) {
      console.log('⏰ Location request timed out');
    } else if (error.message.includes('denied')) {
      console.log('🚫 Location access denied by user');
    } else if (error.message.includes('unavailable')) {
      console.log('📍 Location services unavailable');
    }
    
    return null;
  }
};

export const formatLocationForAI = (locationData) => {
  if (!locationData || !locationData.address) return '';
  
  const addr = locationData.address;
  const parts = [];
  
  if (addr.street) parts.push(addr.street);
  if (addr.city) parts.push(addr.city);
  if (addr.region) parts.push(addr.region);
  if (addr.country) parts.push(addr.country);
  
  return parts.join(', ');
};