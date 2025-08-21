// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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
      </Stack>
    </SafeAreaProvider>
  );
}