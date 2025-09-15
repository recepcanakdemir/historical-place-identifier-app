import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation } from '../services/locationService';

export default function CameraScreen() {
  const { locationEnabled: locationParam } = useLocalSearchParams<{ locationEnabled?: string }>();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [locationEnabled] = useState<boolean | null>(
    locationParam ? locationParam === 'true' : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const captureAnimValue = useRef(new Animated.Value(1)).current;
  const flashAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);


  const getLocationWithTimeout = async (timeoutMs: number = 5000): Promise<any> => {
    return Promise.race([
      getCurrentLocation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location timeout')), timeoutMs)
      )
    ]);
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        
        // Haptic feedback
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          // Fallback to vibration
          Vibration.vibrate(50);
        }

        // Capture animation
        Animated.sequence([
          Animated.timing(captureAnimValue, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(captureAnimValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Flash animation if flash is on
        if (flashMode === 'on' || flashMode === 'auto') {
          Animated.sequence([
            Animated.timing(flashAnimValue, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(flashAnimValue, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        if (photo) {
          let locationData = null;
          
          // Handle location capture based on user preference
          if (locationEnabled === true) {
            try {
              setIsGettingLocation(true);
              console.log('📍 Capturing location for enhanced analysis...');
              locationData = await getLocationWithTimeout();
              console.log('📍 Location captured successfully:', locationData);
            } catch (error) {
              console.log('📍 Location capture failed:', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setIsGettingLocation(false);
            }
          } else {
            console.log('📍 Location disabled by user preference');
          }

          // Navigate to result with photo and optional location data
          const params: any = { imageUri: photo.uri };
          if (locationData) {
            params.locationData = JSON.stringify(locationData);
          }
          
          console.log('📸 Navigating to result with params:', params);
          router.push({
            pathname: '/result',
            params
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const toggleFlash = () => {
    const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
    
    try {
      Haptics.selectionAsync();
    } catch (e) {
      // Haptics not available
    }
  };

  const toggleCamera = () => {
    setFacing(current => current === 'back' ? 'front' : 'back');
    
    try {
      Haptics.selectionAsync();
    } catch (e) {
      // Haptics not available
    }
  };


  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.permissionSafeArea}>
          <View style={styles.permissionHeader}>
            <TouchableOpacity 
              style={styles.permissionBackButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.permissionContent}>
            <View style={styles.permissionIconContainer}>
              <Ionicons name="camera" size={64} color="#000000" />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to analyze historical places and landmarks.
            </Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => {
                Alert.alert(
                  'Camera Permission',
                  'Please enable camera access in Settings > LandmarkAI > Camera',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Settings', onPress: () => {/* Open settings */} }
                  ]
                );
              }}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Flash overlay */}
      <Animated.View 
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnimValue,
          }
        ]}
        pointerEvents="none"
      />

      {/* Camera View */}
      <CameraView 
        style={styles.camera} 
        ref={cameraRef}
        facing={facing}
        flash={flashMode}
      >
        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity 
            style={styles.topButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.topCenter}>
            <Text style={styles.modeText}>Photo</Text>
            {/* Location Status Indicator */}
            <View style={styles.locationIndicator}>
              {isGettingLocation ? (
                <Text style={styles.locationStatus}>📍 Getting location...</Text>
              ) : locationEnabled === true ? (
                <Text style={styles.locationStatus}>📍 Location enabled</Text>
              ) : locationEnabled === false ? (
                <Text style={styles.locationStatus}>📍 Location disabled</Text>
              ) : null}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.topButton, flashMode !== 'off' && styles.activeButton]}
            onPress={toggleFlash}
          >
            <Ionicons 
              name={flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash' : 'flash-outline'} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Gallery Button */}
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => {
              // Quick gallery access could be added here
              router.back();
            }}
          >
            <Ionicons name="images" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Capture Button */}
          <Animated.View
            style={[
              styles.captureButtonContainer,
              {
                transform: [{ scale: captureAnimValue }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturing && styles.captureButtonActive
              ]}
              onPress={takePicture}
              disabled={isCapturing}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </Animated.View>

          {/* Flip Camera Button */}
          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCamera}
          >
            <Ionicons name="camera-reverse" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Center Guide */}
        <View style={styles.centerGuide}>
          <View style={[styles.guideCorner, styles.topLeft]} />
          <View style={[styles.guideCorner, styles.topRight]} />
          <View style={[styles.guideCorner, styles.bottomLeft]} />
          <View style={[styles.guideCorner, styles.bottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsBubble}>
            <Text style={styles.instructionsText}>
              📸 Point at a historical building or monument
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionSafeArea: {
    flex: 1,
  },
  permissionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  permissionBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  permissionText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '400',
    paddingHorizontal: 8,
  },
  settingsButton: {
    backgroundColor: '#13a4ec',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 200,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Camera Styles
  camera: {
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  
  // Top Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.6)',
    borderColor: 'rgba(124, 58, 237, 0.8)',
  },
  topCenter: {
    alignItems: 'center',
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationIndicator: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  locationStatus: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
    paddingTop: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  // Capture Button
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  
  // Flip Button
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  // Center Guide
  centerGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginTop: -100,
    marginLeft: -100,
  },
  guideCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  
  // Instructions
  instructionsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsBubble: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});