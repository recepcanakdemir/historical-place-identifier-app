// components/OnboardingFlow.tsx - Onboarding Flow for First-Time Users
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { markOnboardingComplete } from '../services/storageService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Animated Icons Components
const AnimatedLogoIcon = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scan2Anim = useRef(new Animated.Value(0)).current;
  const bracketsAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        // Logo pulse and glow start
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          // Corner brackets animate
          Animated.timing(bracketsAnim, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Multiple scan lines
        Animated.parallel([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(scan2Anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
        // Brackets return and result popup
        Animated.parallel([
          Animated.timing(bracketsAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(resultAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1000),
        // Reset all animations
        Animated.parallel([
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(scan2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(resultAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ])
    );
    sequence.start();

    return () => sequence.stop();
  }, []);

  return (
    <View style={styles.iconContainer}>
      {/* Logo with Glow Effect */}
      <Animated.View style={[
        styles.logoContainer, 
        { 
          transform: [{ scale: pulseAnim }],
        }
      ]}>
        <Animated.View style={[
          styles.logoGlow,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          }
        ]} />
        <Image
          source={require('../assets/images/paywall_and_index_icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
      
      {/* Corner Brackets (Scanning Viewfinder) */}
      <Animated.View
        style={[
          styles.scanBrackets,
          {
            transform: [{ scale: bracketsAnim }],
            opacity: bracketsAnim.interpolate({
              inputRange: [0.8, 1],
              outputRange: [1, 0.6],
            }),
          },
        ]}
      >
        <View style={[styles.bracket, styles.bracketTopLeft]} />
        <View style={[styles.bracket, styles.bracketTopRight]} />
        <View style={[styles.bracket, styles.bracketBottomLeft]} />
        <View style={[styles.bracket, styles.bracketBottomRight]} />
      </Animated.View>
      
      {/* Primary Scan Line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            opacity: scanAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [{
              translateY: scanAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-70, 70],
              }),
            }],
          },
        ]}
      />
      
      {/* Secondary Scan Line */}
      <Animated.View
        style={[
          styles.scanLine2,
          {
            opacity: scan2Anim.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.8, 0.8, 0],
            }),
            transform: [{
              translateY: scan2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-40, 40],
              }),
            }],
          },
        ]}
      />
      
      {/* Result Popup */}
      <Animated.View
        style={[
          styles.resultPopup,
          {
            opacity: resultAnim,
            transform: [{ scale: resultAnim }],
          },
        ]}
      >
        <Ionicons name="document-text" size={24} color="#10B981" />
        <Text style={styles.resultText}>Eiffel Tower</Text>
      </Animated.View>
    </View>
  );
};

const AnimatedMapIcon = () => {
  const mapAnim = useRef(new Animated.Value(0)).current;
  const pin1Anim = useRef(new Animated.Value(0)).current;
  const pin2Anim = useRef(new Animated.Value(0)).current;
  const pin3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        // Map zoom in
        Animated.timing(mapAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Pins dropping with stagger
        Animated.stagger(200, [
          Animated.spring(pin1Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(pin2Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(pin3Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        // Reset
        Animated.parallel([
          Animated.timing(mapAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pin1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pin2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pin3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ])
    );
    sequence.start();

    return () => sequence.stop();
  }, []);

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.mapIcon, { transform: [{ scale: mapAnim }] }]}>
        <Ionicons name="map" size={60} color="#3B82F6" />
      </Animated.View>
      
      {/* Location Pins */}
      <Animated.View
        style={[
          styles.pin,
          styles.pin1,
          {
            opacity: pin1Anim,
            transform: [{ scale: pin1Anim }, { translateY: pin1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}],
          },
        ]}
      >
        <Ionicons name="location" size={20} color="#EF4444" />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.pin,
          styles.pin2,
          {
            opacity: pin2Anim,
            transform: [{ scale: pin2Anim }, { translateY: pin2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}],
          },
        ]}
      >
        <Ionicons name="location" size={20} color="#F59E0B" />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.pin,
          styles.pin3,
          {
            opacity: pin3Anim,
            transform: [{ scale: pin3Anim }, { translateY: pin3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}],
          },
        ]}
      >
        <Ionicons name="location" size={20} color="#10B981" />
      </Animated.View>
    </View>
  );
};

