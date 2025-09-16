// services/placesService.js - Firebase Functions Proxy Version
import Constants from 'expo-constants';

// Safe coordinate parsing to prevent NaN values that cause CoreGraphics errors
const safeParseCoordinate = (value) => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Configuration - Firebase Functions Proxy
const PLACES_CONFIG = {
  FUNCTIONS_URL: 'https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy',
  TIMEOUT: 15000, // Increased for server-side processing
  PHOTO_CACHE: new Map() // Cache photo URLs to reduce server calls
};

console.log('🔑 Places API using Firebase Functions proxy');

// Helper function to create Google Maps URL with coordinates (reliable navigation)
const createMapsUrl = (placeId, placeName, latitude, longitude) => {
  // If coordinates available, use coordinate-based link (more reliable)
  if (latitude && longitude) {
    const lat = safeParseCoordinate(latitude);
    const lng = safeParseCoordinate(longitude);
    const safeName = encodeURIComponent(placeName || 'Location');
    return `https://maps.google.com/@${lat},${lng},17z`;
  }
  // Fallback to Place ID if no coordinates (legacy support)
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
};

// Helper function to get place photos via Firebase proxy
const getPlacePhotos = async (placeId) => {
  try {
    console.log('📸 Fetching photos for place ID via Firebase:', placeId);
    
    if (!placeId) {
      return null;
    }

    // Call Firebase Functions proxy for place details
    const response = await fetch(PLACES_CONFIG.FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'details',
        placeId: placeId,
        fields: 'photos'
      }),
      timeout: PLACES_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      throw new Error(`Places proxy error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result?.photos) {
      console.log('📸 No photos found for place:', placeId);
      return null;
    }

    const photos = data.result.photos.slice(0, 5); // Limit to 5 photos
    
    // Generate photo URLs that point to our Firebase proxy
    const photoData = photos.map(photo => {
      const photoUrl = `${PLACES_CONFIG.FUNCTIONS_URL}?endpoint=photo&query=${photo.photo_reference}`;
      
      const photoObj = {
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        url: photoUrl // Direct proxy URL that serves the image
      };
      
      // Cache for performance
      PLACES_CONFIG.PHOTO_CACHE.set(photo.photo_reference, photoObj);
      return photoObj;
    });

    console.log('✅ Found', photoData.length, 'photos for place');
    return {
      photos: photoData,
      primaryPhotoUrl: photoData[0]?.url // First photo as primary
    };

  } catch (error) {
    console.error('❌ Error fetching place photos:', error);
    return null;
  }
};

// Search for a place using Firebase Functions proxy
const searchPlace = async (placeName, location = null) => {
  try {
    console.log('🔍 Searching for place via Firebase:', placeName);
    
    // Build request for Firebase proxy
    const requestBody = {
      endpoint: 'textsearch',
      query: placeName
    };
    
    // Add location bias if provided
    if (location && location.latitude && location.longitude) {
      requestBody.locationBias = {
        lat: location.latitude,
        lng: location.longitude,
        radius: 5000
      };
    }

    console.log('🌐 Sending request to Firebase Places proxy');

    const response = await fetch(PLACES_CONFIG.FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: PLACES_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase proxy error:', response.status, errorText);
      throw new Error(`Firebase proxy error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Firebase proxy response status:', data.status);

    if (data.error) {
      console.error('❌ Places API error from Firebase:', data.error);
      throw new Error(data.error);
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('⚠️ No results found for:', placeName, 'Status:', data.status);
      return null;
    }

    const place = data.results[0]; // Get the first result
    console.log('✅ Found place via Firebase:', place.name);

    // Fetch photos for this place
    const photoData = await getPlacePhotos(place.place_id);

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry?.location,
      mapsUrl: createMapsUrl(place.place_id, place.name, place.geometry?.location?.lat, place.geometry?.location?.lng),
      rating: place.rating,
      types: place.types,
      photoUrl: photoData?.primaryPhotoUrl,
      photos: photoData?.photos
    };

  } catch (error) {
    console.error('❌ Error searching place via Firebase:', error);
    return null;
  }
};

