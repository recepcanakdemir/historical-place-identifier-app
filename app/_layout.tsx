// app/_layout.tsx - Updated Routes
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { endFreeTrialSession } from '../services/accessService';
import { initializePurchases } from '../services/subscriptionService';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Clear free trial session on app restart
        await endFreeTrialSession();
        console.log('🧹 Free trial session cleared on app start');
        
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

  if (isLoading) {
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
            color: '#666',
            textAlign: 'center' 
          }}>
            Starting Historical Places...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
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
            title: 'Take Photo',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="result" 
          options={{ 
            title: 'Place Information',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="saved" 
          options={{ 
            title: 'Saved Places',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            headerShown: true
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}