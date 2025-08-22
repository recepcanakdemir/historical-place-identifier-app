// app/paywall.tsx - Unified Paywall Screen
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { hasFreeTrialBeenUsed, startFreeTrialSession } from '../services/accessService';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import { getUsageStats, setPremiumStatus } from '../services/usageService';
import { SubscriptionStatus, UsageStats } from '../types';

type PaywallSource = 'onboarding' | 'upgrade' | 'limit' | 'settings';

export default function PaywallScreen() {
    const { source = 'upgrade' } = useLocalSearchParams<{ source?: PaywallSource }>();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
    const [freeAnalysesEnabled, setFreeAnalysesEnabled] = useState<boolean>(true);
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (): Promise<void> => {
        try {
            const stats = await getUsageStats();
            setUsageStats(stats);
            
            const subStatus = await checkSubscriptionStatus();
            setSubscriptionStatus(subStatus as SubscriptionStatus);
            
            const trialUsed = await hasFreeTrialBeenUsed();
            setFreeTrialUsed(trialUsed);
            
            console.log('Paywall - Data loaded:', { stats, subStatus, trialUsed });
        } catch (error) {
            console.error('Error loading paywall data:', error);
        }
    };

    const handlePlanChange = (planId: string) => {
        console.log('Paywall - Plan changed to:', planId);
        setSelectedPlan(planId);
        
        // Lifetime seçilince free analyses toggle kapatılır
        if (planId === 'lifetime') {
            setFreeAnalysesEnabled(false);
        } else if (planId === 'weekly') {
            setFreeAnalysesEnabled(true);
        }
    };

    const handleToggleChange = (value: boolean) => {
        console.log('Paywall - Toggle changed to:', value);
        setFreeAnalysesEnabled(value);
        
        // Toggle açılınca weekly seçilir
        if (value && selectedPlan === 'lifetime') {
            setSelectedPlan('weekly');
        }
    };

    const handlePurchase = async (planId: string): Promise<void> => {
        setLoading(true);

        try {
            console.log('Paywall - Attempting to purchase:', planId);

            // Simulate purchase process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Grant premium access
            await setPremiumStatus(true);
            console.log('Paywall - Premium status granted');

            Alert.alert(
                'Welcome to Premium! 🎉',
                'You now have unlimited access to analyze historical places.',
                [
                    {
                        text: 'Start Exploring',
                        onPress: () => {
                            console.log('Paywall - Navigating after purchase, source:', source);
                            // Always go to main app after purchase
                            router.replace('/');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Paywall - Purchase error:', error);
            Alert.alert('Purchase Failed', 'There was an issue processing your purchase. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startFreeAnalyses = async () => {
        try {
            console.log('Paywall - Starting free analyses...');

            await startFreeTrialSession();
            console.log('Paywall - Free analyses session set');

            // Always navigate to main app after starting free trial
            console.log('Paywall - Navigating to main app after free trial start');
            router.replace('/');

        } catch (error) {
            console.error('Paywall - Error starting free analyses:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const handleClose = () => {
        console.log('Paywall - Closing with source:', source);
        
        if (source === 'onboarding') {
            // Onboarding'den geliyorsa ana sayfaya git
            console.log('Paywall - Redirecting to main app from onboarding');
            router.replace('/');
        } else {
            // Diğer durumlar - geri gitmeye çalış, hata olursa ana sayfaya git
            try {
                if (router.canGoBack()) {
                    console.log('Paywall - Going back');
                    router.back();
                } else {
                    console.log('Paywall - Cannot go back, redirecting to main app');
                    router.replace('/');
                }
            } catch (error) {
                console.log('Paywall - Error going back, redirecting to main app:', error);
                router.replace('/');
            }
        }
    };

    // Get dynamic content based on source
    const getContent = () => {
        switch (source) {
            case 'onboarding':
                return {
                    title: 'Welcome to Historical Places',
                    subtitle: 'Discover the stories behind monuments and landmarks',
                    showUsageStats: false
                };
            case 'limit':
                return {
                    title: 'Analysis Limit Reached',
                    subtitle: 'Upgrade to continue discovering historical places',
                    showUsageStats: true
                };
            case 'settings':
                return {
                    title: 'Premium Access',
                    subtitle: 'Unlock unlimited historical place analysis',
                    showUsageStats: true
                };
            default: // upgrade
                return {
                    title: 'Premium Access',
                    subtitle: 'Unlock unlimited historical place analysis',
                    showUsageStats: true
                };
        }
    };

    const content = getContent();
    
    // Debug logging
    console.log('Paywall render - source:', source, 'selectedPlan:', selectedPlan, 'freeAnalysesEnabled:', freeAnalysesEnabled, 'freeTrialUsed:', freeTrialUsed);

    // If already premium, show special view
    if (subscriptionStatus?.isPremium && source !== 'onboarding') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.premiumActiveContainer}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Text style={styles.logoEmoji}>🏛️</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.premiumActiveTitle}>✨ Premium Active</Text>
                    <Text style={styles.premiumActiveText}>
                        You already have unlimited access to all features!
                    </Text>
                    
                    <TouchableOpacity style={styles.continueButton} onPress={() => {
                        console.log('Paywall - Premium user continuing');
                        router.replace('/');
                    }}>
                        <Text style={styles.continueButtonText}>Continue Exploring</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header - Only show close button if not onboarding */}
                {source !== 'onboarding' && (
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Main Content */}
                <View style={styles.content}>
                    {/* App Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Text style={styles.logoEmoji}>🏛️</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{content.title}</Text>
                    <Text style={styles.subtitle}>{content.subtitle}</Text>

                    {/* Features */}
                    <View style={styles.featuresSection}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🏛️</Text>
                            <Text style={styles.featureText}>Identify unlimited historical places</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🔓</Text>
                            <Text style={styles.featureText}>Remove annoying paywalls</Text>
                        </View>
                    </View>

                    {/* Usage Stats */}
                    {content.showUsageStats && usageStats && (
                        <View style={styles.usageSection}>
                            <Text style={styles.sectionTitle}>Your Current Usage</Text>
                            <View style={styles.usageStats}>
                                <View style={styles.usageStat}>
                                    <Text style={styles.usageNumber}>{usageStats.totalAnalyses}</Text>
                                    <Text style={styles.usageLabel}>Analyses Used</Text>
                                </View>
                                <View style={styles.usageStat}>
                                    <Text style={styles.usageNumber}>{usageStats.remainingFreeAnalyses}</Text>
                                    <Text style={styles.usageLabel}>Remaining</Text>
                                </View>
                            </View>
                        </View>
                    )}

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

                    {/* Free Analyses Toggle - Show only if free trial hasn't been used */}
                    {!freeTrialUsed && (
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
                    )}

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

                        {/* Free Analyses Button - Show when toggle is enabled and free trial hasn't been used */}
                        {freeAnalysesEnabled && !freeTrialUsed && (
                            <TouchableOpacity
                                style={styles.freeButton}
                                onPress={startFreeAnalyses}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.freeButtonText}>
                                    {source === 'onboarding' ? 'Start with 3 Free Analyses' : 'Get 3 More Free Analyses'}
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
        paddingBottom: 40,
    },
    
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#666',
    },
    
    // Content
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
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
        marginBottom: 30,
        lineHeight: 22,
    },

    // Premium Active State
    premiumActiveContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    premiumActiveTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 16,
        textAlign: 'center',
    },
    premiumActiveText: {
        fontSize: 18,
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 26,
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Features
    featuresSection: {
        width: '100%',
        marginBottom: 25,
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

    // Usage Stats
    usageSection: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F1F1F',
        textAlign: 'center',
        marginBottom: 16,
    },
    usageStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    usageStat: {
        alignItems: 'center',
    },
    usageNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FF5252',
        marginBottom: 4,
    },
    usageLabel: {
        fontSize: 14,
        color: '#666666',
    },

    // Pricing
    pricingSection: {
        width: '100%',
        marginBottom: 25,
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
        width: '100%',
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
        width: '100%',
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
        width: '100%',
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
});