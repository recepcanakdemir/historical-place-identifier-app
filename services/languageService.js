// services/languageService.js - Clean version
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const LANGUAGE_STORAGE_KEY = 'user_selected_language';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

// Cihaz dilini algıla
export const getDeviceLanguage = () => {
  const locale = Localization.locale || Localization.getLocales()[0]?.languageCode || 'en';
  const languageCode = locale.split('-')[0];
  
  // Desteklenen diller içinde var mı kontrol et
  const isSupported = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return isSupported ? languageCode : 'en';
};

// Kullanıcının seçtiği dili kaydet
export const saveUserLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    console.log('User language saved:', languageCode);
  } catch (error) {
    console.error('Error saving user language:', error);
  }
};

// Kullanıcının seçtiği dili al
export const getUserLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage;
  } catch (error) {
    console.error('Error getting user language:', error);
    return null;
  }
};

// Aktif dili al (kullanıcı seçimi > cihaz dili)
export const getCurrentLanguage = async () => {
  const userLanguage = await getUserLanguage();
  const deviceLanguage = getDeviceLanguage();
  
  const selectedLanguage = userLanguage || deviceLanguage;
  console.log('Current language:', selectedLanguage);
  
  return selectedLanguage;
};

// Dil değiştir
export const changeLanguage = async (languageCode) => {
  await saveUserLanguage(languageCode);
  return languageCode;
};

// Dil sıfırla (cihaz diline dön)
export const resetToDeviceLanguage = async () => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error resetting language:', error);
    return getDeviceLanguage();
  }
};

