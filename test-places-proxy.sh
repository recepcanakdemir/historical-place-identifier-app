#!/bin/bash

# Test Places API Proxy
echo "🧪 Testing Places API Proxy"
echo "=========================="

PROXY_URL="https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy"

echo "Testing text search for 'Eiffel Tower'..."
curl -X POST $PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "textsearch",
    "query": "Eiffel Tower"
  }' | jq '.' || echo "Response received (install jq for pretty formatting)"

echo ""
echo "Testing findplacefromtext for 'Colosseum'..."
curl -X POST $PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "findplacefromtext", 
    "query": "Colosseum, Rome"
  }' | jq '.' || echo "Response received (install jq for pretty formatting)"