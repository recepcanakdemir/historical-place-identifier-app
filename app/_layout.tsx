// app/_layout.tsx - Updated with RevenueCat initialization
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializePurchases } from '../services/subscriptionService';

export default function RootLayout() {
  
  useEffect(() => {
    // Initialize RevenueCat when app starts
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Initialize subscription service
        await initializePurchases();
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="camera" 
          options={{ title: 'Take Photo' }} 
        />
        <Stack.Screen 
          name="result" 
          options={{ title: 'Place Information' }} 
        />
        <Stack.Screen 
          name="saved" 
          options={{ title: 'Saved Places' }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ title: 'Settings' }} 
        />
        <Stack.Screen 
          name="premium" 
          options={{ 
            title: 'Premium',
            presentation: 'modal'
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}