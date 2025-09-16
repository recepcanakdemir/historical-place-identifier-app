export const en = {
  // App Navigation
  navigation: {
    home: 'Home',
    saved: 'Saved',
    settings: 'Settings',
    back: 'Back',
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
    done: 'Done',
    continue: 'Continue',
    skip: 'Skip',
    next: 'Next',
    previous: 'Previous',
  },

  // App Identity
  app: {
    name: 'LandmarkAI',
    discoverHistory: 'Discover History',
    subtitle: 'Your AI-powered travel companion for exploring historical landmarks',
    startYourJourney: 'Start Your Journey',
  },

  // Home Screen
  home: {
    capture: 'Capture',
    takePhoto: 'Take a photo',
    explore: 'Explore',
    choosePhoto: 'Choose photo',
    whyTravelersLoveUs: 'Why Travelers Love Us',
    features: {
      multiLanguage: {
        title: 'Multi-Language',
        description: '10+ languages supported',
      },
      locationSmart: {
        title: 'Location Smart',
        description: 'Context-aware discoveries',
      },
      saveAndShare: {
        title: 'Save & Share',
        description: 'Build your travel journal',
      },
      aiGuide: {
        title: 'AI Guide',
        description: 'Instant historical insights',
      },
    },
  },

  // Camera Screen
  camera: {
    photo: 'Photo',
    locationEnabled: 'Location enabled',
    locationDisabled: 'Location disabled',
    gettingLocation: 'Getting location...',
    pointAtHistorical: 'Point at a historical building or monument',
    permissions: {
      cameraRequired: 'Camera Access Required',
      cameraMessage: 'We need access to your camera to analyze historical places and landmarks.',
      locationTitle: 'Location for Better Analysis',
      locationMessage: 'Allow location access for more accurate historical place identification?\n\nThis helps our AI provide better context about landmarks near you.',
    },
    actions: {
      openSettings: 'Open Settings',
      goBack: 'Go Back',
      allow: 'Allow',
    },
  },

  // Result Screen
  result: {
    title: 'Analysis Result',
    states: {
      analyzing: 'Analyzing landmark...',
      aiIdentifying: 'AI is identifying historical details',
      loadingSaved: 'Loading saved data...',
      retrievingInfo: 'Retrieving your saved information',
    },
    sections: {
      keyInformation: 'Key Information',
      location: 'Location',
      built: 'Built',
      architecture: 'Architecture',
      historicalSignificance: 'Historical Significance',
      funFacts: 'Fun Facts',
      nearbyMustSee: 'Nearby Must-See Places',
    },
    actions: {
      enhancingLinks: 'Enhancing links...',
      viewAllSaved: 'View All Saved Places',
      askAI: 'Ask AI',
      tryAgain: 'Try Again',
    },
    messages: {
      savedSuccess: 'Saved!',
      savedMessage: 'This landmark has been saved to your collection.',
      failedToSave: 'Failed to save this place. Please try again.',
      failedToAnalyze: 'Failed to analyze the image. Please try again.',
      noImageProvided: 'No image provided',
    },
    limitModal: {
      title: 'Analysis Limit Reached',
      subtitle: 'You\'ve used your {count} free analysis!',
      upgradeTitle: 'Upgrade to Premium for:',
      features: {
        unlimited: '✨ Unlimited analyses',
        priority: '🚀 Priority AI processing',
        advanced: '💾 Advanced saving features',
      },
      upgradeButton: 'Upgrade to Premium',
      backButton: 'Go Back',
    },
  },

  // Saved Screen
  saved: {
    title: 'Saved Places',
    subtitle: '{count} places saved',
    empty: {
      title: 'No Saved Places',
      message: 'Start exploring to discover and save historical landmarks!',
      button: 'Start Exploring',
    },
    actions: {
      deleteAll: 'Delete All',
      confirmDelete: 'Delete All Places?',
      confirmMessage: 'This action cannot be undone. All saved places will be permanently deleted.',
      delete: 'Delete',
      allDeleted: 'All saved places have been deleted.',
    },
  },

  // Settings Screen
  settings: {
    language: {
      title: 'Language',
      current: 'Current Language',
      select: 'Select Language',
      device: 'Device Language',
      change: 'Change Language',
      changed: 'Language Changed',
      changedMessage: 'App language has been changed.',
      resetToDevice: 'Reset to Device Language',
    },
    support: {
      title: 'Support',
      contactUs: 'Contact Us',
      rateApp: 'Rate App',
      shareApp: 'Share App',
    },
    legal: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    about: {
      version: 'Version',
      title: 'About',
    },
    usage: {
      stats: 'Usage Statistics',
      totalAnalyses: 'Total Analyses',
      remaining: 'Remaining',
    },
  },

  // Paywall Screen
  paywall: {
    welcome: {
      title: 'Welcome to LandmarkAI',
      subtitle: 'Discover the stories behind monuments and landmarks',
    },
    limit: {
      title: 'Analysis Limit Reached',
      subtitle: 'Upgrade to continue discovering landmarks',
    },
    premium: {
      title: 'Premium Access',
      subtitle: 'Unlock unlimited landmark analysis',
    },
    features: {
      unlimited: 'Unlimited landmark analyses',
      priority: 'Priority AI processing',
      advanced: 'Advanced saving features',
      noAds: 'Ad-free experience',
    },
    plans: {
      choose: 'Choose Your Plan',
      lifetime: {
        title: 'Lifetime',
        badge: 'Most Popular',
        description: 'One-time payment • No recurring fees',
      },
      weekly: {
        title: 'Weekly',
        description: 'Auto-renewable • Cancel anytime',
      },
      monthly: {
        title: 'Monthly',
        description: 'Auto-renewable • Cancel anytime',
      },
    },
    trial: {
      enabled: '1 Free Analysis Enabled',
      noPayment: 'NO PAYMENT REQUIRED TODAY',
    },
    buttons: {
      getLifetime: 'Get Lifetime Access',
      startPremium: 'Start Premium',
      startWith1Free: 'Start with 1 Free Analysis',
      try1Free: 'Try 1 Free Analysis',
      restore: 'Restore',
    },
    messages: {
      alreadyUnlimited: 'You already have unlimited access to all features!',
      continueExploring: 'Continue Exploring',
      premiumRequired: 'Premium Required',
      noFreeAnalysesLeft: 'You have no free analyses remaining. Please upgrade to premium or purchase a subscription to continue.',
      purchaseSuccess: 'Purchase Successful!',
      welcomeToPremium: 'Welcome to Premium! You now have unlimited access to all features.',
      purchaseError: 'Purchase Error',
      purchaseFailed: 'Purchase failed. Please try again.',
    },
  },

  // Chat Modal
  chat: {
    title: 'Chat with AI',
    about: 'Chat about',
    welcome: 'Hello! I\'m your personal guide for {name}. Ask me anything about its history, architecture, significance, or interesting facts!',
    placeholder: 'Ask about history, architecture, or fun facts...',
    thinking: 'AI is thinking...',
    send: 'Send',
    error: {
      title: 'Chat Error',
      message: 'Unable to send message. Please try again.',
    },
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome',
    getStarted: 'Get Started',
    screens: {
      discover: {
        title: 'Discover History',
        description: 'Use AI to identify historical landmarks and monuments instantly',
      },
      analysis: {
        title: 'Smart Analysis',
        description: 'Get detailed information about architecture, history, and significance',
      },
      explore: {
        title: 'Save & Explore',
        description: 'Build your personal collection of discovered places and nearby attractions',
      },
    },
  },

  // Usage Limits
  usage: {
    limitReached: 'Analysis Limit Reached',
    usedFree: 'You\'ve used your {count} free analysis!',
    upgradeToPremium: 'Upgrade to Premium',
    upgradeFor: 'Upgrade to Premium for:',
    features: {
      unlimitedAnalysis: '✨ Unlimited analyses',
      priorityAI: '🚀 Priority AI processing',
      advancedSaving: '💾 Advanced saving features',
    },
    freeTrialActive: 'Free Trial Active',
    daysRemaining: '{count} day{s} remaining',
    freeAnalysisLeft: '{remaining} of {total} free analysis left',
  },

  // Error Messages
  errors: {
    requestingCamera: 'Requesting camera permission...',
    cameraPermissionTitle: 'Camera Permission',
    cameraPermissionSettings: 'Please enable camera access in Settings > LandmarkAI > Camera',
    goToSettings: 'Go to Settings',
  },

  // Nearby Places
  places: {
    openInMaps: 'Open in Maps',
    directions: 'Directions',
    nearby: 'Nearby Places',
    distanceAway: '{distance} away',
  },

  // General Actions
  actions: {
    share: 'Share',
    save: 'Save',
    loading: 'Loading...',
    retry: 'Retry',
    refresh: 'Refresh',
  },

  // Legacy flat keys for backward compatibility
  startExploringButton: 'Start Exploring',
  welcomeToPremium: 'Welcome to Premium! You now have unlimited access to all features.',
};