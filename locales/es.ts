export const es = {
  // App Navigation
  navigation: {
    home: 'Inicio',
    saved: 'Guardados',
    settings: 'Configuración',
    back: 'Atrás',
    close: 'Cerrar',
    cancel: 'Cancelar',
    ok: 'OK',
    done: 'Hecho',
    continue: 'Continuar',
    skip: 'Omitir',
    next: 'Siguiente',
    previous: 'Anterior',
  },

  // App Identity
  app: {
    name: 'Lugares Históricos',
    discoverHistory: 'Descubrir Historia',
    subtitle: 'Tu compañero de viaje impulsado por IA para explorar monumentos históricos',
    startYourJourney: 'Comienza tu Viaje',
  },

  // Home Screen
  home: {
    capture: 'Capturar',
    takePhoto: 'Tomar foto',
    explore: 'Explorar',
    choosePhoto: 'Elegir foto',
    whyTravelersLoveUs: 'Por qué los Viajeros nos Aman',
    features: {
      multiLanguage: {
        title: 'Multi-Idioma',
        description: '10+ idiomas soportados',
      },
      locationSmart: {
        title: 'Inteligente de Ubicación',
        description: 'Descubrimientos conscientes del contexto',
      },
      saveAndShare: {
        title: 'Guardar y Compartir',
        description: 'Construye tu diario de viaje',
      },
      aiGuide: {
        title: 'Guía IA',
        description: 'Perspectivas históricas instantáneas',
      },
    },
  },

  // Camera Screen
  camera: {
    photo: 'Foto',
    locationEnabled: 'Ubicación habilitada',
    locationDisabled: 'Ubicación deshabilitada',
    gettingLocation: 'Obteniendo ubicación...',
    pointAtHistorical: 'Apunta a un edificio histórico o monumento',
    permissions: {
      cameraRequired: 'Acceso a Cámara Requerido',
      cameraMessage: 'Necesitamos acceso a tu cámara para analizar lugares históricos y monumentos.',
      locationTitle: 'Ubicación para Mejor Análisis',
      locationMessage: '¿Permitir acceso a ubicación para identificación más precisa de lugares históricos?\n\nEsto ayuda a nuestra IA a proporcionar mejor contexto sobre monumentos cerca de ti.',
    },
    actions: {
      openSettings: 'Abrir Configuración',
      goBack: 'Volver',
      allow: 'Permitir',
    },
  },

  // Result Screen
  result: {
    title: 'Resultado del Análisis',
    states: {
      analyzing: 'Analizando monumento...',
      aiIdentifying: 'La IA está identificando detalles históricos',
      loadingSaved: 'Cargando datos guardados...',
      retrievingInfo: 'Recuperando tu información guardada',
    },
    sections: {
      keyInformation: 'Información Clave',
      location: 'Ubicación',
      built: 'Construido',
      architecture: 'Arquitectura',
      historicalSignificance: 'Importancia Histórica',
      funFacts: 'Datos Curiosos',
      nearbyMustSee: 'Lugares Cercanos Imprescindibles',
    },
    actions: {
      enhancingLinks: 'Mejorando enlaces...',
      viewAllSaved: 'Ver Todos los Guardados',
      askAI: 'Preguntar a IA',
      tryAgain: 'Intentar de Nuevo',
    },
    messages: {
      savedSuccess: '¡Guardado!',
      savedMessage: 'Este monumento ha sido guardado en tu colección.',
      failedToSave: 'Error al guardar este lugar. Por favor intenta de nuevo.',
      failedToAnalyze: 'Error al analizar la imagen. Por favor intenta de nuevo.',
      noImageProvided: 'No se proporcionó imagen',
    },
    limitModal: {
      title: 'Límite de Análisis Alcanzado',
      subtitle: '¡Has usado tu {count} análisis gratuito!',
      upgradeTitle: 'Actualizar a Premium para:',
      features: {
        unlimited: '✨ Análisis ilimitados',
        priority: '🚀 Procesamiento IA prioritario',
        advanced: '💾 Funciones de guardado avanzadas',
      },
      upgradeButton: 'Actualizar a Premium',
      backButton: 'Volver',
    },
  },

  // Saved Screen
  saved: {
    title: 'Lugares Guardados',
    subtitle: '{count} lugares guardados',
    empty: {
      title: 'No hay Lugares Guardados',
      message: '¡Comienza a explorar para descubrir y guardar monumentos históricos!',
      button: 'Comenzar a Explorar',
    },
    actions: {
      deleteAll: 'Eliminar Todo',
      confirmDelete: '¿Eliminar Todos los Lugares?',
      confirmMessage: 'Esta acción no se puede deshacer. Todos los lugares guardados serán eliminados permanentemente.',
      delete: 'Eliminar',
      allDeleted: 'Todos los lugares guardados han sido eliminados.',
    },
  },

  // Settings Screen
  settings: {
    language: {
      title: 'Idioma',
      current: 'Idioma Actual',
      select: 'Seleccionar Idioma',
      device: 'Idioma del Dispositivo',
      change: 'Cambiar Idioma',
      changed: 'Idioma Cambiado',
      changedMessage: 'El idioma de la aplicación ha sido cambiado.',
      resetToDevice: 'Restablecer al Idioma del Dispositivo',
    },
    support: {
      title: 'Soporte',
      contactUs: 'Contáctanos',
      rateApp: 'Calificar App',
      shareApp: 'Compartir App',
    },
    legal: {
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio',
    },
    about: {
      version: 'Versión',
      title: 'Acerca de',
    },
    usage: {
      stats: 'Estadísticas de Uso',
      totalAnalyses: 'Análisis Totales',
      remaining: 'Restante',
    },
  },

  // Paywall Screen
  paywall: {
    welcome: {
      title: 'Bienvenido a LandmarkAI',
      subtitle: 'Descubre las historias detrás de monumentos y lugares emblemáticos',
    },
    limit: {
      title: 'Límite de Análisis Alcanzado',
      subtitle: 'Actualiza para continuar descubriendo monumentos',
    },
    premium: {
      title: 'Acceso Premium',
      subtitle: 'Desbloquea análisis ilimitado de monumentos',
    },
    features: {
      unlimited: 'Análisis ilimitados de monumentos',
      priority: 'Procesamiento IA prioritario',
      advanced: 'Funciones de guardado avanzadas',
      noAds: 'Experiencia sin anuncios',
    },
    plans: {
      choose: 'Elige tu Plan',
      lifetime: {
        title: 'De por vida',
        badge: 'Más Popular',
        description: 'Pago único • Sin tarifas recurrentes',
      },
      weekly: {
        title: 'Semanal',
        description: 'Renovación automática • Cancela en cualquier momento',
      },
      monthly: {
        title: 'Mensual',
        description: 'Renovación automática • Cancela en cualquier momento',
      },
    },
    trial: {
      enabled: '1 Análisis Gratuito Habilitado',
      noPayment: 'NO SE REQUIERE PAGO HOY',
    },
    buttons: {
      getLifetime: 'Obtener Acceso de por Vida',
      startPremium: 'Iniciar Premium',
      startWith1Free: 'Comenzar con 1 Análisis Gratuito',
      try1Free: 'Probar 1 Análisis Gratuito',
      restore: 'Restaurar',
    },
    messages: {
      alreadyUnlimited: '¡Ya tienes acceso ilimitado a todas las funciones!',
      continueExploring: 'Continuar Explorando',
      premiumRequired: 'Premium Requerido',
      noFreeAnalysesLeft: 'No tienes análisis gratuitos restantes. Actualiza a premium o compra una suscripción para continuar.',
      purchaseSuccess: '¡Compra Exitosa!',
      welcomeToPremium: '¡Bienvenido a Premium! Ahora tienes acceso ilimitado a todas las funciones.',
      purchaseError: 'Error de Compra',
      purchaseFailed: 'La compra falló. Por favor intenta de nuevo.',
    },
  },

  // Chat Modal
  chat: {
    title: 'Chat con IA',
    about: 'Chat sobre',
    welcome: '¡Hola! Soy tu guía personal para {name}. ¡Pregúntame cualquier cosa sobre su historia, arquitectura, importancia o datos curiosos!',
    placeholder: 'Pregunta sobre historia, arquitectura o datos curiosos...',
    thinking: 'IA está pensando...',
    send: 'Enviar',
    error: {
      title: 'Error de Chat',
      message: 'No se puede enviar el mensaje. Por favor intenta de nuevo.',
    },
  },

  // Onboarding
  onboarding: {
    welcome: 'Bienvenido',
    getStarted: 'Comenzar',
    screens: {
      discover: {
        title: 'Descubrir Historia',
        description: 'Usa IA para identificar monumentos históricos y monumentos al instante',
      },
      analysis: {
        title: 'Análisis Inteligente',
        description: 'Obtén información detallada sobre arquitectura, historia e importancia',
      },
      explore: {
        title: 'Guardar y Explorar',
        description: 'Construye tu colección personal de lugares descubiertos y atracciones cercanas',
      },
    },
  },

  // Usage Limits
  usage: {
    limitReached: 'Límite de Análisis Alcanzado',
    usedFree: '¡Has usado tu {count} análisis gratuito!',
    upgradeToPremium: 'Actualizar a Premium',
    upgradeFor: 'Actualizar a Premium para:',
    features: {
      unlimitedAnalysis: '✨ Análisis ilimitados',
      priorityAI: '🚀 Procesamiento IA prioritario',
      advancedSaving: '💾 Funciones de guardado avanzadas',
    },
    freeTrialActive: 'Prueba Gratuita Activa',
    daysRemaining: '{count} día{s} restante{s}',
    freeAnalysisLeft: '{remaining} de {total} análisis gratuitos restantes',
  },

  // Error Messages
  errors: {
    requestingCamera: 'Solicitando permiso de cámara...',
    cameraPermissionTitle: 'Permiso de Cámara',
    cameraPermissionSettings: 'Por favor habilita el acceso a la cámara en Configuración > LandmarkAI > Cámara',
    goToSettings: 'Ir a Configuración',
  },

  // Nearby Places
  places: {
    openInMaps: 'Abrir en Mapas',
    directions: 'Direcciones',
    nearby: 'Lugares Cercanos',
    distanceAway: 'a {distance}',
  },

  // General Actions
  actions: {
    share: 'Compartir',
    save: 'Guardar',
    loading: 'Cargando...',
    retry: 'Reintentar',
    refresh: 'Actualizar',
  },

  // Legacy flat keys for backward compatibility
  startExploringButton: 'Comenzar a Explorar',
  welcomeToPremium: '¡Bienvenido a Premium! Ahora tienes acceso ilimitado a todas las funciones.',
};