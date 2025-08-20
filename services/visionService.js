/*// services/visionService.js

// Configuration - Replace with your preferred LLM service
const LLM_CONFIG = {
  // Option 1: OpenAI GPT-4 Vision (Recommended)
  OPENAI: {
    apiKey: 'YOUR_OPENAI_API_KEY_HERE', // Replace with your actual API key
    model: 'gpt-4o', // Latest model with vision
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  
  // Option 2: Anthropic Claude 3
  ANTHROPIC: {
    apiKey: 'YOUR_ANTHROPIC_API_KEY_HERE',
    model: 'claude-3-sonnet-20240229',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  
  // Option 3: Google Gemini Pro Vision
  GOOGLE: {
    apiKey: 'AIzaSyBu1x67Ppr1WeT4rtOe5-eafa6E5Rhuuxc', // Your working API key
    model: 'gemini-2.0-flash', // Updated to working model
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  }
};

// Set your preferred LLM service here
const CURRENT_LLM = 'GOOGLE'; // Now using Google Gemini with your working API key

export const analyzeHistoricalPlace = async (imageUri) => {
  try {
    // For demo mode, just return demo data
    if (CURRENT_LLM === 'DEMO') {
      console.log('Using demo mode - no API calls');
      return getDemoData();
    }

    // Convert image to base64
    const imageData = await fetch(imageUri);
    const imageBlob = await imageData.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          let result;
          
          switch (CURRENT_LLM) {
            case 'OPENAI':
              result = await analyzeWithOpenAI(base64Data);
              break;
            case 'ANTHROPIC':
              result = await analyzeWithClaude(base64Data);
              break;
            case 'GOOGLE':
              result = await analyzeWithGemini(base64Data);
              break;
            default:
              console.log('Falling back to demo data');
              result = await getDemoData();
          }
          
          resolve(result);
        } catch (apiError) {
          console.error('LLM API Error:', apiError);
          // Return demo data if API fails
          resolve(getDemoData());
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(imageBlob);
    });
  } catch (error) {
    console.error('Image processing error:', error);
    // Return demo data for development/testing
    return getDemoData();
  }
};

// Demo data function
const getDemoData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'Demo Historical Monument',
        description: 'This appears to be a historical building or monument. To get real analysis, please configure your LLM API key in the visionService.js file. This demo shows how the app will work once you add your OpenAI, Claude, or Gemini API key.',
        location: 'Demo Location',
        yearBuilt: 'Unknown Period',
        significance: 'This is demo data. Once you configure your LLM API, you\'ll get detailed historical analysis of real places and monuments.',
        architecture: 'Various Architectural Styles',
        funFacts: [
          'This is demonstration data to show app functionality',
          'Replace with real LLM integration for actual historical insights',
          'The app supports OpenAI, Claude, and Gemini vision models'
        ]
      });
    }, 2000);
  });
};

// OpenAI GPT-4 Vision Implementation
const analyzeWithOpenAI = async (base64Image) => {
  const config = LLM_CONFIG.OPENAI;
  
  if (config.apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
  const prompt = `You are an expert historian and travel guide. Analyze this image and identify any historical places, monuments, landmarks, statues, or architecturally significant buildings.

If you can identify the place, provide:
1. The exact name of the place/monument
2. Detailed historical background and significance
3. Location (city, country)
4. Year built or historical period
5. Architectural style
6. 2-3 interesting facts most people don't know
7. Why it's historically important

If you cannot identify the specific place, describe what you can see and provide general historical context about the architectural style, type of monument, or historical period it might belong to.

Please format your response as a JSON object with these fields:
- name: string
- description: string (detailed historical context)
- location: string
- yearBuilt: string
- significance: string
- architecture: string
- funFacts: array of strings

Be informative and engaging, as if you're a knowledgeable tour guide.`;

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // If response isn't JSON, structure it manually
    return {
      name: 'Historical Place Identified',
      description: content,
      location: 'See description',
      yearBuilt: 'Unknown',
      significance: 'See description above',
      architecture: 'Various',
      funFacts: ['Check the description for interesting details']
    };
  }
};

// Anthropic Claude Implementation
const analyzeWithClaude = async (base64Image) => {
  const config = LLM_CONFIG.ANTHROPIC;
  
  if (config.apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: 'Analyze this image as an expert historian. Identify any historical places, monuments, or significant architecture. Provide detailed information in JSON format with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array).'
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.content[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      name: 'Historical Analysis',
      description: content,
      location: 'See description',
      yearBuilt: 'Unknown',
      significance: 'See description',
      architecture: 'Various',
      funFacts: ['Analysis provided above']
    };
  }
};

// Google Gemini Implementation
const analyzeWithGemini = async (base64Image) => {
  const config = LLM_CONFIG.GOOGLE;
  
  if (config.apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
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
              text: 'You are an expert historian and travel guide. Analyze this image and identify any historical places, monuments, landmarks, statues, or architecturally significant buildings. If you can identify the place, provide the exact name, detailed historical background, location, year built, architectural style, and interesting facts. If you cannot identify the specific place, describe what you can see and provide general historical context. Please format your response as a JSON object with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array of strings). Be informative and engaging.'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API response:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini API response:', result);
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }
  
  const content = result.candidates[0].content.parts[0].text;
  
  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    // If response isn't JSON, structure it manually
    return {
      name: 'Historical Analysis from Gemini',
      description: content,
      location: 'Analysis provided',
      yearBuilt: 'See description',
      significance: 'Historical context provided in description',
      architecture: 'See description',
      funFacts: ['Detailed analysis provided by AI', 'Check description for more information']
    };
  }
};*/

