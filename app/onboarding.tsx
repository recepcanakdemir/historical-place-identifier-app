// app/onboarding.tsx - Simple Version
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
    StatusBar,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { setPremiumStatus } from '../services/usageService';
import { SubscriptionPlan } from '../types';

export default function OnboardingScreen() {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);

    const subscriptionPlans: SubscriptionPlan[] = [
        {
            id: 'yearly',
            title: 'Yearly Pro',
            price: '$49.99',
            period: 'per year',
            savings: 'Save 68%',
            popular: true,
            features: [
                'Everything in Weekly',
                'Unlimited historical analysis',
                'Best value - 35 weeks free',
                'Early access to new features',
                'Advanced saving features',
                'Export the information as PDF'
            ]
        },
        {
            id: 'weekly',
            title: 'Weekly Pro',
            price: '$2.99',
            period: 'per week',
            features: [
                'Unlimited historical analysis',
                'Advanced saving features',
                'Early access to new features',
                'Export the information as PDF'
            ]
        }
    ];

    useEffect(() => {
        // Start entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const startFreeTrial = async () => {
        try {
            console.log('🎁 Starting free trial...');

            // Set a session flag that user completed free trial
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('free_trial_active', 'true');
            console.log('✅ Free trial session set');

            // Simple navigation - no complex logic
            console.log('🏠 Navigating to main app...');
            router.replace('/');

        } catch (error) {
            console.error('❌ Error starting free trial:', error);
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
                'Welcome to Pro! 🎉',
                'You now have unlimited access to analyze historical places.',
                [
                    {
                        text: 'Start Exploring',
                        onPress: () => {
                            console.log('🏠 Navigating to main app...');
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

    const renderSubscriptionPlan = (plan: SubscriptionPlan) => (
        <TouchableOpacity
            key={plan.id}
            style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
                plan.popular && styles.popularPlan
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
        >
            {plan.popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
            )}

            <View style={styles.planHeader}>
                <View style={styles.planTitleContainer}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {plan.savings && (
                        <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                        </View>
                    )}
                </View>
                {selectedPlan === plan.id && (
                    <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                    </View>
                )}
            </View>


            <View style={styles.priceContainer}>
                {plan.id === 'yearly' ? (
                    <View>
                        <Text style={styles.originalPriceText}>$155.48</Text>
                        <Text style={styles.priceText}>{plan.price}</Text>
                    </View>
                ) : (
                    <Text style={styles.priceText}>{plan.price}</Text>
                )}
                <Text style={styles.periodText}>{plan.period}</Text>
            </View>
            <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureCheck}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <Animated.ScrollView
                style={[styles.scrollView, { opacity: fadeAnim }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Section */}
                <Animated.View
                    style={[
                        styles.heroSection,
                        {
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>🏛️</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>Welcome to Historical Places</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Discover the stories behind monuments and landmarks with AI-powered analysis
                    </Text>
                </Animated.View>

                {/* Features Preview */}
                <View style={styles.featuresPreview}>
                    <View style={styles.previewFeature}>
                        <Text style={styles.previewIcon}>🤖</Text>
                        <Text style={styles.previewText}>AI-Powered Analysis</Text>
                    </View>
                    <View style={styles.previewFeature}>
                        <Text style={styles.previewIcon}>🌍</Text>
                        <Text style={styles.previewText}>10+ Languages</Text>
                    </View>
                    <View style={styles.previewFeature}>
                        <Text style={styles.previewIcon}>📍</Text>
                        <Text style={styles.previewText}>Location Aware</Text>
                    </View>
                </View>

                {/* Subscription Plans */}
                <View style={styles.plansSection}>
                    <Text style={styles.plansTitle}>Choose Your Plan</Text>
                    <Text style={styles.plansSubtitle}>
                        Unlock unlimited historical discoveries
                    </Text>

                    <View style={styles.plansContainer}>
                        {subscriptionPlans.map(renderSubscriptionPlan)}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    {/* Premium Button */}
                    <TouchableOpacity
                        style={[
                            styles.premiumButton,
                            loading && styles.premiumButtonDisabled
                        ]}
                        onPress={() => handlePurchase(selectedPlan)}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.premiumButtonText}>
                                    Start Pro - {subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                                </Text>
                                <Text style={styles.premiumButtonSubtext}>
                                    Unlimited access immediately
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Free Trial Button */}
                    <TouchableOpacity
                        style={styles.freeTrialButton}
                        onPress={startFreeTrial}
                        activeOpacity={0.8}
                    >
                        <View style={styles.freeTrialContent}>
                            <View style={styles.freeTrialIcon}>
                                <Text style={styles.freeTrialEmoji}>🎁</Text>
                            </View>
                            <View style={styles.freeTrialTextContainer}>
                                <Text style={styles.freeTrialText}>Try 3 Free Analyses</Text>
                                <Text style={styles.freeTrialSubtext}>
                                    No payment required • Upgrade anytime
                                </Text>
                            </View>
                            <Text style={styles.freeTrialArrow}>→</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                        Subscription automatically renews unless cancelled.
                    </Text>
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logoEmoji: {
        fontSize: 48,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },

    // Features Preview
    featuresPreview: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    previewFeature: {
        alignItems: 'center',
        flex: 1,
    },
    previewIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    previewText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Plans Section
    plansSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    plansTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    plansSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    plansContainer: {
        gap: 16,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        position: 'relative',
    },
    selectedPlan: {
        borderColor: '#4A90E2',
        backgroundColor: '#FAFBFC',
    },
    popularPlan: {
        borderColor: '#10B981',
    },
    popularBadge: {
        position: 'absolute',
        top: -1,
        left: 24,
        right: 24,
        backgroundColor: '#10B981',
        paddingVertical: 8,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        alignItems: 'center',
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        marginTop: 8,
    },
    planTitleContainer: {
        flex: 1,
    },
    planTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
    },
    savingsBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    savingsText: {
        color: '#92400E',
        fontSize: 12,
        fontWeight: '600',
    },
    selectedIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    priceContainer: {
        marginBottom: 20,
    },

    originalPriceText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#999',
        textDecorationLine: 'line-through',
        marginBottom: 4,
    },
    priceText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        lineHeight: 32,
    },
    periodText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
    featuresContainer: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureCheck: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        width: 20,
    },
    featureText: {
        fontSize: 15,
        color: '#64748B',
        flex: 1,
        lineHeight: 20,
    },

    // Action Section
    actionSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
        gap: 16,
    },
    premiumButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    premiumButtonDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    premiumButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    premiumButtonSubtext: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    freeTrialButton: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    freeTrialContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    freeTrialIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    freeTrialEmoji: {
        fontSize: 24,
    },
    freeTrialTextContainer: {
        flex: 1,
    },
    freeTrialText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    freeTrialSubtext: {
        fontSize: 14,
        color: '#64748B',
    },
    freeTrialArrow: {
        fontSize: 20,
        color: '#64748B',
        fontWeight: '500',
    },

    // Terms
    termsSection: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    termsText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 320,
    },
});