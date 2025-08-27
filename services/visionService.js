// services/visionService.js - Debug Version with Enhanced Logging
import { getCurrentLanguage } from './languageService';

// Configuration
const LLM_CONFIG = {
  GOOGLE: {
    apiKey: 'AIzaSyDi-tZX4XDIPIRyIevYEGnyOf-CNs2n_HM',
    model: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  }
};

const CURRENT_LLM = 'GOOGLE';

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
      description: `Bu tarihi bir bina veya anıt gibi görünüyor. ${locationData?.address?.city ? `${locationData.address.city} bölgesinde` : ''} Gerçek analiz için LLM API anahtarınızı yapılandırın. Bu demo, API anahtarı eklediğinizde uygulamanın nasıl çalışacağını gösterir.`,
      location: locationData?.address?.city ? `${locationData.address.city} yakını` : 'Demo Konum',
      yearBuilt: 'Bilinmeyen Dönem',
      significance: 'Bu demo verisidir. LLM API\'nizi yapılandırdığınızda, gerçek yerler ve anıtlar hakkında detaylı tarihi analiz alacaksınız.',
      architecture: 'Çeşitli Mimari Stiller',
      funFacts: [
        'Bu, uygulama işlevselliğini göstermek için demo veridir',
        'Konum algılama, AI\'nın daha doğru analiz sağlamasına yardımcı olur',
        'Uygulama birden fazla LLM görü modelini destekler'
      ]
    },
    'en': {
      name: 'Demo Historical Monument',
      description: `This appears to be a historical building or monument. ${locationData?.address?.city ? `Located in ${locationData.address.city} region.` : ''} Configure your LLM API key for real analysis. This demo shows how the app will work once you add your API key.`,
      location: locationData?.address?.city ? `Near ${locationData.address.city}` : 'Demo Location',
      yearBuilt: 'Unknown Period',
      significance: 'This is demo data. Once you configure your LLM API, you\'ll get detailed historical analysis of real places and monuments.',
      architecture: 'Various Architectural Styles',
      funFacts: [
        'This is demonstration data to show app functionality',
        'Location detection helps AI provide more accurate analysis',
        'The app supports multiple LLM vision models'
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

// Google Gemini Implementation with enhanced debugging
const analyzeWithGemini = async (imageUri, locationData = null) => {
  console.log('🚀 analyzeWithGemini called with locationData:', locationData);
  
  try {
    const config = LLM_CONFIG.GOOGLE;
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
        console.error('⏰ Request timeout after 30 seconds');
        reject(new Error('Request timeout'));
      }, 60000); // 30 second timeout
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          console.log('📝 Base64 conversion complete, length:', base64Data.length);
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Base64 conversion failed');
          }
          
          console.log('🚀 Sending request to Gemini API in', languageCode);
          console.log('🌐 API Endpoint:', config.endpoint);
          
          const requestPayload = {
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          };
          
          console.log('📦 Request payload prepared');
          console.log('🔑 Using API key (first 10 chars):', config.apiKey.substring(0, 10) + '...');
          
          const startTime = Date.now();
          
          const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
            timeout: 25000 // 25 second fetch timeout
          });

          const endTime = Date.now();
          console.log('📨 Response received after', endTime - startTime, 'ms');
          console.log('📊 Response status:', response.status);
          console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API error:', response.status, errorText);
            console.log('🔄 Falling back to demo data due to API error');
            const demoResult = await getDemoData(locationData);
            resolve(demoResult);
            return;
          }

          console.log('📖 Reading response JSON...');
          const result = await response.json();
          console.log('✅ Gemini API response received in', languageCode);
          console.log('📊 Response structure:', Object.keys(result));
          
          if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
            console.error('❌ Invalid Gemini response structure:', result);
            console.log('🔄 Falling back to demo data due to invalid response');
            const demoResult = await getDemoData(locationData);
            resolve(demoResult);
            return;
          }
          
          const content = result.candidates[0].content.parts[0].text;
          console.log('📖 Content from Gemini (first 200 chars):', content.substring(0, 200) + '...');
          
          // Try to parse JSON from the response
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully parsed JSON from Gemini in', languageCode);
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
              funFacts: ['Detailed analysis provided by AI']
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
    console.error('❌ Error in analyzeWithGemini:', error);
    console.log('🔄 Falling back to demo data due to general error');
    return getDemoData(locationData);
  }
};

// Main export function
export const analyzeHistoricalPlace = async (imageUri, locationData = null) => {
  console.log('🎯 analyzeLandmark called with:');
  console.log('- imageUri:', imageUri ? 'provided' : 'missing');
  console.log('- locationData:', locationData);
  
  try {
    // For demo mode, just return demo data
    if (CURRENT_LLM === 'DEMO') {
      console.log('📝 Using demo mode - no API calls');
      return getDemoData(locationData);
    }

    // For Google API
    if (CURRENT_LLM === 'GOOGLE') {
      console.log('🤖 Using Google Gemini API');
      return analyzeWithGemini(imageUri, locationData);
    }

    // Fallback
    console.log('🔄 Falling back to demo data');
    return getDemoData(locationData);
    
  } catch (error) {
    console.error('❌ Error in analyzeHistoricalPlace:', error);
    // Return demo data if anything fails
    return getDemoData(locationData);
  }
};