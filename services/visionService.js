// services/visionService.js - Final complete version
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
    
    'es': `Eres un historiador experto y guía turístico. ${locationContext}Analiza esta imagen cuidadosamente. Si la imagen contiene lugares históricos, monumentos, sitios emblemáticos, estatuas o edificios arquitectónicamente significativos, proporciona información histórica detallada. Si la imagen muestra personas, edificios modernos, naturaleza u otros temas no históricos, explica cortésmente lo que ves y proporciona cualquier contexto histórico o cultural relevante. Siempre sé útil y educativo. Formatea tu respuesta como JSON con campos: name, description, location, yearBuilt, significance, architecture, funFacts (array de strings). Responde en ESPAÑOL.`,
    
    'fr': `Vous êtes un historien expert et guide touristique. ${locationContext}Analysez cette image attentivement. Si l'image contient des lieux historiques, monuments, sites emblématiques, statues ou bâtiments architecturalement significatifs, fournissez des informations historiques détaillées. Si l'image montre des personnes, des bâtiments modernes, la nature ou d'autres sujets non historiques, expliquez poliment ce que vous voyez et fournissez tout contexte historique ou culturel pertinent. Soyez toujours utile et éducatif. Formatez votre réponse en JSON avec les champs: name, description, location, yearBuilt, significance, architecture, funFacts (array de strings). Répondez en FRANÇAIS.`,
    
    'de': `Sie sind ein Geschichtsexperte und Reiseführer. ${locationContext}Analysieren Sie dieses Bild sorgfältig. Wenn das Bild historische Orte, Denkmäler, Wahrzeichen, Statuen oder architektonisch bedeutsame Gebäude enthält, geben Sie detaillierte historische Informationen. Wenn das Bild Menschen, moderne Gebäude, Natur oder andere nicht-historische Themen zeigt, erklären Sie höflich, was Sie sehen, und geben Sie relevanten historischen oder kulturellen Kontext. Seien Sie immer hilfreich und lehrreich. Formatieren Sie Ihre Antwort als JSON mit Feldern: name, description, location, yearBuilt, significance, architecture, funFacts (Array von Strings). Antworten Sie auf DEUTSCH.`,
    
    'it': `Sei un esperto storico e guida turistica. ${locationContext}Analizza questa immagine attentamente. Se l'immagine contiene luoghi storici, monumenti, punti di riferimento, statue o edifici architettonicamente significativi, fornisci informazioni storiche dettagliate. Se l'immagine mostra persone, edifici moderni, natura o altri argomenti non storici, spiega cortesemente quello che vedi e fornisci qualsiasi contesto storico o culturale rilevante. Sii sempre utile ed educativo. Formatta la tua risposta come JSON con campi: name, description, location, yearBuilt, significance, architecture, funFacts (array di stringhe). Rispondi in ITALIANO.`,
    
    'ar': `أنت خبير تاريخ ومرشد سياحي. ${locationContext}حلل هذه الصورة بعناية. إذا كانت الصورة تحتوي على أماكن تاريخية أو آثار أو معالم أو تماثيل أو مباني ذات أهمية معمارية، قدم معلومات تاريخية مفصلة. إذا كانت الصورة تظهر أشخاصاً أو مباني حديثة أو طبيعة أو مواضيع أخرى غير تاريخية، اشرح بأدب ما تراه وقدم أي سياق تاريخي أو ثقافي ذي صلة. كن دائماً مفيداً وتعليمياً. صغ إجابتك بصيغة JSON مع الحقول: name, description, location, yearBuilt, significance, architecture, funFacts (مصفوفة من النصوص). أجب بالعربية.`,
    
    'ru': `Вы эксперт-историк и гид. ${locationContext}Внимательно проанализируйте это изображение. Если изображение содержит исторические места, памятники, достопримечательности, статуи или архитектурно значимые здания, предоставьте подробную историческую информацию. Если изображение показывает людей, современные здания, природу или другие неисторические темы, вежливо объясните то, что вы видите, и предоставьте любой соответствующий исторический или культурный контекст. Всегда будьте полезны и поучительны. Отформатируйте ваш ответ как JSON с полями: name, description, location, yearBuilt, significance, architecture, funFacts (массив строк). Отвечайте на РУССКОМ языке.`,
    
    'zh': `您是历史专家和导游。${locationContext}仔细分析这张图片。如果图片包含历史遗迹、纪念碑、地标、雕像或建筑上重要的建筑物，请提供详细的历史信息。如果图片显示人物、现代建筑、自然景观或其他非历史主题，请礼貌地解释您看到的内容，并提供任何相关的历史或文化背景。始终保持有用和教育性。将您的回复格式化为JSON，包含字段：name, description, location, yearBuilt, significance, architecture, funFacts（字符串数组）。请用中文回答。`,
    
    'ja': `あなたは歴史の専門家であり、ガイドです。${locationContext}この画像を注意深く分析してください。画像に歴史的な場所、記念碑、ランドマーク、彫像、または建築学的に重要な建物が含まれている場合は、詳細な歴史情報を提供してください。画像に人物、現代的な建物、自然、またはその他の非歴史的な主題が映っている場合は、見えるものを丁寧に説明し、関連する歴史的または文化的背景を提供してください。常に役立つ教育的な内容にしてください。回答をJSON形式でフォーマットし、以下のフィールドを含めてください：name, description, location, yearBuilt, significance, architecture, funFacts（文字列の配列）。日本語で回答してください。`
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