// Enrich nearby places with Google Places data
export const enrichNearbyPlaces = async (nearbyPlaces, currentLocation = null) => {
  console.log('🔧 Enriching', nearbyPlaces?.length || 0, 'nearby places with Places API');
  
  if (!nearbyPlaces || nearbyPlaces.length === 0) {
    return nearbyPlaces;
  }

  // Firebase proxy is always available - no API key check needed on client
  console.log('🔧 Using Firebase Functions proxy for Places API');

  // Process places in parallel with rate limiting
  const enrichedPlaces = await Promise.allSettled(
    nearbyPlaces.map(async (place, index) => {
      // Add small delay to avoid rate limiting
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      try {
        const placeData = await searchPlace(place.name, currentLocation);
        
        if (placeData) {
          return {
            ...place,
            placeId: placeData.placeId,
            mapsLink: placeData.mapsUrl,
            // Keep original coordinates as backup - ensure they're numbers
            latitude: typeof (placeData.location?.lat) === 'number' ? placeData.location.lat : 
                     typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude) || 0,
            longitude: typeof (placeData.location?.lng) === 'number' ? placeData.location.lng : 
                      typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude) || 0,
            address: placeData.address,
            rating: placeData.rating,
            photoUrl: placeData.photoUrl,
            photos: placeData.photos,
            isEnriched: true
          };
        } else {
          // Fallback to original data with coordinate-based URL
          return {
            ...place,
            // Ensure coordinates are numbers, not objects
            latitude: typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude) || 0,
            longitude: typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude) || 0,
            mapsLink: place.latitude && place.longitude 
              ? `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`
              : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`
          };
        }
      } catch (error) {
        console.error('❌ Error enriching place:', place.name, error);
        
        if (error.message?.includes('Places API not enabled')) {
          console.error('🚨 CRITICAL: Google Places API is not enabled!');
          console.error('📋 Fix Steps:');
          console.error('   1. Go to https://console.cloud.google.com/');
          console.error('   2. Select your project');
          console.error('   3. Go to APIs & Services > Library');
          console.error('   4. Search for "Places API" and enable it');
          console.error('   5. Wait 2-3 minutes for propagation');
        }
        
        // Return original place with fallback URL
        return {
          ...place,
          // Ensure coordinates are numbers, not objects
          latitude: typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude) || 0,
          longitude: typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude) || 0,
          mapsLink: place.latitude && place.longitude 
            ? `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`
            : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`
        };
      }
    })
  );

  // Extract successful results and create fallbacks for failed ones
  const results = enrichedPlaces.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Create fallback place for failed enrichment
      const originalPlace = nearbyPlaces[index];
      console.warn(`⚠️ Failed to enrich place: ${originalPlace.name}`, result.reason);
      return {
        ...originalPlace,
        // Ensure coordinates are numbers, not objects
        latitude: safeParseCoordinate(originalPlace.latitude),
        longitude: safeParseCoordinate(originalPlace.longitude),
        mapsLink: originalPlace.latitude && originalPlace.longitude 
          ? `https://www.google.com/maps/@${originalPlace.latitude},${originalPlace.longitude},15z`
          : `https://www.google.com/maps/search/${encodeURIComponent(originalPlace.name)}`
      };
    }
  });

  const successCount = enrichedPlaces.filter(result => result.status === 'fulfilled').length;
  console.log(`✅ Successfully enriched ${successCount}/${nearbyPlaces.length} places`);

  return results;
};

// Get place details by place ID via Firebase proxy
export const getPlaceDetails = async (placeId) => {
  try {
    console.log('📋 Getting details via Firebase for place ID:', placeId);
    
    const response = await fetch(PLACES_CONFIG.FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'details',
        placeId: placeId,
        fields: 'name,formatted_address,geometry,rating,reviews,photos,opening_hours,website,formatted_phone_number'
      }),
      timeout: PLACES_CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase proxy error:', response.status, errorText);
      throw new Error(`Firebase proxy error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ Places API error from Firebase:', data.error);
      throw new Error(data.error);
    }

    if (data.status !== 'OK' || !data.result) {
      throw new Error(`Place details not found: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error('❌ Error getting place details via Firebase:', error);
    throw error;
  }
};

