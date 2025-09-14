// app/settings.tsx - Completely Fixed TypeScript Version
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  ListRenderItem,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SUPPORTED_LANGUAGES,
  changeLanguage,
  getCurrentLanguage,
  getDeviceLanguage,
  getUITexts,
  resetToDeviceLanguage,
} from '../services/languageService';
import { checkSubscriptionStatus, restorePurchases } from '../services/subscriptionService';
import { getUsageStats, resetUsage } from '../services/usageService';
// IMPORT EKLENDİ:
import { Language, SubscriptionStatus, UsageStats } from '../types';

export default function SettingsScreen() {
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [deviceLang, setDeviceLang] = useState<string>('en');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [uiTexts, setUITexts] = useState(getUITexts('en'));

  // Premium states with proper types
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Manual backup if import fails
  const MANUAL_LANGUAGES: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  // Use imported or manual with proper typing
  const languagesToUse: Language[] = SUPPORTED_LANGUAGES?.length > 0 ? SUPPORTED_LANGUAGES : MANUAL_LANGUAGES;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);

      // Load language settings
      const current = await getCurrentLanguage();
      const device = getDeviceLanguage();

      setCurrentLang(current);
      setDeviceLang(device);
      setUITexts(getUITexts(current));

      // Load usage stats with type checking
      const stats = await getUsageStats();
      if (stats && typeof stats === 'object') {
        setUsageStats(stats as UsageStats);
      }

      // Load subscription status with type checking
      const subStatus = await checkSubscriptionStatus();
      if (subStatus && typeof subStatus === 'object') {
        setSubscriptionStatus(subStatus as SubscriptionStatus);
      }

      console.log('Settings loaded:', { current, device, stats, subStatus });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLanguageModal = (): void => {
    setModalVisible(true);
  };

  const closeLanguageModal = (): void => {
    setModalVisible(false);
  };

  const handleLanguageChange = async (languageCode: string): Promise<void> => {
    try {
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

  const handleResetToDevice = async (): Promise<void> => {
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

  const handleUpgradeToPremium = (): void => {
    router.push('/paywall?source=settings');
  };

  const handleRestorePurchases = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await restorePurchases();

      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh subscription status with type checking
        const newStatus = await checkSubscriptionStatus();
        if (newStatus && typeof newStatus === 'object') {
          setSubscriptionStatus(newStatus as SubscriptionStatus);
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsage = (): void => {
    Alert.alert(
      'Reset Usage Data',
      'This will reset your usage statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetUsage();
            await loadSettings();
            Alert.alert('Success', 'Usage data has been reset');
          }
        }
      ]
    );
  };

  const getCurrentLanguageInfo = (): Language => {
    return languagesToUse.find(lang => lang.code === currentLang) || languagesToUse[0];
  };

  const getDeviceLanguageInfo = (): Language => {
    return languagesToUse.find(lang => lang.code === deviceLang) || languagesToUse[0];
  };

  const renderLanguageItem: ListRenderItem<Language> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLang && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageChange(item.code)}
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

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{uiTexts.settings}</Text>
        </View>

        {/* Premium Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Status</Text>

          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <Text style={styles.premiumTitle}>
                {subscriptionStatus?.isPremium ? '✨ Premium Active' : '📸 Free Plan'}
              </Text>
              <Text style={styles.premiumStatus}>
                {subscriptionStatus?.isPremium ? 'Unlimited Access' : `${usageStats?.remainingFreeAnalyses || 0} analyses left`}
              </Text>
            </View>

            {subscriptionStatus?.isPremium ? (
              <View style={styles.premiumDetails}>
                <Text style={styles.premiumDetailText}>
                  Expires: {formatDate(subscriptionStatus?.expirationDate)}
                </Text>
                <Text style={styles.premiumDetailText}>
                  Member since: {formatDate(subscriptionStatus?.originalPurchaseDate)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradeToPremium}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Usage Statistics */}
        {usageStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{usageStats.totalAnalyses}</Text>
                <Text style={styles.statLabel}>Total Analyses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {usageStats.isPremium ? '∞' : usageStats.remainingFreeAnalyses}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>

            <Text style={styles.memberSince}>
              Member since: {formatDate(usageStats.memberSince)}
            </Text>
          </View>
        )}

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{uiTexts.language}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{uiTexts.currentLanguage}</Text>
              <Text style={styles.settingValue}>
                {getCurrentLanguageInfo().flag} {getCurrentLanguageInfo().name}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={openLanguageModal}
          >
            <Text style={styles.settingButtonText}>{uiTexts.changeLanguage}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

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

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={styles.settingButtonText}>
              {loading ? 'Restoring...' : 'Restore Purchases'}
            </Text>
            <Text style={styles.arrow}>↻</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.settingButton}
            onPress={handleResetUsage}
          >
            <Text style={[styles.settingButtonText, styles.dangerText]}>Reset Usage Data</Text>
            <Text style={styles.arrow}>⚠️</Text>
          </TouchableOpacity>*/}

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Legal</Text>

  <TouchableOpacity
    style={styles.settingButton}
    onPress={() =>
      Linking.openURL(
        "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
      )
    }
  >
    <Text style={styles.settingButtonText}>Terms of Use</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.settingButton}
    onPress={() =>
      Linking.openURL(
        "https://www.freeprivacypolicy.com/live/d267bff4-586c-40d4-a03f-e425112f455d"
      )
    }
  >
    <Text style={styles.settingButtonText}>Privacy Policy</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
</View>

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
              contentContainerStyle={{ flexGrow: 1 }}
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

  // Premium Status Styles
  premiumCard: {
    marginHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  premiumHeader: {
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  premiumStatus: {
    fontSize: 14,
    color: '#666',
  },
  premiumDetails: {
    marginTop: 8,
  },
  premiumDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Statistics Styles
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Settings Item Styles
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
  dangerText: {
    color: '#e74c3c',
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

  // Modal Styles
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
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  languageList: {
    flex: 1,
    backgroundColor: 'white',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
    minHeight: 60,
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
});