// Main export function
export const analyzeHistoricalPlace = async (imageUri, locationData = null) => {
  console.log('analyzeHistoricalPlace called with:');
  console.log('- imageUri:', imageUri ? 'provided' : 'missing');
  console.log('- locationData:', locationData);
  
  try {
    // For demo mode, just return demo data
    if (CURRENT_LLM === 'DEMO') {
      console.log('Using demo mode - no API calls');
      return getDemoData(locationData);
    }

    // For Google API
    if (CURRENT_LLM === 'GOOGLE') {
      console.log('Using Google Gemini API');
      return analyzeWithGemini(imageUri, locationData);
    }

    // Fallback
    console.log('Falling back to demo data');
    return getDemoData(locationData);
    
  } catch (error) {
    console.error('Error in analyzeHistoricalPlace:', error);
    // Return demo data if anything fails
    return getDemoData(locationData);
  }
};

// Google Gemini Implementation with language support
const analyzeWithGemini = async (imageUri, locationData = null) => {
  console.log('analyzeWithGemini called with locationData:', locationData);
  
  try {
    const config = LLM_CONFIG.GOOGLE;
    const languageCode = await getSelectedLanguage(); // Uses user settings
    
    // Format location context safely
    let locationContext = '';
    if (locationData) {
      const formattedLocation = formatLocationForAI(locationData);
      if (formattedLocation) {
        const locationTexts = {
          'tr': `Fotoğraf şu yerin yakınında çekildi: ${formattedLocation}. Bu konum bağlamını yeri daha doğru tanımlamak için kullan. `,
          'en': `The photo was taken near: ${formattedLocation}. Use this location context to help identify the place more accurately. `,
          'es': `La foto fue tomada cerca de: ${formattedLocation}. Usa este contexto de ubicación para ayudar a identificar el lugar con mayor precisión. `,
          'fr': `La photo a été prise près de: ${formattedLocation}. Utilisez ce contexte de localisation pour aider à identifier le lieu avec plus de précision. `,
          'de': `Das Foto wurde in der Nähe von aufgenommen: ${formattedLocation}. Verwenden Sie diesen Standortkontext, um den Ort genauer zu identifizieren. `,
          'it': `La foto è stata scattata vicino a: ${formattedLocation}. Usa questo contesto di posizione per aiutare a identificare il luogo con maggiore precisione. `,
          'ar': `تم التقاط الصورة بالقرب من: ${formattedLocation}. استخدم سياق الموقع هذا للمساعدة في تحديد المكان بدقة أكبر. `,
          'ru': `Фотография была сделана рядом с: ${formattedLocation}. Используйте этот контекст местоположения, чтобы помочь более точно идентифицировать место. `,
          'zh': `照片拍摄地点附近：${formattedLocation}。使用此位置背景来帮助更准确地识别地点。`,
          'ja': `写真は次の場所の近くで撮影されました：${formattedLocation}。この位置情報を使用して、場所をより正确に特定してください。`
        };
        locationContext = locationTexts[languageCode] || locationTexts['en'];
      }
    }
    
    console.log('User selected language:', languageCode);
    console.log('Location context for AI:', locationContext);

    // Get language-specific prompt
    const promptText = getLanguagePrompt(languageCode, locationContext);

    // Convert image to base64
    const imageData = await fetch(imageUri);
    const imageBlob = await imageData.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        console.log('Sending request to Gemini API in', languageCode);
        
        const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error:', response.status, errorText);
          // Fallback to demo data in user's language
          console.log('Falling back to demo data');
          const demoResult = await getDemoData(locationData);
          resolve(demoResult);
          return;
        }

        const result = await response.json();
        console.log('Gemini API response received in', languageCode);
        
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
          console.error('Invalid Gemini response structure:', result);
          const demoResult = await getDemoData(locationData);
          resolve(demoResult);
          return;
        }
        
        const content = result.candidates[0].content.parts[0].text;
        console.log('Content from Gemini:', content.substring(0, 200) + '...');
        
        // Try to parse JSON from the response
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Successfully parsed JSON from Gemini in', languageCode);
            resolve(parsed);
            return;
          }
          throw new Error('No JSON found in response');
        } catch (parseError) {
          console.log('Could not parse JSON, creating structured response in', languageCode);
          
          // Create structured response in user's language
          const fallbackTitles = {
            'tr': 'Gemini\'den Tarihi Analiz',
            'en': 'Historical Analysis from Gemini',
            'es': 'Análisis Histórico de Gemini',
            'fr': 'Analyse Historique de Gemini',
            'de': 'Historische Analyse von Gemini',
            'it': 'Analisi Storica da Gemini',
            'ar': 'التحليل التاريخي من جيميني',
            'ru': 'Исторический анализ от Gemini',
            'zh': '来自Gemini的历史分析',
            'ja': 'Geminiからの歴史分析'
          };
          
          const fallbackFactTexts = {
            'tr': 'AI tarafından detaylı analiz sağlandı',
            'en': 'Detailed analysis provided by AI',
            'es': 'Análisis detallado proporcionado por IA',
            'fr': 'Analyse détaillée fournie par l\'IA',
            'de': 'Detaillierte Analyse von KI bereitgestellt',
            'it': 'Analisi dettagliata fornita dall\'IA',
            'ar': 'تحليل مفصل مقدم من الذكاء الاصطناعي',
            'ru': 'Подробный анализ предоставлен ИИ',
            'zh': 'AI提供的详细分析',
            'ja': 'AIによる詳細な分析'
          };
          
          resolve({
            name: fallbackTitles[languageCode] || fallbackTitles['en'],
            description: content,
            location: 'Analysis provided',
            yearBuilt: 'See description',
            significance: 'Historical context provided in description',
            architecture: 'See description',
            funFacts: [fallbackFactTexts[languageCode] || fallbackFactTexts['en']]
          });
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading image file');
        // Fallback to demo data
        getDemoData(locationData).then(resolve).catch(reject);
      };
      
      reader.readAsDataURL(imageBlob);
    });
    
  } catch (error) {
    console.error('Error in analyzeWithGemini:', error);
    // Fallback to demo data in user's language
    return getDemoData(locationData);
  }
};