// services/visionService.js

// Configuration - Replace with your preferred LLM service
const LLM_CONFIG = {
  // Option 1: OpenAI GPT-4 Vision (Recommended)
  OPENAI: {
    apiKey: 'YOUR_OPENAI_API_KEY_HERE', // Replace with your actual API key
    model: 'gpt-4o', // Latest model with vision
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  
  // Option 2: Anthropic Claude 3
  ANTHROPIC: {
    apiKey: 'YOUR_ANTHROPIC_API_KEY_HERE',
    model: 'claude-3-sonnet-20240229',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  
  // Option 3: Google Gemini Pro Vision
  GOOGLE: {
    apiKey: 'AIzaSyBu1x67Ppr1WeT4rtOe5-eafa6E5Rhuuxc', // Your working API key
    model: 'gemini-2.0-flash', // Updated to working model
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  }
};

// Set your preferred LLM service here
const CURRENT_LLM = 'GOOGLE'; // Now using Google Gemini with your working API key

export const analyzeHistoricalPlace = async (imageUri) => {
  try {
    // For demo mode, just return demo data
    if (CURRENT_LLM === 'DEMO') {
      console.log('Using demo mode - no API calls');
      return getDemoData();
    }

    // Convert image to base64
    const imageData = await fetch(imageUri);
    const imageBlob = await imageData.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          let result;
          
          switch (CURRENT_LLM) {
            case 'OPENAI':
              result = await analyzeWithOpenAI(base64Data);
              break;
            case 'ANTHROPIC':
              result = await analyzeWithClaude(base64Data);
              break;
            case 'GOOGLE':
              result = await analyzeWithGemini(base64Data);
              break;
            default:
              console.log('Falling back to demo data');
              result = await getDemoData();
          }
          
          resolve(result);
        } catch (apiError) {
          console.error('LLM API Error:', apiError);
          // Return demo data if API fails
          resolve(getDemoData());
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(imageBlob);
    });
  } catch (error) {
    console.error('Image processing error:', error);
    // Return demo data for development/testing
    return getDemoData();
  }
};