// Get Place ID from place name via Firebase proxy
export const getPlaceIdFromName = async (placeName, city = null) => {
  try {
    console.log('🔍 Getting Place ID via Firebase for:', placeName);
    
    // Build search query - prioritize "name, city" format
    let query = placeName;
    if (city && !placeName.includes(',')) {
      query = `${placeName}, ${city}`;
    }

    console.log('🌐 Sending findplacefromtext request to Firebase proxy');

    const response = await fetch(PLACES_CONFIG.FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'findplacefromtext',
        query: query,
        fields: 'place_id,name,geometry,formatted_address'
      }),
      timeout: PLACES_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase proxy error:', response.status, errorText);
      throw new Error(`Firebase proxy error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Firebase proxy response status:', data.status);

    if (data.error) {
      console.error('❌ Places API error from Firebase:', data.error);
      return null;
    }

    if (data.status !== 'OK' || !data.candidates || data.candidates.length === 0) {
      console.log('⚠️ No Place ID found for:', placeName, 'Status:', data.status);
      return null;
    }

    const place = data.candidates[0];
    console.log('✅ Found Place ID via Firebase for:', place.name);

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry?.location,
      // Generate coordinate-based map links (reliable navigation)
      mapsLink: createMapsLinkFromCoordinates(place.name, place.geometry?.location?.lat, place.geometry?.location?.lng)
    };

  } catch (error) {
    console.error('❌ Error getting Place ID via Firebase:', error);
    return null;
  }
};

// Helper function to create reliable coordinate-based map links (like successful iOS apps)
const createMapsLinkFromCoordinates = (placeName, latitude, longitude) => {
  // Ensure coordinates are valid numbers
  const lat = safeParseCoordinate(latitude);
  const lng = safeParseCoordinate(longitude);
  const safeName = encodeURIComponent(placeName || 'Location');
  
  return {
    // iOS optimized - Apple Maps with place name and exact coordinates
    ios: `http://maps.apple.com/?q=${safeName}&ll=${lat},${lng}`,
    // Android/Universal - Google Maps with coordinates (direct navigation)
    universal: `https://maps.google.com/@${lat},${lng},17z`,
    // Alternative Google Maps format with place context
    googleWithName: `https://maps.google.com/?q=${safeName}&ll=${lat},${lng}`,
    // Google Maps app deep link with coordinates
    mobileApp: `comgooglemaps://?center=${lat},${lng}&zoom=17&q=${safeName}`,
    // Directions mode (if current location available)
    directions: (currentLat, currentLng) => 
      `https://maps.google.com/maps?saddr=${currentLat},${currentLng}&daddr=${lat},${lng}`,
  };
};

