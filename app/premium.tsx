// app/premium.tsx - Fixed TypeScript Errors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getUsageStats, setPremiumStatus } from '../services/usageService';
import { UsageStats, SubscriptionPlan } from '../types';

export default function PremiumScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      title: 'Monthly Premium',
      price: '$4.99',
      period: 'per month',
      features: [
        'Unlimited analyses',
        'Priority AI processing',
        'Advanced saving features',
        'Export to PDF',
        'Priority support'
      ]
    },
    {
      id: 'yearly',
      title: 'Yearly Premium',
      price: '$29.99',
      period: 'per year',
      savings: 'Save 50%',
      popular: true,
      features: [
        'Everything in Monthly',
        'Best value - 5 months free',
        //'Exclusive historical content',
        'Early access to new features',
        'Premium badge',
        'Save your favourite places',
        'Export the information as PDF'
      ]
    }
  ];

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async (): Promise<void> => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handlePurchase = async (planId: string): Promise<void> => {
    setLoading(true);
    
    try {
      // TODO: RevenueCat integration will go here
      console.log('Attempting to purchase:', planId);
      
      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just grant premium access (temporary)
      await setPremiumStatus(true);
      
      Alert.alert(
        'Welcome to Premium! 🎉',
        'You now have unlimited access to analyze historical places.',
        [
          {
            text: 'Start Exploring',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        'There was an issue processing your purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async (): Promise<void> => {
    setRestoring(true);
    
    try {
      // TODO: RevenueCat restore purchases will go here
      console.log('Restoring purchases...');
      
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Restore Complete',
        'No previous purchases found.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Could not restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  const renderSubscriptionPlan = (plan: SubscriptionPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlan,
        plan.popular && styles.popularPlan
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        {plan.savings && (
          <Text style={styles.savingsText}>{plan.savings}</Text>
        )}
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{plan.price}</Text>
        <Text style={styles.periodText}>{plan.period}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      {selectedPlan === plan.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🏛️</Text>
          <Text style={styles.heroTitle}>Unlock Unlimited History</Text>
          <Text style={styles.heroSubtitle}>
            Discover countless historical places with unlimited AI-powered analysis
          </Text>
        </View>

        {/* Usage Stats */}
        {usageStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Your Usage</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{usageStats.totalAnalyses}</Text>
                <Text style={styles.statLabel}>Analyses Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{usageStats.remainingFreeAnalyses}</Text>
                <Text style={styles.statLabel}>Free Remaining</Text>
              </View>
            </View>
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Go Premium?</Text>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>∞</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Unlimited Analysis</Text>
              <Text style={styles.benefitDescription}>
                Analyze as many historical places as you want, whenever you want
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Priority Processing</Text>
              <Text style={styles.benefitDescription}>
                Get faster AI analysis with priority queue access
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💾</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Advanced Features</Text>
              <Text style={styles.benefitDescription}>
                Export to PDF, advanced search, and exclusive content
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>
          {subscriptionPlans.map(renderSubscriptionPlan)}
        </View>

        {/* Purchase Button */}
        <View style={styles.purchaseSection}>
          <TouchableOpacity
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={() => handlePurchase(selectedPlan)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Start Premium - {subscriptionPlans.find(p => p.id === selectedPlan)?.price}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={restoring}
          >
            <Text style={styles.restoreButtonText}>
              {restoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>
          <View style={styles.termsLinks}>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsSeparator}> • </Text>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  plansTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f8ff',
  },
  popularPlan: {
    borderColor: '#FF6B6B',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  periodText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    color: '#50C878',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  selectedIndicator: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  purchaseSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  purchaseButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#999',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreButtonText: {
    color: '#666',
    fontSize: 16,
  },
  termsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  termsLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsLink: {
    fontSize: 12,
    color: '#4A90E2',
  },
  termsSeparator: {
    fontSize: 12,
    color: '#999',
  },
});