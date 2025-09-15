// components/SplashScreen.tsx - Modern AI Theme Loading Screen
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onLoadingComplete?: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Main animation sequence
    const animationSequence = Animated.sequence([
      // Logo appears with scale and fade
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Text slides up and appears
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]);

    // Start animations
    pulseAnimation.start();
    animationSequence.start(() => {
      // Call completion callback after animation
      setTimeout(() => {
        onLoadingComplete?.();
      }, 500);
    });

    // Cleanup
    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo with Animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) }
              ],
            },
          ]}
        >
          <Image 
            source={require('../assets/images/paywall_and_index_icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name and Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>LandmarkAI</Text>
          <Text style={styles.tagline}>Discover History with AI</Text>
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View 
          style={[
            styles.progressContainer,
            { opacity: textOpacity },
          ]}
        >
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: progressWidth },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#13a4ec',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '500',
    letterSpacing: 1,
  },
});