// UI metinleri
export const getUITexts = (languageCode) => {
  const texts = {
    'tr': {
      // Settings
      settings: 'Ayarlar',
      language: 'Dil',
      selectLanguage: 'Dil Seçin',
      deviceLanguage: 'Cihaz Dili',
      changeLanguage: 'Dil Değiştir',
      languageChanged: 'Dil değiştirildi',
      languageChangedMessage: 'Uygulama dili değiştirildi.',
      ok: 'Tamam',
      cancel: 'İptal',
      resetToDevice: 'Cihaz Diline Dön',
      currentLanguage: 'Mevcut Dil',
      // Home Screen
      appName: 'Tarihi Yerler',
      discoverHistory: 'Tarihi Keşfet',
      subtitle: 'AI destekli tarihi bilgilerle anıtları ve önemli yerleri keşfedin',
      takePhoto: 'Fotoğraf Çek',
      withLocation: 'konum algılama ile',
      chooseGallery: 'Galeriden Seç',
      analyzeAny: 'herhangi bir görüntüyü analiz et',
      languagesSupported: '10+ dil desteği',
      locationAware: 'Konum farkındalıklı analiz',
      saveDiscoveries: 'Keşiflerinizi kaydedin',
      menu: 'Menü',
      savedPlaces: 'Kayıtlı Yerler',
    },
    'en': {
      // Settings
      settings: 'Settings',
      language: 'Language',
      selectLanguage: 'Select Language',
      deviceLanguage: 'Device Language',
      changeLanguage: 'Change Language',
      languageChanged: 'Language Changed',
      languageChangedMessage: 'App language has been changed.',
      ok: 'OK',
      cancel: 'Cancel',
      resetToDevice: 'Reset to Device Language',
      currentLanguage: 'Current Language',
      // Home Screen
      appName: 'LandmarkAI',
      discoverHistory: 'Discover History',
      subtitle: 'Explore monuments and landmarks with AI-powered landmarks historical insights',
      takePhoto: 'Take Photo',
      withLocation: 'with location detection',
      chooseGallery: 'Choose from Gallery',
      analyzeAny: 'analyze any image',
      languagesSupported: '10+ languages supported',
      locationAware: 'Location-aware analysis',
      saveDiscoveries: 'Save your discoveries',
      menu: 'Menu',
      savedPlaces: 'Saved Places',
    },
    'es': {
      // Settings
      settings: 'Configuración',
      language: 'Idioma',
      selectLanguage: 'Seleccionar Idioma',
      deviceLanguage: 'Idioma del Dispositivo',
      changeLanguage: 'Cambiar Idioma',
      languageChanged: 'Idioma Cambiado',
      languageChangedMessage: 'El idioma de la aplicación ha sido cambiado.',
      ok: 'OK',
      cancel: 'Cancelar',
      resetToDevice: 'Restablecer al Idioma del Dispositivo',
      currentLanguage: 'Idioma Actual',
      // Home Screen
      appName: 'Lugares Históricos',
      discoverHistory: 'Descubrir Historia',
      subtitle: 'Explora monumentos y sitios emblemáticos con información histórica impulsada por IA',
      takePhoto: 'Tomar Foto',
      withLocation: 'con detección de ubicación',
      chooseGallery: 'Elegir de Galería',
      analyzeAny: 'analizar cualquier imagen',
      languagesSupported: '10+ idiomas soportados',
      locationAware: 'Análisis consciente de ubicación',
      saveDiscoveries: 'Guarda tus descubrimientos',
      menu: 'Menú',
      savedPlaces: 'Lugares Guardados',
    },
    'fr': {
      // Settings
      settings: 'Paramètres',
      language: 'Langue',
      selectLanguage: 'Sélectionner la Langue',
      deviceLanguage: 'Langue de l\'Appareil',
      changeLanguage: 'Changer de Langue',
      languageChanged: 'Langue Changée',
      languageChangedMessage: 'La langue de l\'application a été changée.',
      ok: 'OK',
      cancel: 'Annuler',
      resetToDevice: 'Réinitialiser à la Langue de l\'Appareil',
      currentLanguage: 'Langue Actuelle',
      // Home Screen
      appName: 'Lieux Historiques',
      discoverHistory: 'Découvrir l\'Histoire',
      subtitle: 'Explorez les monuments et sites emblématiques avec des informations historiques alimentées par l\'IA',
      takePhoto: 'Prendre une Photo',
      withLocation: 'avec détection de localisation',
      chooseGallery: 'Choisir de la Galerie',
      analyzeAny: 'analyser n\'importe quelle image',
      languagesSupported: '10+ langues supportées',
      locationAware: 'Analyse consciente de la localisation',
      saveDiscoveries: 'Sauvegardez vos découvertes',
      menu: 'Menu',
      savedPlaces: 'Lieux Sauvegardés',
    },
    'de': {
      // Settings
      settings: 'Einstellungen',
      language: 'Sprache',
      selectLanguage: 'Sprache Auswählen',
      deviceLanguage: 'Gerätesprache',
      changeLanguage: 'Sprache Ändern',
      languageChanged: 'Sprache Geändert',
      languageChangedMessage: 'Die App-Sprache wurde geändert.',
      ok: 'OK',
      cancel: 'Abbrechen',
      resetToDevice: 'Auf Gerätesprache Zurücksetzen',
      currentLanguage: 'Aktuelle Sprache',
      // Home Screen
      appName: 'Historische Orte',
      discoverHistory: 'Geschichte Entdecken',
      subtitle: 'Erkunden Sie Denkmäler und Wahrzeichen mit KI-gestützten historischen Einblicken',
      takePhoto: 'Foto Aufnehmen',
      withLocation: 'mit Standorterkennung',
      chooseGallery: 'Aus Galerie Wählen',
      analyzeAny: 'beliebiges Bild analysieren',
      languagesSupported: '10+ Sprachen unterstützt',
      locationAware: 'Standortbewusste Analyse',
      saveDiscoveries: 'Speichern Sie Ihre Entdeckungen',
      menu: 'Menü',
      savedPlaces: 'Gespeicherte Orte',
    },
    'it': {
      // Settings
      settings: 'Impostazioni',
      language: 'Lingua',
      selectLanguage: 'Seleziona Lingua',
      deviceLanguage: 'Lingua del Dispositivo',
      changeLanguage: 'Cambia Lingua',
      languageChanged: 'Lingua Cambiata',
      languageChangedMessage: 'La lingua dell\'app è stata cambiata.',
      ok: 'OK',
      cancel: 'Annulla',
      resetToDevice: 'Ripristina alla Lingua del Dispositivo',
      currentLanguage: 'Lingua Attuale',
      // Home Screen
      appName: 'Luoghi Storici',
      discoverHistory: 'Scopri la Storia',
      subtitle: 'Esplora monumenti e punti di riferimento con informazioni storiche alimentate dall\'IA',
      takePhoto: 'Scatta Foto',
      withLocation: 'con rilevamento della posizione',
      chooseGallery: 'Scegli dalla Galleria',
      analyzeAny: 'analizza qualsiasi immagine',
      languagesSupported: '10+ lingue supportate',
      locationAware: 'Analisi consapevole della posizione',
      saveDiscoveries: 'Salva le tue scoperte',
      menu: 'Menu',
      savedPlaces: 'Luoghi Salvati',
    },
    'ar': {
      // Settings
      settings: 'الإعدادات',
      language: 'اللغة',
      selectLanguage: 'اختر اللغة',
      deviceLanguage: 'لغة الجهاز',
      changeLanguage: 'تغيير اللغة',
      languageChanged: 'تم تغيير اللغة',
      languageChangedMessage: 'تم تغيير لغة التطبيق.',
      ok: 'موافق',
      cancel: 'إلغاء',
      resetToDevice: 'العودة إلى لغة الجهاز',
      currentLanguage: 'اللغة الحالية',
      // Home Screen
      appName: 'الأماكن التاريخية',
      discoverHistory: 'اكتشف التاريخ',
      subtitle: 'استكشف المعالم والآثار التاريخية مع رؤى تاريخية مدعومة بالذكاء الاصطناعي',
      takePhoto: 'التقط صورة',
      withLocation: 'مع تحديد الموقع',
      chooseGallery: 'اختر من المعرض',
      analyzeAny: 'تحليل أي صورة',
      languagesSupported: '10+ لغات مدعومة',
      locationAware: 'تحليل مدرك للموقع',
      saveDiscoveries: 'احفظ اكتشافاتك',
      menu: 'القائمة',
      savedPlaces: 'الأماكن المحفوظة',
    },
    'ru': {
      // Settings
      settings: 'Настройки',
      language: 'Язык',
      selectLanguage: 'Выбрать Язык',
      deviceLanguage: 'Язык Устройства',
      changeLanguage: 'Изменить Язык',
      languageChanged: 'Язык Изменен',
      languageChangedMessage: 'Язык приложения был изменен.',
      ok: 'OK',
      cancel: 'Отмена',
      resetToDevice: 'Сброс на Язык Устройства',
      currentLanguage: 'Текущий Язык',
      // Home Screen
      appName: 'Исторические Места',
      discoverHistory: 'Открой Историю',
      subtitle: 'Исследуйте памятники и достопримечательности с историческими знаниями на основе ИИ',
      takePhoto: 'Сделать Фото',
      withLocation: 'с определением местоположения',
      chooseGallery: 'Выбрать из Галереи',
      analyzeAny: 'анализировать любое изображение',
      languagesSupported: '10+ языков поддерживается',
      locationAware: 'Анализ с учетом местоположения',
      saveDiscoveries: 'Сохраните свои открытия',
      menu: 'Меню',
      savedPlaces: 'Сохраненные Места',
    },
    'zh': {
      // Settings
      settings: '设置',
      language: '语言',
      selectLanguage: '选择语言',
      deviceLanguage: '设备语言',
      changeLanguage: '更改语言',
      languageChanged: '语言已更改',
      languageChangedMessage: '应用程序语言已更改。',
      ok: '确定',
      cancel: '取消',
      resetToDevice: '重置为设备语言',
      currentLanguage: '当前语言',
      // Home Screen
      appName: '历史景点',
      discoverHistory: '探索历史',
      subtitle: '通过AI驱动的历史洞察探索纪念碑和地标',
      takePhoto: '拍照',
      withLocation: '带位置检测',
      chooseGallery: '从相册选择',
      analyzeAny: '分析任何图像',
      languagesSupported: '支持10+种语言',
      locationAware: '位置感知分析',
      saveDiscoveries: '保存您的发现',
      menu: '菜单',
      savedPlaces: '已保存的地点',
    },
    'ja': {
      // Settings
      settings: '設定',
      language: '言語',
      selectLanguage: '言語を選択',
      deviceLanguage: 'デバイス言語',
      changeLanguage: '言語を変更',
      languageChanged: '言語が変更されました',
      languageChangedMessage: 'アプリの言語が変更されました。',
      ok: 'OK',
      cancel: 'キャンセル',
      resetToDevice: 'デバイス言語にリセット',
      currentLanguage: '現在の言語',
      // Home Screen
      appName: '歴史的な場所',
      discoverHistory: '歴史を発見',
      subtitle: 'AI支援の歴史的洞察で記念碑やランドマークを探索',
      takePhoto: '写真を撮る',
      withLocation: '位置検出付き',
      chooseGallery: 'ギャラリーから選択',
      analyzeAny: '任意の画像を分析',
      languagesSupported: '10+言語サポート',
      locationAware: '位置認識分析',
      saveDiscoveries: '発見を保存',
      menu: 'メニュー',
      savedPlaces: '保存された場所',
    }
  };

  return texts[languageCode] || texts['en'];
};