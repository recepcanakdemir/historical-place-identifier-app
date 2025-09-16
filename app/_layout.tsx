// app/_layout.tsx - Updated with Onboarding and Language Context
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from '../components/SplashScreen';
import OnboardingFlow from '../components/OnboardingFlow';
import { LanguageProvider } from '../contexts/LanguageContext';
import { initializePurchases } from '../services/subscriptionService';
import { hasCompletedOnboarding } from '../services/storageService';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Note: Free trial session should persist across app restarts
        // Only clear when user actually uses their free analysis
        
        // Initialize subscription service
        await initializePurchases();
        
        // Just finish loading - let each screen handle its own logic
        setIsLoading(false);
        console.log('✅ App ready');
        
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const handleSplashComplete = async () => {
    // Check onboarding status before hiding splash
    try {
      const hasCompleted = await hasCompletedOnboarding();
      console.log('🔍 Onboarding completed:', hasCompleted);
      
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingChecked(true);
    }
    
    // Hide splash after onboarding check
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show custom splash screen first
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onLoadingComplete={handleSplashComplete} />
      </SafeAreaProvider>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  // Show loading only if app is still initializing AND splash is complete
  if (isLoading && !showSplash) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#FFFFFF' 
        }}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ 
            marginTop: 16, 
            fontSize: 16, 
            color: '#333',
            textAlign: 'center' 
          }}>
            Finalizing setup...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="paywall" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="camera" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="result" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="saved" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              headerShown: false
            }} 
          />
        </Stack>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}