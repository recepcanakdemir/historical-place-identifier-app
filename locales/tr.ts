export const tr = {
  // App Navigation
  navigation: {
    home: 'Ana Sayfa',
    saved: 'Kaydedilenler',
    settings: 'Ayarlar',
    back: 'Geri',
    close: 'Kapat',
    cancel: 'İptal',
    ok: 'Tamam',
    done: 'Tamamlandı',
    continue: 'Devam Et',
    skip: 'Geç',
    next: 'İleri',
    previous: 'Geri',
  },

  // App Identity
  app: {
    name: 'Tarihi Yerler',
    discoverHistory: 'Tarihi Keşfet',
    subtitle: 'AI destekli tarihi bilgilerle anıtları ve önemli yerleri keşfedin',
    startYourJourney: 'Yolculuğunuzu Başlatın',
  },

  // Home Screen
  home: {
    capture: 'Yakala',
    takePhoto: 'Fotoğraf çek',
    explore: 'Keşfet',
    choosePhoto: 'Fotoğraf seç',
    whyTravelersLoveUs: 'Gezginler Bizi Neden Seviyor',
    features: {
      multiLanguage: {
        title: 'Çoklu Dil',
        description: '10+ dil desteği',
      },
      locationSmart: {
        title: 'Konum Akıllı',
        description: 'Konum farkındalıklı keşifler',
      },
      saveAndShare: {
        title: 'Kaydet ve Paylaş',
        description: 'Seyahat günlüğünüzü oluşturun',
      },
      aiGuide: {
        title: 'AI Rehber',
        description: 'Anında tarihi bilgiler',
      },
    },
  },

  // Camera Screen
  camera: {
    photo: 'Fotoğraf',
    locationEnabled: 'Konum etkin',
    locationDisabled: 'Konum kapalı',
    gettingLocation: 'Konum alınıyor...',
    pointAtHistorical: 'Tarihi bir binaya veya anıta doğrultun',
    permissions: {
      cameraRequired: 'Kamera Erişimi Gerekli',
      cameraMessage: 'Tarihi yerleri ve anıtları analiz etmek için kameranıza erişim gerekiyor.',
      locationTitle: 'Daha İyi Analiz İçin Konum',
      locationMessage: 'Daha doğru tarihi yer tanımlaması için konum erişimine izin verilsin mi?\n\nBu, AI\'mızın yakınınızdaki anıtlar hakkında daha iyi bağlam sağlamasına yardımcı olur.',
    },
    actions: {
      openSettings: 'Ayarları Aç',
      goBack: 'Geri Dön',
      allow: 'İzin Ver',
    },
  },

  // Result Screen
  result: {
    title: 'Analiz Sonucu',
    states: {
      analyzing: 'Anıt analiz ediliyor...',
      aiIdentifying: 'AI tarihi detayları tanımlıyor',
      loadingSaved: 'Kaydedilen veri yükleniyor...',
      retrievingInfo: 'Kaydedilen bilgileriniz alınıyor',
    },
    sections: {
      keyInformation: 'Temel Bilgiler',
      location: 'Konum',
      built: 'İnşa',
      architecture: 'Mimari',
      historicalSignificance: 'Tarihi Önemi',
      funFacts: 'İlginç Bilgiler',
      nearbyMustSee: 'Yakındaki Görülmesi Gerekenler',
    },
    actions: {
      enhancingLinks: 'Bağlantılar güçlendiriliyor...',
      viewAllSaved: 'Tüm Kayıtlıları Görüntüle',
      askAI: 'AI\'ya Sor',
      tryAgain: 'Tekrar Dene',
    },
    messages: {
      savedSuccess: 'Kaydedildi!',
      savedMessage: 'Bu anıt koleksiyonunuza kaydedildi.',
      failedToSave: 'Bu yeri kaydetme başarısız. Lütfen tekrar deneyin.',
      failedToAnalyze: 'Görüntüyü analiz etme başarısız. Lütfen tekrar deneyin.',
      noImageProvided: 'Görüntü sağlanmadı',
    },
    limitModal: {
      title: 'Analiz Sınırına Ulaşıldı',
      subtitle: '{count} ücretsiz analizinizi kullandınız!',
      upgradeTitle: 'Premium için yükseltme:',
      features: {
        unlimited: '✨ Sınırsız analiz',
        priority: '🚀 Öncelikli AI işleme',
        advanced: '💾 Gelişmiş kaydetme özellikleri',
      },
      upgradeButton: 'Premium\'a Yükselt',
      backButton: 'Geri Dön',
    },
  },

  // Saved Screen
  saved: {
    title: 'Kaydedilen Yerler',
    subtitle: '{count} yer kaydedildi',
    empty: {
      title: 'Kaydedilen Yer Yok',
      message: 'Tarihi anıtları keşfetmek ve kaydetmek için keşfetmeye başlayın!',
      button: 'Keşfetmeye Başla',
    },
    actions: {
      deleteAll: 'Hepsini Sil',
      confirmDelete: 'Tüm Yerler Silinsin mi?',
      confirmMessage: 'Bu işlem geri alınamaz. Tüm kaydedilen yerler kalıcı olarak silinecek.',
      delete: 'Sil',
      allDeleted: 'Tüm kaydedilen yerler silindi.',
    },
  },

  // Settings Screen
  settings: {
    language: {
      title: 'Dil',
      current: 'Mevcut Dil',
      select: 'Dil Seç',
      device: 'Cihaz Dili',
      change: 'Dil Değiştir',
      changed: 'Dil Değiştirildi',
      changedMessage: 'Uygulama dili değiştirildi.',
      resetToDevice: 'Cihaz Diline Sıfırla',
    },
    support: {
      title: 'Destek',
      contactUs: 'Bize Ulaşın',
      rateApp: 'Uygulamayı Değerlendir',
      shareApp: 'Uygulamayı Paylaş',
    },
    legal: {
      privacy: 'Gizlilik Politikası',
      terms: 'Hizmet Şartları',
    },
    about: {
      version: 'Sürüm',
      title: 'Hakkında',
    },
    usage: {
      stats: 'Kullanım İstatistikleri',
      totalAnalyses: 'Toplam Analiz',
      remaining: 'Kalan',
    },
  },

  // Paywall Screen
  paywall: {
    welcome: {
      title: 'LandmarkAI\'ye Hoş Geldiniz',
      subtitle: 'Anıtların ve önemli yerlerin arkasındaki hikayeleri keşfedin',
    },
    limit: {
      title: 'Analiz Sınırına Ulaşıldı',
      subtitle: 'Anıtları keşfetmeye devam etmek için yükseltin',
    },
    premium: {
      title: 'Premium Erişim',
      subtitle: 'Sınırsız anıt analizinin kilidini açın',
    },
    features: {
      unlimited: 'Sınırsız anıt analizi',
      priority: 'Öncelikli AI işleme',
      advanced: 'Gelişmiş kaydetme özellikleri',
      noAds: 'Reklamsız deneyim',
    },
    plans: {
      choose: 'Planınızı Seçin',
      lifetime: {
        title: 'Yaşam Boyu',
        badge: 'En Popüler',
        description: 'Tek seferlik ödeme • Yinelenen ücret yok',
      },
      weekly: {
        title: 'Haftalık',
        description: 'Otomatik yenilenebilir • İstediğiniz zaman iptal edin',
      },
      monthly: {
        title: 'Aylık',
        description: 'Otomatik yenilenebilir • İstediğiniz zaman iptal edin',
      },
    },
    trial: {
      enabled: '1 Ücretsiz Analiz Etkinleştirildi',
      noPayment: 'BUGÜN ÖDEME GEREKMİYOR',
    },
    buttons: {
      getLifetime: 'Yaşam Boyu Erişim Alın',
      startPremium: 'Premium\'u Başlat',
      startWith1Free: '1 Ücretsiz Analiz ile Başla',
      try1Free: '1 Ücretsiz Analiz Dene',
      restore: 'Geri Yükle',
    },
    messages: {
      alreadyUnlimited: 'Zaten tüm özelliklere sınırsız erişiminiz var!',
      continueExploring: 'Keşfetmeye Devam Et',
      premiumRequired: 'Premium Gerekli',
      noFreeAnalysesLeft: 'Kalan ücretsiz analiziniz yok. Devam etmek için premium\'a yükseltin veya abonelik satın alın.',
      purchaseSuccess: 'Satın Alma Başarılı!',
      welcomeToPremium: 'Premium\'a hoş geldiniz! Artık tüm özelliklere sınırsız erişiminiz var.',
      purchaseError: 'Satın Alma Hatası',
      purchaseFailed: 'Satın alma başarısız. Lütfen tekrar deneyin.',
    },
  },

  // Chat Modal
  chat: {
    title: 'AI ile Sohbet',
    about: 'Hakkında sohbet',
    welcome: 'Merhaba! {name} için kişisel rehberinizim. Tarihi, mimarisi, önemi veya ilginç gerçekler hakkında bana istediğiniz soruyu sorun!',
    placeholder: 'Tarih, mimari veya eğlenceli gerçekler hakkında sor...',
    thinking: 'AI düşünüyor...',
    send: 'Gönder',
    error: {
      title: 'Sohbet Hatası',
      message: 'Mesaj gönderilemiyor. Lütfen tekrar deneyin.',
    },
  },

  // Onboarding
  onboarding: {
    welcome: 'Hoş Geldiniz',
    getStarted: 'Başlayın',
    screens: {
      discover: {
        title: 'Tarihi Keşfet',
        description: 'Tarihi anıtları ve yapıları anında tanımlamak için AI kullanın',
      },
      analysis: {
        title: 'Akıllı Analiz',
        description: 'Mimari, tarih ve önem hakkında detaylı bilgi alın',
      },
      explore: {
        title: 'Kaydet ve Keşfet',
        description: 'Keşfettiğiniz yerlerin ve yakın çevredeki cazibe merkezlerinin kişisel koleksiyonunu oluşturun',
      },
    },
  },

  // Usage Limits
  usage: {
    limitReached: 'Analiz Sınırına Ulaşıldı',
    usedFree: '{count} ücretsiz analizinizi kullandınız!',
    upgradeToPremium: 'Premium\'a Yükselt',
    upgradeFor: 'Sınırsız için Premium\'a yükseltin:',
    features: {
      unlimitedAnalysis: '✨ Sınırsız analiz',
      priorityAI: '🚀 Öncelikli AI işleme',
      advancedSaving: '💾 Gelişmiş kaydetme özellikleri',
    },
    freeTrialActive: 'Ücretsiz Deneme Aktif',
    daysRemaining: '{count} gün kaldı',
    freeAnalysisLeft: '{total} ücretsiz analizden {remaining} tanesi kaldı',
  },

  // Error Messages
  errors: {
    requestingCamera: 'Kamera izni isteniyor...',
    cameraPermissionTitle: 'Kamera İzni',
    cameraPermissionSettings: 'Lütfen Ayarlar > LandmarkAI > Kamera\'da kamera erişimini etkinleştirin',
    goToSettings: 'Ayarlara Git',
  },

  // Nearby Places
  places: {
    openInMaps: 'Haritalarda Aç',
    directions: 'Yol Tarifi',
    nearby: 'Yakındaki Yerler',
    distanceAway: '{distance} uzakta',
  },

  // General Actions
  actions: {
    share: 'Paylaş',
    save: 'Kaydet',
    loading: 'Yükleniyor...',
    retry: 'Yeniden Dene',
    refresh: 'Yenile',
  },

  // Legacy flat keys for backward compatibility
  startExploringButton: 'Keşfetmeye Başla',
  welcomeToPremium: 'Premium\'a hoş geldiniz! Artık tüm özelliklere sınırsız erişiminiz var.',
};