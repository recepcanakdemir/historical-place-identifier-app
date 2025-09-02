// services/visionService.js - Firebase Functions Version
import { getCurrentLanguage } from './languageService';

// Configuration - Firebase Functions URL
const FIREBASE_CONFIG = {
  FUNCTIONS_URL: 'https://us-central1-landmarkai-55530.cloudfunctions.net/geminiProxy',
  
  TIMEOUT: 60000 // 60 saniye timeout
};

// Helper function to format location for AI
const formatLocationForAI = (locationData) => {
  if (!locationData || !locationData.address) return '';
  
  const addr = locationData.address;
  const parts = [];
  
  if (addr.street) parts.push(addr.street);
  if (addr.city) parts.push(addr.city);
  if (addr.region) parts.push(addr.region);
  if (addr.country) parts.push(addr.country);
  
  return parts.join(', ');
};

// Language detection - uses user settings
const getSelectedLanguage = async () => {
  const language = await getCurrentLanguage();
  console.log('Selected language for AI:', language);
  return language;
};

// Language-specific prompts
const getLanguagePrompt = (languageCode, locationContext) => {
  const prompts = {
    'tr': `Sen bir tarih uzmanı ve rehbersin. ${locationContext}Bu görüntüyü dikkatlice analiz et. Eğer görüntüde tarihi yerler, anıtlar, simge yapılar, heykeller veya mimari açıdan önemli binalar varsa, detaylı tarihi bilgi ver. Eğer görüntüde insanlar, modern binalar, doğa veya tarihi olmayan konular varsa, gördüklerini kibarca açıkla ve mümkün olduğunca ilgili tarihi veya kültürel bağlam sağla. Her zaman yardımcı ve eğitici ol. Yanıtını JSON formatında ver: name (isim), description (açıklama), location (konum), yearBuilt (yapım yılı), significance (önemi), architecture (mimari), funFacts (ilginç bilgiler dizisi). TÜRKÇE yanıt ver.`,
    
    'en': `You are an expert historian and travel guide. ${locationContext}Analyze this image carefully. If the image contains historical places, monuments, landmarks, statues, or architecturally significant buildings, provide detailed historical information. If the image shows people, modern buildings, nature, or other non-historical subjects, politely explain what you see and provide any relevant historical or cultural context. Always be helpful and educational. Format your response as JSON with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array of strings). Respond in ENGLISH.`,
  };
  
  // Default to English if language not supported
  return prompts[languageCode] || prompts['en'];
};

// Demo data with language support
const getDemoData = async (locationData = null) => {
  console.log('getDemoData called with:', locationData);
  
  const languageCode = await getSelectedLanguage();
  
  const demoTexts = {
    'tr': {
      name: 'Demo Tarihi Anıt',
      description: `Bu tarihi bir bina veya anıt gibi görünüyor. ${locationData?.address?.city ? `${locationData.address.city} bölgesinde` : ''} Firebase Functions proxy'niz henüz yapılandırılmamış. Bu demo, proxy yapılandırıldığında uygulamanın nasıl çalışacağını gösterir.`,
      location: locationData?.address?.city ? `${locationData.address.city} yakını` : 'Demo Konum',
      yearBuilt: 'Bilinmeyen Dönem',
      significance: 'Bu demo verisidir. Firebase Functions proxy\'nizi yapılandırdığınızda, gerçek yerler ve anıtlar hakkında detaylı tarihi analiz alacaksınız.',
      architecture: 'Çeşitli Mimari Stiller',
      funFacts: [
        'Bu, uygulama işlevselliğini göstermek için demo veridir',
        'Firebase Functions ile API anahtarınız güvenli kalır',
        'Konum algılama, AI\'nın daha doğru analiz sağlamasına yardımcı olur'
      ]
    },
    'en': {
      name: 'Demo Historical Monument',
      description: `This appears to be a historical building or monument. ${locationData?.address?.city ? `Located in ${locationData.address.city} region.` : ''} Your Firebase Functions proxy is not yet configured. This demo shows how the app will work once the proxy is set up.`,
      location: locationData?.address?.city ? `Near ${locationData.address.city}` : 'Demo Location',
      yearBuilt: 'Unknown Period',
      significance: 'This is demo data. Once you configure your Firebase Functions proxy, you\'ll get detailed historical analysis of real places and monuments.',
      architecture: 'Various Architectural Styles',
      funFacts: [
        'This is demonstration data to show app functionality',
        'Firebase Functions keeps your API key secure',
        'Location detection helps AI provide more accurate analysis'
      ]
    }
  };
  
  const texts = demoTexts[languageCode] || demoTexts['en'];
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(texts);
    }, 2000);
  });
};

