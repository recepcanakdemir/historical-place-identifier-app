#!/bin/bash

# Deploy Places API Proxy to Firebase Functions
# This script sets up the secure server-side Places API proxy

echo "🚀 Setting up Places API Proxy for Firebase Functions"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Logging in..."
    firebase login
fi

echo -e "${BLUE}📍 Current directory: $(pwd)${NC}"

# Navigate to functions directory
if [ ! -d "functions" ]; then
    echo -e "${RED}❌ Functions directory not found${NC}"
    echo "Please run this script from your project root directory"
    exit 1
fi

cd functions

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔧 Setting Firebase project...${NC}"
firebase use landmarkai-55530

echo -e "${YELLOW}🔑 Setting up Places API key...${NC}"
echo "Please enter your Google Places API key:"
read -s PLACES_API_KEY

if [ -z "$PLACES_API_KEY" ]; then
    echo -e "${RED}❌ No API key provided${NC}"
    exit 1
fi

# Set environment variable for Places API
echo -e "${BLUE}🔐 Configuring Places API key on Firebase...${NC}"
firebase functions:config:set places.api_key="$PLACES_API_KEY"

echo -e "${BLUE}🚀 Deploying Places proxy function...${NC}"
firebase deploy --only functions:placesProxy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Places API proxy deployed successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Function URL:${NC} https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy"
    echo -e "${BLUE}Status:${NC} Your Places API is now secure server-side!"
    echo -e "${BLUE}Mobile App:${NC} Already configured to use the proxy"
    echo ""
    echo -e "${YELLOW}🔍 To test the function:${NC}"
    echo 'curl -X POST https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"endpoint": "textsearch", "query": "Eiffel Tower"}'"'"''
    echo ""
    echo -e "${GREEN}🔒 Security Benefits:${NC}"
    echo "  • API key is now server-side only"
    echo "  • No more client-side API exposure"
    echo "  • Better rate limiting and monitoring"
    echo "  • Same security pattern as your Gemini proxy"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above and try again"
    exit 1
fi

# Go back to project root
cd ..

echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "  1. Test your mobile app - Places API now uses secure proxy"
echo "  2. Monitor usage in Firebase Console"
echo "  3. Check logs with: firebase functions:log --only placesProxy"