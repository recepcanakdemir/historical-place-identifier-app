// services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saved_historical_places';
const ONBOARDING_KEY = 'has_completed_onboarding';

export const saveHistoricalPlace = async (placeData) => {
  try {
    const existingSaves = await getSavedPlaces();
    const newSave = {
      id: Date.now().toString(),
      ...placeData,
      savedAt: new Date().toISOString(),
    };
    
    const updatedSaves = [newSave, ...existingSaves];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSaves));
    return newSave.id;
  } catch (error) {
    console.error('Error saving place:', error);
    throw error;
  }
};

export const getSavedPlaces = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error getting saved places:', error);
    return [];
  }
};

export const deleteSavedPlace = async (id) => {
  try {
    const existingSaves = await getSavedPlaces();
    const filtered = existingSaves.filter(place => place.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting saved place:', error);
    throw error;
  }
};

// Onboarding functions
export const hasCompletedOnboarding = async () => {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const markOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    throw error;
  }
};

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
};