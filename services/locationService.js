// services/locationService.js
import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Get address from coordinates
    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: address[0],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error getting location:', error);
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