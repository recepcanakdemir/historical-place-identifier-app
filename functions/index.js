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

// Places API proxy function - Secure server-side implementation
exports.placesProxy = onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Handle GET requests for photo endpoints
  if (req.method === 'GET') {
    const { endpoint, query } = req.query;
    
    if (endpoint === 'photo' && query) {
      const PLACES_API_KEY = process.env.PLACES_API_KEY;
      
      if (!PLACES_API_KEY) {
        res.status(500).json({ error: 'Places API key not configured on server' });
        return;
      }
      
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${query}&key=${PLACES_API_KEY}`;
      
      try {
        const photoResponse = await fetch(photoUrl);
        
        if (!photoResponse.ok) {
          logger.error("Photo fetch failed:", photoResponse.status);
          res.status(photoResponse.status).send('Photo not found');
          return;
        }
        
        const photoBuffer = await photoResponse.buffer();
        const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
        
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(photoBuffer);
        
        logger.info("Photo successfully proxied via GET");
        return;
        
      } catch (error) {
        logger.error("Photo GET proxy error:", error);
        res.status(500).send('Photo proxy error');
        return;
      }
    }
    
    res.status(400).json({ error: 'Invalid GET request' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get Places API key from environment variable (secure)
    const PLACES_API_KEY = process.env.PLACES_API_KEY;
    
    if (!PLACES_API_KEY) {
      logger.error("PLACES_API_KEY environment variable not set");
      res.status(500).json({ error: 'Places API key not configured on server' });
      return;
    }

    const { endpoint, query, locationBias, placeId, fields } = req.body;
    
    if (!endpoint) {
      res.status(400).json({ error: 'Missing required parameter: endpoint' });
      return;
    }
    
    // Validate required parameters based on endpoint
    if ((endpoint === 'textsearch' || endpoint === 'findplacefromtext' || endpoint === 'photo') && !query) {
      res.status(400).json({ error: 'Missing required parameter: query' });
      return;
    }
    
    if (endpoint === 'details' && !placeId) {
      res.status(400).json({ error: 'Missing required parameter: placeId for details endpoint' });
      return;
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place';
    let url = '';
    
    logger.info(`Places API ${endpoint} request for:`, query);
    
    // Route different Places API endpoints
    switch (endpoint) {
      case 'textsearch':
        url = `${baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${PLACES_API_KEY}`;
        if (locationBias) {
          url += `&location=${locationBias.lat},${locationBias.lng}&radius=${locationBias.radius || 5000}`;
          logger.info("Added location bias:", locationBias);
        }
        break;
        
      case 'findplacefromtext':
        url = `${baseUrl}/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=${fields || 'place_id,name,geometry,formatted_address'}&key=${PLACES_API_KEY}`;
        break;
        
      case 'details':
        url = `${baseUrl}/details/json?place_id=${placeId}&fields=${fields || 'photos'}&key=${PLACES_API_KEY}`;
        break;
        
      case 'photo':
        // Proxy the photo data directly to avoid CORS issues
        const photoUrl = `${baseUrl}/photo?maxwidth=400&photoreference=${query}&key=${PLACES_API_KEY}`;
        logger.info("Fetching photo for reference:", query.substring(0, 20) + '...');
        
        try {
          const photoResponse = await fetch(photoUrl);
          
          if (!photoResponse.ok) {
            logger.error("Photo fetch failed:", photoResponse.status);
            res.status(photoResponse.status).json({ 
              error: 'Photo fetch failed', 
              status: photoResponse.status 
            });
            return;
          }
          
          // Get the image data and content type
          const photoBuffer = await photoResponse.buffer();
          const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
          
          // Set appropriate headers and return the image data
          res.set('Content-Type', contentType);
          res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
          res.send(photoBuffer);
          
          logger.info("Photo successfully proxied");
          return;
          
        } catch (photoError) {
          logger.error("Photo proxy error:", photoError);
          res.status(500).json({ 
            error: 'Photo proxy failed', 
            message: photoError.message 
          });
          return;
        }
        
      default:
        res.status(400).json({ error: `Unsupported endpoint: ${endpoint}` });
        return;
    }

    // Make request to Google Places API
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      logger.error("Places API error:", { 
        status: response.status, 
        error: data.error_message || data 
      });
      res.status(response.status).json({ 
        error: 'Places API request failed', 
        message: data.error_message || 'Unknown error',
        status: data.status 
      });
      return;
    }

    // Check for Places API specific errors
    if (data.status && data.status !== 'OK') {
      logger.warn("Places API returned non-OK status:", data.status);
      if (data.status === 'REQUEST_DENIED') {
        res.status(403).json({ 
          error: 'Places API access denied', 
          message: 'Please check API key and enable Places API in Google Cloud Console',
          status: data.status 
        });
        return;
      }
    }
    
    logger.info(`Places API ${endpoint} request successful, status:`, data.status || 'OK');
    
    // Success - return data
    res.status(200).json(data);
    
  } catch (error) {
    logger.error("Places proxy error:", error);
    res.status(500).json({ 
      error: 'Places API proxy error', 
      message: error.message 
    });
  }
});