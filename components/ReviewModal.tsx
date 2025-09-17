// components/ReviewModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { handleRateNow, handleMaybeLater, handleNoThanks } from '../services/reviewService';

const { width } = Dimensions.get('window');

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose }) => {
  const { texts: t } = useLanguage();

  const handleRatePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await handleRateNow();
      
      if (result.success) {
        onClose();
        // Optionally show success message
        setTimeout(() => {
          Alert.alert('Thank You! 🌟', result.message);
        }, 500);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error handling rate press:', error);
      Alert.alert('Error', 'Unable to open App Store');
    }
  };

  const handleLaterPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await handleMaybeLater();
      onClose();
    } catch (error) {
      console.error('Error handling later press:', error);
      onClose();
    }
  };

  const handleNoThanksPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await handleNoThanks();
      onClose();
    } catch (error) {
      console.error('Error handling no thanks press:', error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* App Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.appIcon}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t.review?.title || 'Enjoying LandmarkAI?'}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {t.review?.message || 'If you love discovering historical places with our AI, please consider rating us on the App Store!'}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Rate Now Button */}
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleRatePress}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {t.review?.rateNow || 'Rate Now'} ⭐
              </Text>
            </TouchableOpacity>

            {/* Secondary Buttons Row */}
            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={handleLaterPress}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  {t.review?.later || 'Maybe Later'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={handleNoThanksPress}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  {t.review?.noThanks || 'No Thanks'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
});