// Firebase Functions Implementation with enhanced debugging
const analyzeWithFirebase = async (imageUri, locationData = null) => {
  console.log('🚀 analyzeWithFirebase called with locationData:', locationData);
  
  try {
    const languageCode = await getSelectedLanguage();
    
    // Format location context safely
    let locationContext = '';
    if (locationData) {
      const formattedLocation = formatLocationForAI(locationData);
      if (formattedLocation) {
        const locationTexts = {
          'tr': `Fotoğraf şu yerin yakınında çekildi: ${formattedLocation}. Bu konum bağlamını yeri daha doğru tanımlamak için kullan. `,
          'en': `The photo was taken near: ${formattedLocation}. Use this location context to help identify the place more accurately. `,
        };
        locationContext = locationTexts[languageCode] || locationTexts['en'];
      }
    }
    
    console.log('👤 User selected language:', languageCode);
    console.log('📍 Location context for AI:', locationContext);

    // Get language-specific prompt
    const promptText = getLanguagePrompt(languageCode, locationContext);
    console.log('📝 Prompt prepared, length:', promptText.length);

    // Convert image to base64
    console.log('🔄 Converting image to base64...');
    console.log('📸 Image URI:', imageUri);
    
    const imageData = await fetch(imageUri);
    console.log('📡 Image fetch complete, status:', imageData.status);
    
    if (!imageData.ok) {
      throw new Error(`Image fetch failed: ${imageData.status}`);
    }
    
    const imageBlob = await imageData.blob();
    console.log('📦 Image blob created, size:', imageBlob.size, 'bytes');
    
    if (imageBlob.size === 0) {
      throw new Error('Image blob is empty');
    }
    
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.error('⏰ Request timeout after 60 seconds');
        reject(new Error('Request timeout'));
      }, FIREBASE_CONFIG.TIMEOUT);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          console.log('📝 Base64 conversion complete, length:', base64Data.length);
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Base64 conversion failed');
          }
          
          console.log('🚀 Sending request to Firebase Functions proxy in', languageCode);
          console.log('🌐 Firebase Functions URL:', FIREBASE_CONFIG.FUNCTIONS_URL);
          
          // Firebase Functions için payload - Gemini API format'ında
          const requestPayload = {
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  },
                  {
                    inlineData: { // Firebase proxy Gemini format'ını bekliyor
                      mimeType: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          };
          
          console.log('📦 Request payload prepared for Firebase Functions');
          
          const startTime = Date.now();
          
          // Firebase Functions proxy'sine istek gönder
          const response = await fetch(FIREBASE_CONFIG.FUNCTIONS_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
          });

          const endTime = Date.now();
          console.log('📨 Firebase Functions response received after', endTime - startTime, 'ms');
          console.log('📊 Response status:', response.status);

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Firebase Functions error:', response.status, errorText);
            console.log('🔄 Falling back to demo data due to Firebase error');
            const demoResult = await getDemoData(locationData);
            resolve(demoResult);
            return;
          }

          console.log('📖 Reading Firebase Functions response JSON...');
          const result = await response.json();
          console.log('✅ Firebase Functions response received in', languageCode);
          console.log('📊 Response structure:', Object.keys(result));
          
          if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
            console.error('❌ Invalid Gemini response structure from Firebase:', result);
            console.log('🔄 Falling back to demo data due to invalid response');
            const demoResult = await getDemoData(locationData);
            resolve(demoResult);
            return;
          }
          
          const content = result.candidates[0].content.parts[0].text;
          console.log('📖 Content from Firebase Functions (first 200 chars):', content.substring(0, 200) + '...');
          
          // Try to parse JSON from the response
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully parsed JSON from Firebase Functions in', languageCode);
              resolve(parsed);
              return;
            }
            throw new Error('No JSON found in response');
          } catch (parseError) {
            console.log('⚠️ Could not parse JSON, creating structured response in', languageCode);
            console.log('🔧 Parse error:', parseError.message);
            
            resolve({
              name: 'AI Analysis Result',
              description: content,
              location: 'Analysis provided',
              yearBuilt: 'See description',
              significance: 'Historical context provided in description',
              architecture: 'See description',
              funFacts: ['Detailed analysis provided by AI via Firebase Functions']
            });
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('❌ Fetch error:', fetchError);
          console.log('🔄 Falling back to demo data due to fetch error');
          const demoResult = await getDemoData(locationData);
          resolve(demoResult);
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Error reading image file:', error);
        console.log('🔄 Falling back to demo data due to file read error');
        getDemoData(locationData).then(resolve).catch(reject);
      };
      
      console.log('📖 Starting file read...');
      reader.readAsDataURL(imageBlob);
    });
    
  } catch (error) {
    console.error('❌ Error in analyzeWithFirebase:', error);
    console.log('🔄 Falling back to demo data due to general error');
    return getDemoData(locationData);
  }
};

// Main export function
export const analyzeHistoricalPlace = async (imageUri, locationData = null) => {
  console.log('🎯 analyzeHistoricalPlace called with:');
  console.log('- imageUri:', imageUri ? 'provided' : 'missing');
  console.log('- locationData:', locationData);
  console.log('- Firebase Functions URL:', FIREBASE_CONFIG.FUNCTIONS_URL);
  
  try {
    // Check if Firebase Functions URL is configured
    if (!FIREBASE_CONFIG.FUNCTIONS_URL || FIREBASE_CONFIG.FUNCTIONS_URL.includes('your-project-id')) {
      console.log('⚠️ Firebase Functions URL not configured - using demo mode');
      return getDemoData(locationData);
    }

    console.log('🤖 Using Firebase Functions proxy for Gemini API');
    return analyzeWithFirebase(imageUri, locationData);
    
  } catch (error) {
    console.error('❌ Error in analyzeHistoricalPlace:', error);
    // Return demo data if anything fails
    return getDemoData(locationData);
  }
};