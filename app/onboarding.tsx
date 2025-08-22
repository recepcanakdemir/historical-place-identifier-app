// app/onboarding.tsx - Stable Version
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { setPremiumStatus } from '../services/usageService';

export default function OnboardingScreen() {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
    const [freeAnalysesEnabled, setFreeAnalysesEnabled] = useState<boolean>(true);

    const handlePlanChange = (planId: string) => {
        console.log('Plan changed to:', planId);
        setSelectedPlan(planId);
        
        // Lifetime seçilince free analyses toggle kapatılır
        if (planId === 'lifetime') {
            setFreeAnalysesEnabled(false);
        } else if (planId === 'weekly') {
            setFreeAnalysesEnabled(true);
        }
    };

    const handleToggleChange = (value: boolean) => {
        console.log('Toggle changed to:', value);
        setFreeAnalysesEnabled(value);
        
        // Toggle açılınca weekly seçilir
        if (value && selectedPlan === 'lifetime') {
            setSelectedPlan('weekly');
        }
    };

    const startFreeAnalyses = async () => {
        try {
            console.log('🎁 Starting free analyses...');

            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('free_trial_active', 'true');
            console.log('✅ Free analyses session set');

            router.replace('/');

        } catch (error) {
            console.error('❌ Error starting free analyses:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const handlePurchase = async (planId: string): Promise<void> => {
        setLoading(true);

        try {
            console.log('💰 Attempting to purchase:', planId);

            // Simulate purchase process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Grant premium access
            await setPremiumStatus(true);
            console.log('✅ Premium status granted');

            Alert.alert(
                'Welcome to Premium! 🎉',
                'You now have unlimited access to analyze historical places.',
                [
                    {
                        text: 'Start Exploring',
                        onPress: () => {
                            router.replace('/');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('❌ Purchase error:', error);
            Alert.alert('Purchase Failed', 'There was an issue processing your purchase. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    {/* App Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Text style={styles.logoEmoji}>🏛️</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Premium Access</Text>
                    <Text style={styles.subtitle}>
                        Unlock unlimited historical place analysis
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🏛️</Text>
                        <Text style={styles.featureText}>Identify unlimited historical places</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📚</Text>
                        <Text style={styles.featureText}>Unlock educational facts</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>✨</Text>
                        <Text style={styles.featureText}>Use the latest AI models</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🔓</Text>
                        <Text style={styles.featureText}>Remove annoying paywalls</Text>
                    </View>
                </View>

                {/* Pricing Plans */}
                <View style={styles.pricingSection}>
                    <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                    
                    {/* Lifetime Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'lifetime' && styles.selectedPlanCard
                        ]}
                        onPress={() => handlePlanChange('lifetime')}
                        activeOpacity={0.7}
                    >
                        {selectedPlan === 'lifetime' && (
                            <View style={styles.selectedIndicator}>
                                <Text style={styles.checkmark}>✓</Text>
                            </View>
                        )}
                        <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                        <Text style={styles.planTitle}>Lifetime Plan</Text>
                        <Text style={styles.planPrice}>$29.99</Text>
                        <Text style={styles.planSubtext}>One-time payment</Text>
                    </TouchableOpacity>

                    {/* Weekly Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'weekly' && styles.selectedPlanCard
                        ]}
                        onPress={() => handlePlanChange('weekly')}
                        activeOpacity={0.7}
                    >
                        {selectedPlan === 'weekly' && (
                            <View style={styles.selectedIndicator}>
                                <Text style={styles.checkmark}>✓</Text>
                            </View>
                        )}
                        <View style={styles.shortTermBadge}>
                            <Text style={styles.shortTermText}>Short Term ✓</Text>
                        </View>
                        <Text style={styles.planTitle}>Weekly Plan</Text>
                        <Text style={styles.planPrice}>$5.99</Text>
                        <Text style={styles.planSubtext}>per week</Text>
                    </TouchableOpacity>
                </View>

                {/* Free Analyses Toggle */}
                <View style={styles.toggleSection}>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>3 Free Analyses Enabled</Text>
                        <Switch
                            value={freeAnalysesEnabled}
                            onValueChange={handleToggleChange}
                            trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                            thumbColor='#FFFFFF'
                            disabled={selectedPlan === 'lifetime'}
                        />
                    </View>
                    {freeAnalysesEnabled && (
                        <Text style={styles.noPaymentText}>NO PAYMENT REQUIRED TODAY</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    {/* Premium Button */}
                    <TouchableOpacity
                        style={[styles.premiumButton, loading && styles.premiumButtonDisabled]}
                        onPress={() => handlePurchase(selectedPlan)}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.premiumButtonText}>
                                    {selectedPlan === 'lifetime' ? 'Get Lifetime Access' : 'Start Premium Weekly'}
                                </Text>
                                <Text style={styles.buttonArrow}>→</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Free Analyses Button */}
                    {freeAnalysesEnabled && (
                        <TouchableOpacity
                            style={styles.freeButton}
                            onPress={startFreeAnalyses}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.freeButtonText}>
                                Start with 3 Free Analyses
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Terms */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                        {selectedPlan === 'weekly' && ' Subscription automatically renews unless cancelled.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    
    // Header
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 30,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBackground: {
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    logoEmoji: {
        fontSize: 40,
        color: '#FFFFFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Features
    featuresSection: {
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    featureIcon: {
        fontSize: 18,
        marginRight: 12,
        width: 24,
    },
    featureText: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '500',
        flex: 1,
    },

    // Pricing
    pricingSection: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F1F1F',
        textAlign: 'center',
        marginBottom: 20,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E5E5',
        position: 'relative',
    },
    selectedPlanCard: {
        borderColor: '#4A90E2',
        backgroundColor: '#F0F8FF',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -8,
        right: 15,
        backgroundColor: '#FF5252',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    bestValueText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    shortTermBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    shortTermText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F1F1F',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 2,
    },
    planSubtext: {
        fontSize: 14,
        color: '#666666',
    },

    // Toggle
    toggleSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    noPaymentText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.5,
    },

    // Actions
    actionsSection: {
        marginBottom: 30,
    },
    premiumButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    premiumButtonDisabled: {
        backgroundColor: '#999999',
        shadowOpacity: 0,
        elevation: 0,
    },
    premiumButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    buttonArrow: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    freeButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4A90E2',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    freeButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '600',
    },

    // Terms
    termsSection: {
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
});