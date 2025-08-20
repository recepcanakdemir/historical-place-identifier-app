import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: 'Historical Place Finder' }} 
      />
      <Stack.Screen 
        name="camera" 
        options={{ title: 'Take Photo' }} 
      />
      <Stack.Screen 
        name="result" 
        options={{ title: 'Place Information' }} 
      />
    </Stack>
  );
}
