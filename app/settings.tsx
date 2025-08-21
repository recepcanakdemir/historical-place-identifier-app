// app/settings.tsx - Completely Fixed Version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { router } from 'expo-router';
import {
  SUPPORTED_LANGUAGES,
  getCurrentLanguage,
  changeLanguage,
  resetToDeviceLanguage,
  getDeviceLanguage,
  getUITexts,
} from '../services/languageService';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function SettingsScreen() {
  const [currentLang, setCurrentLang] = useState('en');
  const [deviceLang, setDeviceLang] = useState('en');
  const [modalVisible, setModalVisible] = useState(false);
  const [uiTexts, setUITexts] = useState(getUITexts('en'));

  // Manual backup if import fails
  const MANUAL_LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  // Use imported or manual
  const languagesToUse = SUPPORTED_LANGUAGES?.length > 0 ? SUPPORTED_LANGUAGES : MANUAL_LANGUAGES;

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const current = await getCurrentLanguage();
      const device = getDeviceLanguage();
      
      console.log('Loaded language settings:', { current, device });
      setCurrentLang(current);
      setDeviceLang(device);
      setUITexts(getUITexts(current));
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  };

  const openLanguageModal = () => {
    console.log('=== Opening Language Modal ===');
    console.log('SUPPORTED_LANGUAGES import:', SUPPORTED_LANGUAGES);
    console.log('SUPPORTED_LANGUAGES type:', typeof SUPPORTED_LANGUAGES);
    console.log('SUPPORTED_LANGUAGES length:', SUPPORTED_LANGUAGES?.length);
    
    // Manual test data
    const testLanguages = [
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
    ];
    console.log('Test languages:', testLanguages);
    
    setModalVisible(true);
    console.log('Modal opened, new modalVisible should be true');
  };

  const closeLanguageModal = () => {
    console.log('=== Closing Language Modal ===');
    setModalVisible(false);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      console.log('Changing language to:', languageCode);
      await changeLanguage(languageCode);
      setCurrentLang(languageCode);
      setUITexts(getUITexts(languageCode));
      closeLanguageModal();
      
      Alert.alert(
        getUITexts(languageCode).languageChanged,
        getUITexts(languageCode).languageChangedMessage,
        [{ text: getUITexts(languageCode).ok }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleResetToDevice = async () => {
    try {
      const deviceLanguage = await resetToDeviceLanguage();
      setCurrentLang(deviceLanguage);
      setUITexts(getUITexts(deviceLanguage));
      
      Alert.alert(
        getUITexts(deviceLanguage).languageChanged,
        getUITexts(deviceLanguage).languageChangedMessage,
        [{ text: getUITexts(deviceLanguage).ok }]
      );
    } catch (error) {
      console.error('Error resetting language:', error);
    }
  };

  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang) || SUPPORTED_LANGUAGES[1];
  };

  const getDeviceLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === deviceLang) || SUPPORTED_LANGUAGES[1];
  };

  const renderLanguageItem: ListRenderItem<Language> = ({ item, index }) => {
    console.log(`Rendering item ${index}:`, item);
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          item.code === currentLang && styles.selectedLanguageItem
        ]}
        onPress={() => {
          console.log('Language selected:', item.code);
          handleLanguageChange(item.code);
        }}
      >
        <Text style={styles.languageFlag}>{item.flag}</Text>
        <Text style={[
          styles.languageName,
          item.code === currentLang && styles.selectedLanguageName
        ]}>
          {item.name}
        </Text>
        {item.code === currentLang && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  console.log('Settings render - modalVisible:', modalVisible);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{uiTexts.settings}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{uiTexts.language}</Text>
          
          {/* Current Language */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{uiTexts.currentLanguage}</Text>
              <Text style={styles.settingValue}>
                {getCurrentLanguageInfo().flag} {getCurrentLanguageInfo().name}
              </Text>
            </View>
          </View>

          {/* Change Language Button */}
          <TouchableOpacity
            style={styles.settingButton}
            onPress={openLanguageModal}
          >
            <Text style={styles.settingButtonText}>{uiTexts.changeLanguage}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {/* Reset to Device Language */}
          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleResetToDevice}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingButtonText}>{uiTexts.resetToDevice}</Text>
              <Text style={styles.deviceLanguageText}>
                {getDeviceLanguageInfo().flag} {getDeviceLanguageInfo().name}
              </Text>
            </View>
            <Text style={styles.arrow}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← {uiTexts.ok}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeLanguageModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={closeLanguageModal}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{uiTexts.selectLanguage}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeLanguageModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            
            <FlatList
              data={languagesToUse}
              renderItem={renderLanguageItem}
              keyExtractor={(item, index) => `lang-${item.code}-${index}`}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }} // Ensure content fills
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  settingItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  deviceLanguageText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#666',
  },
  footer: {
    padding: 20,
    marginTop: 40,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    height: '70%', // Fixed height instead of maxHeight
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden', // Important for content clipping
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa', // Slight background to see it
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Background to see it
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  languageList: {
    flex: 1, // Take remaining space
    backgroundColor: 'white', // Ensure white background
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white', // Explicit white background
    minHeight: 60, // Minimum height to ensure visibility
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f8ff',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedLanguageName: {
    fontWeight: '600',
    color: '#4A90E2',
  },
  checkmark: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugContainer: {
    padding: 10,
    backgroundColor: '#ffffcc',
    margin: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
  },
});