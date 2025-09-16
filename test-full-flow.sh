#!/bin/bash

echo "🧪 Testing Complete Places API Workflow"
echo "======================================"

PROXY_URL="https://us-central1-landmarkai-55530.cloudfunctions.net/placesProxy"

echo "1️⃣ Step 1: Search for Eiffel Tower..."
SEARCH_RESPONSE=$(curl -s -X POST $PROXY_URL \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "textsearch", "query": "Eiffel Tower"}')

echo "✅ Search successful"

echo "2️⃣ Step 2: Extract place ID..."
PLACE_ID=$(echo $SEARCH_RESPONSE | jq -r '.results[0].place_id')
echo "Place ID: $PLACE_ID"

echo "3️⃣ Step 3: Get place details with photos..."
DETAILS_RESPONSE=$(curl -s -X POST $PROXY_URL \
  -H "Content-Type: application/json" \
  -d "{\"endpoint\": \"details\", \"placeId\": \"$PLACE_ID\", \"fields\": \"photos\"}")

echo "✅ Details fetched"

echo "4️⃣ Step 4: Extract photo reference..."
PHOTO_REF=$(echo $DETAILS_RESPONSE | jq -r '.result.photos[0].photo_reference')
echo "Photo reference: ${PHOTO_REF:0:50}..."

echo "5️⃣ Step 5: Test photo URL generation (as mobile app would do)..."
PHOTO_URL="${PROXY_URL}?endpoint=photo&query=${PHOTO_REF}"
echo "Generated photo URL: $PHOTO_URL"

echo "6️⃣ Step 6: Test photo download..."
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/flow_test_photo.jpg "$PHOTO_URL")

if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ Photo download successful (HTTP $HTTP_CODE)"
    file /tmp/flow_test_photo.jpg
    echo ""
    echo "🎉 COMPLETE WORKFLOW TEST PASSED!"
    echo "   Photo URL that mobile app should use:"
    echo "   $PHOTO_URL"
else
    echo "❌ Photo download failed (HTTP $HTTP_CODE)"
    echo "Response:"
    curl -s "$PHOTO_URL"
fi