// Enhanced nearby places enrichment with Place ID resolution
export const enrichNearbyPlacesWithPlaceId = async (nearbyPlaces, currentLocation = null) => {
  console.log('🔧 Enriching', nearbyPlaces?.length || 0, 'nearby places with Place IDs');
  
  if (!nearbyPlaces || nearbyPlaces.length === 0) {
    return nearbyPlaces;
  }

  // Firebase proxy is always available - no API key check needed on client
  console.log('🔧 Using Firebase Functions proxy for enhanced Places enrichment');

  // Process places in parallel with rate limiting
  const enrichedPlaces = await Promise.allSettled(
    nearbyPlaces.map(async (place, index) => {
      // Add small delay to avoid rate limiting
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      try {
        // Extract city from place name if it includes comma format
        const [placeName, city] = place.name.includes(',') ? place.name.split(',').map(s => s.trim()) : [place.name, null];
        
        const placeData = await getPlaceIdFromName(placeName, city);
        
        if (placeData && placeData.placeId) {
          // Fetch photos for this place
          const photoData = await getPlacePhotos(placeData.placeId);
          // Use verified coordinates from Places API (more precise than AI coordinates)
          const placesApiLat = placeData.location?.lat;
          const placesApiLng = placeData.location?.lng;
          const aiLat = safeParseCoordinate(place.latitude);
          const aiLng = safeParseCoordinate(place.longitude);
          
          const finalLat = placesApiLat || aiLat;
          const finalLng = placesApiLng || aiLng;
          const finalName = placeData.name || place.name;
          
          // Log coordinate source for debugging accuracy
          const usingPlacesApi = !!(placesApiLat && placesApiLng);
          console.log(`📍 ${finalName}: Using ${usingPlacesApi ? 'Places API' : 'AI'} coordinates (${finalLat}, ${finalLng})`);
          
          // Create coordinate-based links (reliable navigation)
          const coordinateLinks = createMapsLinkFromCoordinates(finalName, finalLat, finalLng);
          
          return {
            ...place,
            placeId: placeData.placeId,
            mapsLink: coordinateLinks.universal, // Primary coordinate-based link
            mapsLinks: coordinateLinks, // All coordinate-based link types
            latitude: finalLat,
            longitude: finalLng,
            address: placeData.address,
            verifiedName: finalName,
            photoUrl: photoData?.primaryPhotoUrl,
            photos: photoData?.photos,
            isEnriched: true // Mark as enriched with Places API data
          };
        } else {
          // Fallback to coordinate-based links using AI coordinates
          const fallbackLat = safeParseCoordinate(place.latitude);
          const fallbackLng = safeParseCoordinate(place.longitude);
          
          if (fallbackLat && fallbackLng) {
            const coordinateLinks = createMapsLinkFromCoordinates(place.name, fallbackLat, fallbackLng);
            return {
              ...place,
              latitude: fallbackLat,
              longitude: fallbackLng,
              mapsLink: coordinateLinks.universal,
              mapsLinks: coordinateLinks,
              isEnriched: false // Using AI coordinates only
            };
          } else {
            // Last resort - text search (should rarely happen)
            return {
              ...place,
              latitude: 0,
              longitude: 0,
              mapsLink: `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`,
              isEnriched: false
            };
          }
        }
      } catch (error) {
        console.error('❌ Error enriching place:', place.name, error);
        
        // Return original place with fallback URL
        return {
          ...place,
          latitude: typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude) || 0,
          longitude: typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude) || 0,
          mapsLink: place.latitude && place.longitude 
            ? `https://www.google.com/maps/@${place.latitude},${place.longitude},15z`
            : `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`
        };
      }
    })
  );

  // Extract successful results and create fallbacks for failed ones
  const results = enrichedPlaces.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Create fallback place for failed enrichment
      const originalPlace = nearbyPlaces[index];
      console.warn(`⚠️ Failed to enrich place: ${originalPlace.name}`, result.reason);
      return {
        ...originalPlace,
        latitude: safeParseCoordinate(originalPlace.latitude),
        longitude: safeParseCoordinate(originalPlace.longitude),
        mapsLink: originalPlace.latitude && originalPlace.longitude 
          ? `https://www.google.com/maps/@${originalPlace.latitude},${originalPlace.longitude},15z`
          : `https://www.google.com/maps/search/${encodeURIComponent(originalPlace.name)}`
      };
    }
  });

  const successCount = enrichedPlaces.filter(result => result.status === 'fulfilled').length;
  const placeIdCount = results.filter(place => place.placeId).length;
  console.log(`✅ Successfully enriched ${successCount}/${nearbyPlaces.length} places`);
  console.log(`🆔 Found Place IDs for ${placeIdCount}/${nearbyPlaces.length} places`);

  return results;
};

// Check if Places API proxy is configured
export const isPlacesApiConfigured = () => {
  return Boolean(PLACES_CONFIG.FUNCTIONS_URL);
};