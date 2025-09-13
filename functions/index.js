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