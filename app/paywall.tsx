// app/paywall.tsx - Fixed to work with existing subscriptionService
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
import { checkSubscriptionStatus, getSubscriptionPackages, purchaseSubscription } from '../services/subscriptionService';
import { getUsageStats } from '../services/usageService';
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
    
    // Subscription packages state
    const [packages, setPackages] = useState<any[]>([]);
    const [prices, setPrices] = useState({ lifetime: '$29.99', weekly: '$5.99' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (): Promise<void> => {
        try {
            // Load basic data
            const stats = await getUsageStats();
            setUsageStats(stats);
            
            const subStatus = await checkSubscriptionStatus();
            setSubscriptionStatus(subStatus as SubscriptionStatus);
            
            const trialUsed = await hasFreeTrialBeenUsed();
            setFreeTrialUsed(trialUsed);
            
            // Load subscription packages
            const subscriptionPackages = await getSubscriptionPackages();
            setPackages(subscriptionPackages);
            
            // Update prices from packages
            subscriptionPackages.forEach(pkg => {
                if (pkg.id === 'weekly') {
                    setPrices(prev => ({ ...prev, weekly: pkg.price }));
                } else if (pkg.id === 'yearly') {
                    // Lifetime olarak yearly package'ını kullanıyoruz
                    setPrices(prev => ({ ...prev, lifetime: pkg.price }));
                }
            });
            
            console.log('Paywall - Data loaded:', { 
                stats, 
                subStatus, 
                trialUsed, 
                packages: subscriptionPackages,
                prices 
            });
            
        } catch (error) {
            console.error('Error loading paywall data:', error);
        }
    };

    const handlePlanChange = (planId: string) => {
        console.log('Paywall - Plan changed to:', planId);
        setSelectedPlan(planId);
        
        if (planId === 'lifetime') {
            setFreeAnalysesEnabled(false);
        } else if (planId === 'weekly') {
            setFreeAnalysesEnabled(true);
        }
    };

    const handleToggleChange = (value: boolean) => {
        console.log('Paywall - Toggle changed to:', value);
        setFreeAnalysesEnabled(value);
        
        if (value && selectedPlan === 'lifetime') {
            setSelectedPlan('weekly');
        }
    };

    const handlePurchase = async (planId: string): Promise<void> => {
        if (loading) return;
        
        setLoading(true);

        try {
            console.log('Paywall - Attempting to purchase:', planId);
            
            // Find the package
            let packageToPurchase;
            if (planId === 'lifetime') {
                // Use yearly package as lifetime
                packageToPurchase = packages.find(pkg => pkg.id === 'yearly');
            } else {
                packageToPurchase = packages.find(pkg => pkg.id === planId);
            }
            
            if (!packageToPurchase) {
                Alert.alert('Error', 'Package not found. Please try again.');
                return;
            }

            const result = await purchaseSubscription(packageToPurchase);
            
            if (result.success) {
                Alert.alert(
                    'Welcome to Premium! 🎉',
                    'You now have unlimited access to analyze historical places.',
                    [
                        {
                            text: 'Start Exploring',
                            onPress: () => {
                                console.log('Paywall - Navigating after purchase');
                                router.replace('/');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Purchase Failed', result.message || 'Please try again.');
            }
            
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
            router.replace('/');
        } catch (error) {
            console.error('Paywall - Error starting free analyses:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const handleClose = () => {
        if (source === 'onboarding') {
            router.replace('/');
        } else {
            try {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/');
                }
            } catch (error) {
                router.replace('/');
            }
        }
    };

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
            default:
                return {
                    title: 'Premium Access',
                    subtitle: 'Unlock unlimited historical place analysis',
                    showUsageStats: true
                };
        }
    };

    const content = getContent();

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
                    
                    <TouchableOpacity style={styles.continueButton} onPress={() => router.replace('/')}>
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
                {source !== 'onboarding' && (
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Text style={styles.logoEmoji}>🏛️</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{content.title}</Text>
                    <Text style={styles.subtitle}>{content.subtitle}</Text>

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
                            <Text style={styles.planPrice}>{prices.lifetime}</Text>
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
                            <Text style={styles.planPrice}>{prices.weekly}</Text>
                            <Text style={styles.planSubtext}>per week - auto renewable</Text>
                        </TouchableOpacity>
                    </View>

                    {!freeTrialUsed && (
                        <View style={styles.toggleSection}>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleText}>3 Free Analyses Enabled</Text>
                                <Switch
                                    value={freeAnalysesEnabled}
                                    onValueChange={handleToggleChange}
                                    trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                                    thumbColor='#FFFFFF'
                                    disabled={selectedPlan === 'lifetime' || loading}
                                />
                            </View>
                            {freeAnalysesEnabled && (
                                <Text style={styles.noPaymentText}>NO PAYMENT REQUIRED TODAY</Text>
                            )}
                        </View>
                    )}

                    <View style={styles.actionsSection}>
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

                        {freeAnalysesEnabled && !freeTrialUsed && !loading && (
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