/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
/**
 * Firebase Functions - Updated for Environment Variables
 */
const fetch = require("node-fetch");

// Global options for cost control

// Gemini API endpoint
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Firebase proxy function - Updated to use environment variables
exports.geminiProxy = onRequest(async (req, res) => {
  try {
    // API key environment variable'dan alınıyor (yeni yöntem)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY environment variable not set");
      res.status(500).json({ error: "API key not configured" });
      return;
    }

    // İstek payload'u frontend'den geliyor
    const requestPayload = req.body;
    
    if (!requestPayload) {
      res.status(400).json({ error: "No request body provided" });
      return;
    }

    logger.info("Making request to Gemini API", { 
      hasPayload: !!requestPayload,
      apiKeyConfigured: !!apiKey
    });

    // Gemini API çağrısı
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Firebase-Functions-Proxy/1.0"
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Gemini API error", { 
        status: response.status, 
        error: data 
      });
      res.status(response.status).json(data);
      return;
    }

    logger.info("Gemini API request successful");
    
    // CORS headers ekle
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Sonucu geri gönder
    res.status(200).json(data);
    
  } catch (error) {
    logger.error("Proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// OPTIONS request için CORS preflight support
exports.geminiProxy = onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // API key environment variable'dan alınıyor
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY environment variable not set");
      res.status(500).json({ error: "API key not configured" });
      return;
    }

    const requestPayload = req.body;
    
    if (!requestPayload) {
      res.status(400).json({ error: "No request body provided" });
      return;
    }

    logger.info("Making request to Gemini API");

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Firebase-Functions-Proxy/1.0"
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Gemini API error", { 
        status: response.status, 
        error: data 
      });
      res.status(response.status).json(data);
      return;
    }

    logger.info("Gemini API request successful");
    res.status(200).json(data);
    
  } catch (error) {
    logger.error("Proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Landmark Chat Function - Specialized conversations about analyzed landmarks
exports.chatWithLandmark = onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY environment variable not set for chat");
      res.status(500).json({ error: "API key not configured" });
      return;
    }

    const { landmarkInfo, conversationHistory, userMessage, language = 'en' } = req.body;
    
    if (!landmarkInfo || !userMessage) {
      res.status(400).json({ error: "Missing landmarkInfo or userMessage" });
      return;
    }

    logger.info("Chat request for landmark:", landmarkInfo.name);

    // Create specialized system prompt for the landmark
    const systemPrompts = {
      'en': `You are a knowledgeable tour guide specializing in ${landmarkInfo.name}. Provide clear, factual information without theatrical expressions or dramatic language.

LANDMARK CONTEXT:
- Name: ${landmarkInfo.name}
- Description: ${landmarkInfo.description}
- Location: ${landmarkInfo.location}
- Year Built: ${landmarkInfo.yearBuilt || 'Historical period'}
- Architecture: ${landmarkInfo.architecture || 'Various styles'}
- Significance: ${landmarkInfo.significance || 'Culturally significant'}

INSTRUCTIONS:
- Answer questions specifically about ${landmarkInfo.name} with factual, direct responses
- Provide detailed information about history, architecture, and cultural significance
- If asked about other places, politely redirect back to ${landmarkInfo.name}
- Be conversational but professional, like a knowledgeable museum guide
- Keep responses concise and informative (2-4 sentences typically)
- Avoid dramatic expressions like "Ah!" or "*comment*" - speak naturally
- Use relevant facts: ${landmarkInfo.funFacts?.join(', ') || 'None provided'}`,

      'tr': `Sen ${landmarkInfo.name} konusunda uzman, bilgili bir rehbersin. Net, gerçekçi bilgiler ver, dramatik ifadeler kullanma.

MEKAN BİLGİLERİ:
- İsim: ${landmarkInfo.name}
- Açıklama: ${landmarkInfo.description}
- Konum: ${landmarkInfo.location}
- Yapılış Yılı: ${landmarkInfo.yearBuilt || 'Tarihi dönem'}
- Mimari: ${landmarkInfo.architecture || 'Çeşitli stiller'}
- Önemi: ${landmarkInfo.significance || 'Kültürel öneme sahip'}

TALİMATLAR:
- Soruları özellikle ${landmarkInfo.name} hakkında gerçekçi, doğrudan yanıtlarla cevapla
- Tarihi, mimarisi ve kültürel önemi hakkında detaylı bilgiler ver
- Başka yerler sorulursa, nazikçe ${landmarkInfo.name}'e geri yönlendir
- Samimi ama profesyonel ol, müze rehberi gibi
- Yanıtları kısa ama bilgilendirici tut (genellikle 2-4 cümle)
- Dramatik ifadeler kullanma - doğal konuş
- İlgili gerçekleri kullan: ${landmarkInfo.funFacts?.join(', ') || 'Bilgi yok'}`
    };

    const systemPrompt = systemPrompts[language] || systemPrompts['en'];

    // Build conversation context with system prompt
    const messages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model', 
        parts: [{ text: 'I understand. I am your knowledgeable tour guide for this landmark. What would you like to know?' }]
      }
    ];

    // Add conversation history if exists
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    logger.info("Sending chat request to Gemini API");

    // Send request to Gemini API
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "LandmarkAI-Chat/1.0"
      },
      body: JSON.stringify({
        contents: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Gemini API error for chat:", { 
        status: response.status, 
        error: data 
      });
      res.status(response.status).json(data);
      return;
    }

    logger.info("Chat response received successfully");
    res.status(200).json(data);
    
  } catch (error) {
    logger.error("Chat proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});