// Demo data function
const getDemoData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'Demo Historical Monument',
        description: 'This appears to be a historical building or monument. To get real analysis, please configure your LLM API key in the visionService.js file. This demo shows how the app will work once you add your OpenAI, Claude, or Gemini API key.',
        location: 'Demo Location',
        yearBuilt: 'Unknown Period',
        significance: 'This is demo data. Once you configure your LLM API, you\'ll get detailed historical analysis of real places and monuments.',
        architecture: 'Various Architectural Styles',
        funFacts: [
          'This is demonstration data to show app functionality',
          'Replace with real LLM integration for actual historical insights',
          'The app supports OpenAI, Claude, and Gemini vision models'
        ]
      });
    }, 2000);
  });
};

// OpenAI GPT-4 Vision Implementation
const analyzeWithOpenAI = async (base64Image) => {
  const config = LLM_CONFIG.OPENAI;
  
  if (config.apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
  const prompt = `You are an expert historian and travel guide. Analyze this image carefully.

PRIMARY GOAL: Look for historical places, monuments, landmarks, statues, or architecturally significant buildings.

IF HISTORICAL CONTENT FOUND:
- Provide exact name, detailed historical background, location, year built, architectural style, and interesting facts

IF NO HISTORICAL CONTENT (people, modern scenes, nature, etc.):
- Politely acknowledge what you see
- Provide any relevant historical or cultural context when possible
- Examples: Traditional clothing → cultural history, Modern building → architectural style origins, Nature scene → historical significance of location if recognizable, Food → culinary history, etc.
- Be educational and engaging even for non-historical subjects

ALWAYS format as JSON with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array).
For non-historical content, adapt field names creatively (e.g., name: "Cultural Analysis", yearBuilt: "Modern Era").

Be helpful, educational, and never refuse to analyze an image.`;

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // If response isn't JSON, structure it manually
    return {
      name: 'Historical Place Identified',
      description: content,
      location: 'See description',
      yearBuilt: 'Unknown',
      significance: 'See description above',
      architecture: 'Various',
      funFacts: ['Check the description for interesting details']
    };
  }
};

// Anthropic Claude Implementation
const analyzeWithClaude = async (base64Image) => {
  const config = LLM_CONFIG.ANTHROPIC;
  
  if (config.apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: 'Analyze this image as an expert historian. Identify any historical places, monuments, or significant architecture. Provide detailed information in JSON format with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array).'
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.content[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      name: 'Historical Analysis',
      description: content,
      location: 'See description',
      yearBuilt: 'Unknown',
      significance: 'See description',
      architecture: 'Various',
      funFacts: ['Analysis provided above']
    };
  }
};

// Google Gemini Implementation
const analyzeWithGemini = async (base64Image) => {
  const config = LLM_CONFIG.GOOGLE;
  
  if (config.apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    throw new Error('API key not configured');
  }
  
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
              text: 'You are an expert historian and travel guide. Analyze this image carefully. If the image contains historical places, monuments, landmarks, statues, or architecturally significant buildings, provide detailed historical information. If the image shows people, modern buildings, nature, or other non-historical subjects, politely explain what you see and try to provide any relevant historical or cultural context if possible. For example, if it\'s a person in traditional clothing, discuss the cultural history; if it\'s a modern building, mention the architectural style and its historical roots; if it\'s nature, discuss any historical significance of the location if recognizable. Always be helpful and educational. Format your response as JSON with fields: name, description, location, yearBuilt, significance, architecture, funFacts (array). If it\'s not a historical place, use creative but accurate field names like name: "Cultural Analysis" or "Architectural Context".'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API response:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini API response:', result);
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }
  
  const content = result.candidates[0].content.parts[0].text;
  
  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    // If response isn't JSON, structure it manually
    return {
      name: 'Historical Analysis from Gemini',
      description: content,
      location: 'Analysis provided',
      yearBuilt: 'See description',
      significance: 'Historical context provided in description',
      architecture: 'See description',
      funFacts: ['Detailed analysis provided by AI', 'Check description for more information']
    };
  }
};