const AnimatedChatIcon = () => {
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        // Typing indicator
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Chat bubbles appearing
        Animated.stagger(400, [
          Animated.spring(bubble1Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bubble2Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bubble3Anim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        // Reset
        Animated.parallel([
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bubble1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bubble2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bubble3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ])
    );
    sequence.start();

    return () => sequence.stop();
  }, []);

  return (
    <View style={styles.iconContainer}>
      <View style={styles.chatIcon}>
        <Ionicons name="chatbubbles" size={60} color="#10B981" />
      </View>
      
      {/* Typing Indicator */}
      <Animated.View
        style={[
          styles.typingIndicator,
          {
            opacity: typingAnim,
            transform: [{ scale: typingAnim }],
          },
        ]}
      >
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
      </Animated.View>
      
      {/* Chat Bubbles */}
      <Animated.View
        style={[
          styles.chatBubble,
          styles.bubble1,
          {
            opacity: bubble1Anim,
            transform: [{ scale: bubble1Anim }, { translateY: bubble1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.bubbleText}>Built in 1173</Text>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.chatBubble,
          styles.bubble2,
          {
            opacity: bubble2Anim,
            transform: [{ scale: bubble2Anim }, { translateY: bubble2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.bubbleText}>Pisa Tower</Text>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.chatBubble,
          styles.bubble3,
          {
            opacity: bubble3Anim,
            transform: [{ scale: bubble3Anim }, { translateY: bubble3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.bubbleText}>UNESCO Site</Text>
      </Animated.View>
    </View>
  );
};

const onboardingScreens = [
  {
    id: 1,
    title: 'Discover History with AI',
    description: 'Take a photo of any landmark and get instant historical insights powered by artificial intelligence',
    icon: AnimatedLogoIcon,
    color: '#13a4ec',
  },
  {
    id: 2,
    title: 'Explore Nearby Attractions',
    description: 'Find museums, historic sites, and cultural landmarks around your location with detailed information',
    icon: AnimatedMapIcon,
    color: '#3B82F6',
  },
  {
    id: 3,
    title: 'Chat with AI Assistant',
    description: 'Get detailed answers about history, architecture, and fascinating facts through intelligent conversations',
    icon: AnimatedChatIcon,
    color: '#10B981',
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentPage < onboardingScreens.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * screenWidth,
        animated: true,
      });
      setCurrentPage(nextPage);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await markOnboardingComplete();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Scroll View */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentPage(pageIndex);
        }}
        style={styles.scrollView}
      >
        {onboardingScreens.map((screen, index) => {
          const IconComponent = screen.icon;
          return (
            <View key={screen.id} style={styles.page}>
              <View style={styles.content}>
                <IconComponent />
                
                <View style={styles.textContent}>
                  <Text style={[styles.title, { color: screen.color }]}>
                    {screen.title}
                  </Text>
                  <Text style={styles.description}>
                    {screen.description}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottom}>
        {/* Page Indicators */}
        <View style={styles.indicators}>
          {onboardingScreens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPage && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.actionButtonText}>
            {currentPage === onboardingScreens.length - 1 ? 'Start Exploring' : 'Next'}
          </Text>
          <Ionicons 
            name={currentPage === onboardingScreens.length - 1 ? 'rocket' : 'arrow-forward'} 
            size={16} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: screenWidth,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  
  // Logo Animation Styles
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  logoGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    backgroundColor: '#13a4ec',
    borderRadius: 32,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  scanBrackets: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bracket: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#13a4ec',
    borderWidth: 3,
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    width: 100,
    height: 3,
    backgroundColor: '#13a4ec',
    borderRadius: 1.5,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  scanLine2: {
    position: 'absolute',
    width: 80,
    height: 2,
    backgroundColor: '#13a4ec',
    borderRadius: 1,
    opacity: 0.7,
  },
  resultPopup: {
    position: 'absolute',
    top: -20,
    right: 10,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Map Animation Styles
  mapIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    position: 'absolute',
  },
  pin1: {
    top: 40,
    left: 30,
  },
  pin2: {
    top: 60,
    right: 40,
  },
  pin3: {
    top: 80,
    left: 60,
  },
  
  // Chat Animation Styles
  chatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingIndicator: {
    position: 'absolute',
    top: 90,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  chatBubble: {
    position: 'absolute',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bubble1: {
    top: -30,
    left: -20,
  },
  bubble2: {
    top: -10,
    right: -30,
  },
  bubble3: {
    top: 10,
    left: 10,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  
  // Text Styles
  textContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  
  // Bottom Section
  bottom: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 32,
  },
  indicators: {
    flexDirection: 'row',
    gap: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeIndicator: {
    backgroundColor: '#13a4ec',
    width: 24,
  },
  actionButton: {
    backgroundColor: '#13a4ec',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 8,
    minWidth: 200,
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});