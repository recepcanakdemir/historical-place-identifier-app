// services/chatService.js - Landmark Chat Service
import { getCurrentLanguage } from './languageService';

// Configuration
const CHAT_CONFIG = {
  FUNCTIONS_URL: 'https://us-central1-landmarkai-55530.cloudfunctions.net/chatWithLandmark',
  TIMEOUT: 30000, // 30 seconds for chat responses
  MAX_HISTORY_LENGTH: 10 // Keep last 10 messages to manage token usage
};

// In-memory conversation storage (you might want to persist this later)
let conversationHistory = new Map();

// Get conversation history for a specific landmark
export const getConversationHistory = (landmarkId) => {
  const key = landmarkId || 'current';
  return conversationHistory.get(key) || [];
};

// Add message to conversation history
export const addToConversationHistory = (landmarkId, role, content) => {
  const key = landmarkId || 'current';
  const history = getConversationHistory(key);
  
  const newMessage = {
    role, // 'user' or 'assistant'
    content,
    timestamp: new Date().toISOString()
  };
  
  history.push(newMessage);
  
  // Keep only recent messages to manage token usage
  if (history.length > CHAT_CONFIG.MAX_HISTORY_LENGTH) {
    history.splice(0, history.length - CHAT_CONFIG.MAX_HISTORY_LENGTH);
  }
  
  conversationHistory.set(key, history);
  console.log(`💬 Added ${role} message to conversation history (${history.length} messages)`);
};

// Clear conversation history for a landmark
export const clearConversationHistory = (landmarkId) => {
  const key = landmarkId || 'current';
  conversationHistory.delete(key);
  console.log(`🗑️ Cleared conversation history for ${key}`);
};

// Send chat message to Firebase Functions
export const sendChatMessage = async (landmarkInfo, userMessage) => {
  try {
    console.log('💬 Sending chat message about:', landmarkInfo.name);
    console.log('📝 User message:', userMessage);

    // Get current language
    const language = await getCurrentLanguage();
    
    // Get conversation history for this landmark
    const landmarkId = landmarkInfo.id || landmarkInfo.name;
    const history = getConversationHistory(landmarkId);

    // Add user message to history
    addToConversationHistory(landmarkId, 'user', userMessage);

    const requestPayload = {
      landmarkInfo: {
        name: landmarkInfo.name,
        description: landmarkInfo.description,
        location: landmarkInfo.location,
        yearBuilt: landmarkInfo.yearBuilt,
        architecture: landmarkInfo.architecture,
        significance: landmarkInfo.significance,
        funFacts: landmarkInfo.funFacts
      },
      conversationHistory: history.slice(0, -1), // Exclude the current message we just added
      userMessage,
      language
    };

    console.log('🚀 Sending chat request to Firebase Functions');
    console.log('🌐 Chat Functions URL:', CHAT_CONFIG.FUNCTIONS_URL);

    const startTime = Date.now();

    // Add connection timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CHAT_CONFIG.TIMEOUT);

    const response = await fetch(CHAT_CONFIG.FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const endTime = Date.now();
    console.log('📨 Chat response received after', endTime - startTime, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Chat Firebase Functions error:', response.status, errorText);
      throw new Error(`Chat API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Chat response received successfully');

    // Extract AI response from Gemini format
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error('❌ Invalid chat response structure:', result);
      throw new Error('Invalid chat response format');
    }

    let aiResponse = result.candidates[0].content.parts[0].text;
    
    // Clean up any markdown formatting from the response
    aiResponse = aiResponse.replace(/\*([^*]+)\*/g, '$1'); // Remove *italic*
    aiResponse = aiResponse.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **bold**
    aiResponse = aiResponse.replace(/```[^`]*```/g, ''); // Remove code blocks
    aiResponse = aiResponse.replace(/#{1,6}\s/g, ''); // Remove markdown headers
    aiResponse = aiResponse.trim();
    
    console.log('🤖 AI Response (first 100 chars):', aiResponse.substring(0, 100) + '...');

    // Add AI response to conversation history
    addToConversationHistory(landmarkId, 'assistant', aiResponse);

    return {
      success: true,
      message: aiResponse,
      conversationId: landmarkId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendChatMessage:', error);
    
    // Return user-friendly error message
    return {
      success: false,
      error: error.message,
      message: 'I apologize, but I encountered an error while processing your question. Please try asking again.',
      timestamp: new Date().toISOString()
    };
  }
};

// Get chat summary for display (useful for chat previews)
export const getChatSummary = (landmarkId) => {
  const history = getConversationHistory(landmarkId);
  if (history.length === 0) return null;

  return {
    messageCount: history.length,
    lastMessage: history[history.length - 1],
    landmarkId
  };
};

// Start a new chat session for a landmark
export const startChatSession = (landmarkInfo) => {
  const landmarkId = landmarkInfo.id || landmarkInfo.name;
  clearConversationHistory(landmarkId);
  
  console.log(`🎯 Started new chat session for: ${landmarkInfo.name}`);
  return landmarkId;
};

// Utility function to format chat messages for display
export const formatChatMessage = (message, isUser = false) => {
  return {
    id: `${Date.now()}_${Math.random()}`,
    content: message.content || message,
    isUser,
    timestamp: message.timestamp || new Date().toISOString(),
    formattedTime: new Date(message.timestamp || Date.now()).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
};

// Check if chat service is available
export const isChatServiceAvailable = () => {
  return Boolean(CHAT_CONFIG.FUNCTIONS_URL);
};