// app/index.tsx - Fixed Animation Version
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentLanguage, getUITexts } from '../services/languageService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [uiTexts, setUITexts] = useState(getUITexts('en'));
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const insets = useSafeAreaInsets();

  // Load language when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadLanguage();
    }, [])
  );

  const loadLanguage = async () => {
    try {
      const language = await getCurrentLanguage();
      setCurrentLang(language);
      setUITexts(getUITexts(language));
      console.log('Home screen language loaded:', language);
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const takePhoto = () => {
    closeMenu();
    setTimeout(() => router.push('/camera'), 100);
  };

  const pickImage = async () => {
    closeMenu();
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        router.push({
          pathname: '/result',
          params: { 
            imageUri: result.assets[0].uri,
            fromGallery: 'true'
          }
        });
      }
    }, 100);
  };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const navigateToSaved = () => {
    closeMenu();
    setTimeout(() => router.push('/saved'), 200);
  };

  const navigateToSettings = () => {
    closeMenu();
    setTimeout(() => router.push('/settings'), 200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={openMenu}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{uiTexts.appName || 'Historical Places'}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoEmoji}>🏛️</Text>
          </View>
        </View>

        <Text style={styles.title}>{uiTexts.discoverHistory || 'Discover History'}</Text>
        <Text style={styles.subtitle}>
          {uiTexts.subtitle || 'Explore monuments and landmarks with AI-powered historical insights'}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>📷</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>{uiTexts.takePhoto || 'Take Photo'}</Text>
                <Text style={styles.buttonSubtext}>{uiTexts.withLocation || 'with location detection'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🖼️</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>{uiTexts.chooseGallery || 'Choose from Gallery'}</Text>
                <Text style={styles.buttonSubtext}>{uiTexts.analyzeAny || 'analyze any image'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>{uiTexts.languagesSupported || '10+ languages supported'}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>{uiTexts.locationAware || 'Location-aware analysis'}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💾</Text>
            <Text style={styles.featureText}>{uiTexts.saveDiscoveries || 'Save your discoveries'}</Text>
          </View>
        </View>
      </View>

      {/* Hamburger Menu Modal */}
      {menuVisible && (
        <Modal
          animationType="none"
          transparent={true}
          visible={menuVisible}
          onRequestClose={closeMenu}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackground} 
              onPress={closeMenu}
              activeOpacity={1}
            />
            
            <Animated.View 
              style={[
                styles.menuContainer,
                { 
                  transform: [{ translateX: slideAnim }],
                  paddingTop: insets.top, // iPhone çentik için
                }
              ]}
            >
              <View style={[styles.menuHeader, { marginTop: 0 }]}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuItems}>
                <TouchableOpacity style={styles.menuItem} onPress={navigateToSaved}>
                  <Text style={styles.menuIcon}>💾</Text>
                  <Text style={styles.menuItemText}>Saved Places</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>Historical Place Finder</Text>
                  <Text style={styles.menuFooterSubtext}>v1.0.0</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburgerButton: {
    width: 30,
    height: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#50C878',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#50C878',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  featuresList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalBackground: {
    flex: 1,
  },
  menuContainer: {
    width: 280,
    backgroundColor: 'white',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#4A90E2',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: '#999',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  menuFooter: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  menuFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  menuFooterSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});