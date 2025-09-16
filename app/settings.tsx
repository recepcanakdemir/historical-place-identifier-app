// app/settings.tsx - Updated with Language Context
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { checkSubscriptionStatus, restorePurchases } from '../services/subscriptionService';
import { getUsageStats, resetUsage } from '../services/usageService';
import { Language, SubscriptionStatus, UsageStats } from '../types';

export default function SettingsScreen() {
  const { language: currentLang, texts: t, setLanguage, supportedLanguages, isLoading: languageLoading } = useLanguage();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Premium states with proper types
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);

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

      console.log('Settings loaded:', { stats, subStatus });
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
      await setLanguage(languageCode);
      setModalVisible(false);
      
      Alert.alert(
        t.languageChanged,
        t.languageChangedMessage,
        [{ text: t.ok }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleResetToDevice = async (): Promise<void> => {
    try {
      // Reset to device language using language context
      const deviceLanguage = 'en'; // This should be detected from device
      await setLanguage(deviceLanguage);
      
      Alert.alert(
        t.languageChanged,
        t.languageChangedMessage,
        [{ text: t.ok }]
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
    return supportedLanguages.find(lang => lang.code === currentLang) || supportedLanguages[0];
  };

  const getDeviceLanguageInfo = (): Language => {
    return supportedLanguages.find(lang => lang.code === 'en') || supportedLanguages[0]; // Default to English
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Clean Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.settings}</Text>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Premium Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.premiumFeatures}</Text>

          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <Text style={styles.premiumTitle}>
                {subscriptionStatus?.isPremium ? `✨ ${t.premiumFeatures}` : `📸 ${t.freeTrialActive}`}
              </Text>
              <Text style={styles.premiumStatus}>
                {subscriptionStatus?.isPremium ? t.unlimitedAccess : `${usageStats?.remainingFreeAnalyses || 0} ${t.freeAnalysisLeft.split(' ')[3]}`}
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
                <Text style={styles.upgradeButtonText}>{t.upgradeToPremium}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Usage Statistics */}
        {usageStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.usageStats || 'Usage Statistics'}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{usageStats.totalAnalyses}</Text>
                <Text style={styles.statLabel}>{t.totalAnalyses || 'Total Analyses'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {usageStats.isPremium ? '∞' : usageStats.remainingFreeAnalyses}
                </Text>
                <Text style={styles.statLabel}>{t.remaining || 'Remaining'}</Text>
              </View>
            </View>

            <Text style={styles.memberSince}>
              Member since: {formatDate(usageStats.memberSince)}
            </Text>
          </View>
        )}

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t.currentLanguage}</Text>
              <Text style={styles.settingValue}>
                {getCurrentLanguageInfo().flag} {getCurrentLanguageInfo().name}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={openLanguageModal}
          >
            <Text style={styles.settingButtonText}>{t.changeLanguage}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleResetToDevice}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingButtonText}>{t.resetToDevice}</Text>
              <Text style={styles.deviceLanguageText}>
                {getDeviceLanguageInfo().flag} {getDeviceLanguageInfo().name}
              </Text>
            </View>
            <Text style={styles.arrow}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.account || 'Account'}</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={styles.settingButtonText}>
              {loading ? t.loading : t.restorePurchases}
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
  <Text style={styles.sectionTitle}>{t.legal || 'Legal'}</Text>

  <TouchableOpacity
    style={styles.settingButton}
    onPress={() =>
      Linking.openURL(
        "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
      )
    }
  >
    <Text style={styles.settingButtonText}>{t.terms}</Text>
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
    <Text style={styles.settingButtonText}>{t.privacy}</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
</View>

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
              <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeLanguageModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={supportedLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item, index) => `lang-${item.code}-${index}`}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Clean Header Styles
  headerContainer: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: '#13a4ec',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.5,
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
    color: '#000000',
  },
  checkmark: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
});