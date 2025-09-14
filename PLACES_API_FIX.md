# Fix Google Places API REQUEST_DENIED

## Problem
You're getting `REQUEST_DENIED` errors from Google Places API because the API is not enabled for your project.

## Solution

### 1. Enable Places API in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select Your Project**
   - Make sure you're in the correct project where your API key was created

3. **Navigate to APIs & Services**
   - Go to "APIs & Services" > "Library"
   - Or use direct link: https://console.cloud.google.com/apis/library

4. **Search and Enable Places API**
   - Search for "Places API"
   - Click on "Places API" (the main one)
   - Click "Enable"
   - Also enable "Places API (New)" if available

5. **Wait for Propagation**
   - Wait 2-3 minutes for the changes to take effect

### 2. Verify Your API Key

Your current API key: `AIzaSyANRujmpBe6CYWu4r8Ebz3a5OM7sG2SkTs`

Make sure this key has the following APIs enabled:
- ✅ Places API
- ✅ Places API (New) - if available
- ✅ Geocoding API (recommended for location services)

### 3. Test the Fix

After enabling the API:
1. Run your app
2. Take a photo with landmark analysis
3. Check the console logs for successful Places API calls

### Troubleshooting

If you still get errors:

1. **Check API Key Restrictions**
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Click on your API key
   - Check if there are any restrictions that might block your requests

2. **Verify Billing**
   - Make sure billing is enabled for your Google Cloud project
   - Places API requires billing to be enabled

3. **Check Quotas**
   - Go to APIs & Services > Quotas
   - Make sure you haven't exceeded any quotas

## Current Implementation

The app will gracefully fallback to coordinate-based map links if Places API fails, so the basic functionality will still work while you fix the API setup.