# Places API Proxy Setup Guide

## 🎯 Overview
This guide sets up a secure server-side proxy for Google Places API using Firebase Functions, removing the need to expose your API key in the mobile app.

## ✅ What's Already Done
- ✅ **Client code updated** - `placesService.js` now uses Firebase proxy
- ✅ **API key removed** - No longer in `app.json` 
- ✅ **Firebase Function created** - `placesProxy` function added to `functions/index.js`
- ✅ **Dependencies updated** - `node-fetch` added to `package.json`

## 🚀 Quick Setup (Automated)

Run the deployment script:
```bash
./deploy-places-proxy.sh
```

This will:
1. Install dependencies
2. Prompt for your Places API key
3. Configure Firebase environment
4. Deploy the proxy function

## 📋 Manual Setup Steps

### 1. Navigate to Functions Directory
```bash
cd functions
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Your Project
```bash
firebase use landmarkai-55530
```

### 4. Configure Places API Key
```bash
firebase functions:config:set places.api_key="YOUR_PLACES_API_KEY"
```
Replace `YOUR_PLACES_API_KEY` with your actual Google Places API key.

### 5. Deploy the Function
```bash
firebase deploy --only functions:placesProxy
```

## 🧪 Testing

### Test the Proxy
```bash
./test-places-proxy.sh
```

### Manual Test
```bash
curl -X POST https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "textsearch", "query": "Eiffel Tower"}'
```

## 🔧 Supported Endpoints

The proxy supports these Google Places API endpoints:

### 1. Text Search
```json
{
  "endpoint": "textsearch",
  "query": "Eiffel Tower",
  "locationBias": {
    "lat": 48.8566,
    "lng": 2.3522,
    "radius": 5000
  }
}
```

### 2. Find Place from Text
```json
{
  "endpoint": "findplacefromtext",
  "query": "Colosseum, Rome",
  "fields": "place_id,name,geometry,formatted_address"
}
```

### 3. Place Details
```json
{
  "endpoint": "details", 
  "placeId": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
  "fields": "photos,rating,reviews"
}
```

### 4. Place Photos
```json
{
  "endpoint": "photo",
  "query": "PHOTO_REFERENCE_ID"
}
```

## 🔒 Security Benefits

- **🔐 API Key Protection**: Key stays server-side only
- **📊 Usage Control**: Monitor and limit API calls server-side  
- **🚫 No Client Exposure**: Zero API credentials in mobile app
- **📈 Better Monitoring**: Firebase Functions logging and metrics

## 🔍 Monitoring & Debugging

### View Logs
```bash
firebase functions:log --only placesProxy
```

### Check Configuration
```bash
firebase functions:config:get places
```

### Monitor in Console
- Firebase Console: https://console.firebase.google.com/project/landmarkai-55530
- Functions section shows usage metrics and logs

## ⚡ Performance Features

- **📸 Photo Caching**: Reduces redundant photo URL requests
- **🚀 Parallel Processing**: Non-blocking enrichment of nearby places
- **⏱️ Rate Limiting**: Built-in 200-300ms delays between requests
- **🛡️ Error Handling**: Graceful fallbacks and detailed error messages

## 🔧 Environment Variables

The proxy uses these environment variables on Firebase:

- `PLACES_API_KEY`: Your Google Places API key
- `GEMINI_API_KEY`: Your existing Gemini API key (already set)

## 📱 Mobile App Integration

Your mobile app (`placesService.js`) automatically:
- Routes all Places API calls through the Firebase proxy
- Handles photo URL caching for performance  
- Provides fallback coordinate-based maps links
- Maintains the same user experience with enhanced security

## 🎉 Success!

Once deployed, your Places API integration will be:
- ✅ **Secure** - No exposed API keys
- ✅ **Fast** - Optimized caching and processing
- ✅ **Reliable** - Better error handling
- ✅ **Monitorable** - Full Firebase Functions logging
- ✅ **Consistent** - Same pattern as your Gemini proxy