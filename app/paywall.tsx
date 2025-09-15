// app/paywall.tsx - Unified Paywall Screen
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { hasFreeTrialBeenUsed, startFreeTrialSession } from '../services/accessService';
import { checkSubscriptionStatus, purchaseSubscription } from '../services/subscriptionService';
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
    const [packages, setPackages] = useState<any[]>([]);  // any[] ile başlatın
    const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

    const getPackageInfo = (planId: any) => {
        const pkg = packages.find(p =>
            p.id === `$rc_${planId}` ||
            p.rcPackage?.identifier === `$rc_${planId}`
        );
        return pkg ? {
            price: pkg.price || '$0.00',
            title: pkg.title || 'Plan',
            description: pkg.description || ''
        } : {
            price: planId === 'lifetime' ? '$29.99' : '$5.99',
            title: planId === 'lifetime' ? 'Lifetime Plan' : 'Weekly Plan',
            description: ''
        };
    };

    /* const loadData = async (): Promise<void> => {
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
     };*/

    useEffect(() => {
        console.log('useEffect triggered, calling loadData');
        loadData();
    }, []);

    const loadData = async () => {
        console.log('🔄 Paywall loadData starting...');
        try {
            console.log('📊 Fetching usage stats...');
            const stats = await getUsageStats();
            console.log('📈 Usage stats received:', stats);
            setUsageStats(stats);
            console.log('✅ Usage stats set to state');

            console.log('🔐 Fetching subscription status...');
            const subStatus = await checkSubscriptionStatus();
            console.log('💳 Subscription status received:', subStatus);
            setSubscriptionStatus(subStatus as SubscriptionStatus);
            console.log('✅ Subscription status set to state');

            console.log('🎁 Checking trial status...');
            const trialUsed = await hasFreeTrialBeenUsed();
            console.log('🎯 Trial used status:', trialUsed);
            setFreeTrialUsed(trialUsed);
            console.log('✅ Trial status set to state');

            // Packages loading
            console.log('🔄 Loading packages...');
            const { getSubscriptionPackages } = await import('../services/subscriptionService');
            const availablePackages = await getSubscriptionPackages();
            console.log('📦 Packages received:', availablePackages);

            setPackages(availablePackages);
            setLoadingPackages(false);
            console.log('✅ All data loaded successfully');

        } catch (error) {
            console.error('❌ Error loading paywall data:', error);
            setLoadingPackages(false); // Error durumunda da false yap
        }
    };

    const handlePlanChange = (planId: string) => {
        console.log('Paywall - Plan changed to:', planId);
        setSelectedPlan(planId);

        // Lifetime selected disables free analyses toggle
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

            // Use the updated purchaseSubscription function
            const result = await purchaseSubscription(planId);

            if (result.success) {
                Alert.alert(
                    'Welcome to Premium! 🎉',
                    planId === 'lifetime'
                        ? 'You now have lifetime access to analyze landmarks!'
                        : 'You now have unlimited access to analyze landmarks.',
                    [
                        {
                            text: 'Start Exploring',
                            onPress: () => {
                                console.log('Paywall - Navigating after purchase, source:', source);
                                router.replace('/');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Purchase Failed', result.message || 'There was an issue processing your purchase. Please try again.');
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
            console.log('Paywall - Free analyses session set');

            // Always navigate to main app after starting free trial
            console.log('Paywall - Navigating to main app after free trial start');
            router.replace('/');

        } catch (error) {
            console.error('Paywall - Error starting free analyses:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const handleClose = async () => {
        console.log('🚪 Paywall - handleClose called');
        console.log('📊 Paywall - Source:', source);
        console.log('📈 Paywall - Current usageStats state:', usageStats);
        console.log('🔄 Paywall - loadingPackages:', loadingPackages);

        try {
            // First check current state
            let canClose = false;
            let currentUsageStats = usageStats;

            // If usageStats is null or undefined, fetch fresh data
            if (!currentUsageStats) {
                console.log('⚠️  Paywall - usageStats is null, fetching fresh data...');
                try {
                    currentUsageStats = await getUsageStats();
                    console.log('✅ Paywall - Fresh usage stats:', currentUsageStats);
                } catch (error) {
                    console.error('❌ Paywall - Error fetching fresh usage stats:', error);
                    // If we can't get stats, let user close as fallback
                    console.log('🆘 Paywall - Fallback: allowing close due to stats fetch error');
                    canClose = true;
                }
            }

            // Check if user has remaining analyses
            if (currentUsageStats && !canClose) {
                const remaining = currentUsageStats.remainingFreeAnalyses;
                const isPremium = currentUsageStats.isPremium;
                
                console.log('🔍 Paywall - Analysis check:');
                console.log('   - Remaining free analyses:', remaining);
                console.log('   - Is premium:', isPremium);
                
                if (isPremium || remaining > 0) {
                    canClose = true;
                    console.log('✅ Paywall - User has access, allowing close');
                } else {
                    console.log('🚫 Paywall - No remaining analyses and not premium');
                }
            }

            // Execute close logic
            if (canClose) {
                console.log('🎯 Paywall - Proceeding with close...');
                
                if (source === 'onboarding') {
                    console.log('🏠 Paywall - Redirecting to main app from onboarding');
                    router.replace('/');
                } else {
                    try {
                        if (router.canGoBack()) {
                            console.log('⬅️  Paywall - Going back');
                            router.back();
                        } else {
                            console.log('🏠 Paywall - Cannot go back, redirecting to main app');
                            router.replace('/');
                        }
                    } catch (error) {
                        console.log('❌ Paywall - Error going back, redirecting to main app:', error);
                        router.replace('/');
                    }
                }
            } else {
                console.log('🔒 Paywall - Close denied - showing alert');
                Alert.alert(
                    'Premium Required',
                    'You have no free analyses remaining. Please upgrade to premium or purchase a subscription to continue.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('💥 Paywall - Unexpected error in handleClose:', error);
            // As final fallback, allow close
            console.log('🆘 Paywall - Final fallback: allowing close due to unexpected error');
            router.replace('/');
        }
    };

    // Get dynamic content based on source
    const getContent = () => {
        switch (source) {
            case 'onboarding':
                return {
                    title: 'Welcome to LandmarkAI',
                    subtitle: 'Discover the stories behind monuments and landmarks',
                    showUsageStats: false
                };
            case 'limit':
                return {
                    title: 'Analysis Limit Reached',
                    subtitle: 'Upgrade to continue discovering landmarks',
                    showUsageStats: true
                };
            case 'settings':
                return {
                    title: 'Premium Access',
                    subtitle: 'Unlock unlimited landmark analysis',
                    showUsageStats: true
                };
            default: // upgrade
                return {
                    title: 'Premium Access',
                    subtitle: 'Unlock unlimited landmark analysis',
                    showUsageStats: true
                };
        }
    };

    const handleRestorePurchases = async () => {
        try {
            setLoading(true);
            const { restorePurchases } = await import('../services/subscriptionService');
            const result = await restorePurchases();

            if (result.success && result.isPremium) {
                Alert.alert('Restored!', 'Your premium access has been restored.', [
                    { text: 'Continue', onPress: () => router.replace('/') }
                ]);
            } else {
                Alert.alert('No Purchases', 'No previous purchases found to restore.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const content = getContent();

    // Debug logging
    console.log('Paywall render - source:', source, 'selectedPlan:', selectedPlan, 'freeAnalysesEnabled:', freeAnalysesEnabled, 'freeTrialUsed:', freeTrialUsed);

    // If already premium, show special view
    if (subscriptionStatus?.isPremium && source !== 'onboarding') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.modernHeader}>
                        <TouchableOpacity style={styles.modernCloseButton} onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                <View style={styles.premiumActiveContainer}>
                    <View style={styles.modernIconContainer}>
                        <Image 
                            source={require('../assets/images/paywall_and_index_icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>


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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.modernHeader}>
                    <TouchableOpacity style={styles.modernCloseButton} onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    {/* Modern App Icon */}
                    <View style={styles.modernIconContainer}>
                        <Image 
                            source={require('../assets/images/paywall_and_index_icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.modernTitle}>{content.title}</Text>
                    <Text style={styles.modernSubtitle}>{content.subtitle}</Text>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Modern Features */}
                <View style={styles.modernFeaturesSection}>
                    <View style={styles.modernFeatureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="infinite" size={12} color="#000000" />
                        </View>
                        <Text style={styles.modernFeatureText}>Unlimited landmark analysis</Text>
                    </View>
                    <View style={styles.modernFeatureItem}>
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="download" size={12} color="#000000" />
                        </View>
                        <Text style={styles.modernFeatureText}>AI chat & Place recommendations</Text>
                    </View>
                </View>

                    {/* Compact Usage Stats */}
                    {content.showUsageStats && usageStats && (
                        <View style={styles.compactUsageSection}>
                            <Text style={styles.compactUsageText}>
                                Usage: {usageStats.totalAnalyses} used • {usageStats.remainingFreeAnalyses} remaining
                            </Text>
                        </View>
                    )}


                    {loadingPackages ? (
                        <ActivityIndicator size="large" color="#4A90E2" />
                    ) : (
                        <View style={styles.modernPricingSection}>
                            <Text style={styles.modernSectionTitle}>Choose Your Plan</Text>

                            {/* Lifetime Plan */}
                            <TouchableOpacity
                                style={[styles.modernPlanCard, selectedPlan === 'lifetime' && styles.modernSelectedPlanCard]}
                                onPress={() => handlePlanChange('lifetime')}
                            >
                                <View style={styles.planHeader}>
                                    <View style={styles.planTitleContainer}>
                                        <Text style={styles.modernPlanTitle}>Lifetime</Text>
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>POPULAR</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.radioButton, selectedPlan === 'lifetime' && styles.radioButtonSelected]}>
                                        {selectedPlan === 'lifetime' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                                    </View>
                                </View>
                                <Text style={styles.modernPlanPrice}>{getPackageInfo('lifetime').price}</Text>
                                <Text style={styles.modernPlanSubtext}>One-time payment • No recurring fees</Text>
                            </TouchableOpacity>

                            {/* Weekly Plan */}
                            <TouchableOpacity
                                style={[styles.modernPlanCard, selectedPlan === 'weekly' && styles.modernSelectedPlanCard]}
                                onPress={() => handlePlanChange('weekly')}
                            >
                                <View style={styles.planHeader}>
                                    <Text style={styles.modernPlanTitle}>Weekly</Text>
                                    <View style={[styles.radioButton, selectedPlan === 'weekly' && styles.radioButtonSelected]}>
                                        {selectedPlan === 'weekly' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                                    </View>
                                </View>
                                <Text style={styles.modernPlanPrice}>{getPackageInfo('weekly').price}/week</Text>
                                <Text style={styles.modernPlanSubtext}>Auto-renewable • Cancel anytime</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Free Analyses Toggle - Show only if free trial hasn't been used */}
                    {!freeTrialUsed && (
                        <View style={styles.toggleSection}>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleText}>1 Free Analysis Enabled</Text>
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
                        {/* Modern Premium Button */}
                        <TouchableOpacity
                            style={[styles.modernPremiumButton, loading && styles.modernPremiumButtonDisabled]}
                            onPress={() => handlePurchase(selectedPlan)}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <View style={styles.premiumButtonContent}>
                                    <Text style={styles.modernPremiumButtonText}>
                                        {selectedPlan === 'lifetime' ? 'Get Lifetime Access' : 'Start Premium'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Modern Free Button */}
                        {freeAnalysesEnabled && !freeTrialUsed && (
                            <TouchableOpacity
                                style={styles.modernFreeButton}
                                onPress={startFreeAnalyses}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modernFreeButtonText}>
                                    {source === 'onboarding' ? 'Start with 1 Free Analysis' : 'Try 1 Free Analysis'}
                                </Text>
                            </TouchableOpacity>
                        )}

                    </View>

                    {/* Compact Footer Links */}
                    <View style={styles.footerLinksSection}>
                        <TouchableOpacity onPress={handleRestorePurchases}>
                            <Text style={styles.footerLinkText}>Restore</Text>
                        </TouchableOpacity>
                        <Text style={styles.footerSeparator}>•</Text>
                        <TouchableOpacity
                            onPress={() =>
                                Linking.openURL(
                                    "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                                )
                            }
                        >
                            <Text style={styles.footerLinkText}>Terms</Text>
                        </TouchableOpacity>
                        <Text style={styles.footerSeparator}>•</Text>
                        <TouchableOpacity
                            onPress={() =>
                                Linking.openURL(
                                    "https://www.freeprivacypolicy.com/live/d267bff4-586c-40d4-a03f-e425112f455d"
                                )
                            }
                        >
                            <Text style={styles.footerLinkText}>Privacy</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    safeArea: {
        backgroundColor: '#ffffff',
    },
    
    // Modern Header
    modernHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    modernCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Content
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    
    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    modernIconContainer: {
        marginBottom: 16,
    },
    modernIconBackground: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#13a4ec',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13a4ec',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    placeholderLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    placeholderLogoText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    modernTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    modernSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    
    // Modern Features
    modernFeaturesSection: {
        marginBottom: 12,
    },
    modernFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginBottom: 2,
    },
    featureIconContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    modernFeatureText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    
    // Modern Pricing
    modernPricingSection: {
        marginBottom: 20,
    },
    modernSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 16,
    },
    modernPlanCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    modernSelectedPlanCard: {
        borderColor: '#13a4ec',
        backgroundColor: '#FAFBFF',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modernPlanTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    popularBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        backgroundColor: '#13a4ec',
        borderColor: '#13a4ec',
    },
    modernPlanPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#13a4ec',
        marginBottom: 2,
    },
    modernPlanSubtext: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '400',
    },
    
    // Modern Buttons
    modernPremiumButton: {
        backgroundColor: '#13a4ec',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 8,
        shadowColor: '#13a4ec',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    modernPremiumButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    premiumButtonContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    modernPremiumButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    modernFreeButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modernFreeButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    
    // Premium active styles
    premiumActiveContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    premiumActiveText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 26,
    },
    continueButton: {
        backgroundColor: '#13a4ec',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginTop: 20,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    
    // Legacy styles (keeping for compatibility)
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

    // Compact Usage Stats
    compactUsageSection: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        alignSelf: 'center',
    },
    compactUsageText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '500',
        textAlign: 'center',
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
        padding: 12,
        marginBottom: 16,
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
        marginBottom: 16,
    },
    premiumButton: {
        backgroundColor: '#13a4ec',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#13a4ec',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
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
        borderColor: '#13a4ec',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#13a4ec',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    freeButtonText: {
        color: '#13a4ec',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Terms
    termsSection: {
        width: '100%',
        paddingHorizontal: 8,
    },
    termsText: {
        fontSize: 10,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 14,
    },
    linkButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    linkText: {
        color: '#13a4ec',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    
    // Compact Footer Links
    footerLinksSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    footerLinkText: {
        color: '#13a4ec',
        fontSize: 12,
        fontWeight: '600',
    },
    footerSeparator: {
        color: '#999999',
        fontSize: 12,
        fontWeight: '400',
    },
});

