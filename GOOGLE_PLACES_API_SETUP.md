# Google Places API Setup Guide

Bu rehber, LandmarkAI uygulamanızda güvenilir harita linklerini kullanabilmek için Google Places API'sini nasıl yapılandıracağınızı gösterir.

## Adım 1: Google Cloud Console'da Proje Oluşturma

1. **Google Cloud Console**'a gidin: https://console.cloud.google.com/
2. **Oturum açın** Google hesabınızla
3. **Yeni Proje Oluştur**:
   - Sol üst köşedeki proje seçicisine tıklayın
   - "NEW PROJECT" butonuna basın
   - Proje adı girin (örn: "LandmarkAI-Places")
   - "CREATE" butonuna basın

## Adım 2: Places API'sini Etkinleştirme

1. **API Library**'ye gidin:
   - Sol menüden "APIs & Services" > "Library"
2. **Places API**'yi bulun:
   - Arama çubuğuna "Places API" yazın
   - "Places API" sonucuna tıklayın
3. **Enable** butonuna basın

## Adım 3: API Anahtarı Oluşturma

1. **Credentials** sayfasına gidin:
   - Sol menüden "APIs & Services" > "Credentials"
2. **API Key oluştur**:
   - "CREATE CREDENTIALS" > "API key" seçin
   - API anahtarınız oluşturulacak
   - **KAYDEDIN** - Bu anahtarı güvenli bir yerde saklayın

## Adım 4: API Anahtarını Kısıtlama (Önemli!)

1. Yeni oluşturulan API key'e tıklayın
2. **Application restrictions**:
   - "Bundle IDs (iOS apps)" seçin
   - iOS Bundle ID'nizi girin (app.json'daki "ios.bundleIdentifier")
3. **API restrictions**:
   - "Restrict key" seçin
   - "Places API" seçin
   - "SAVE" butonuna basın

## Adım 5: Faturalandırmayı Etkinleştirme

⚠️ **Önemli**: Places API, ücretli bir servistir ancak aylık $200 ücretsiz kredi verir.

1. **Billing** sayfasına gidin
2. **Enable billing** yapın
3. Kredi kartı bilgilerini girin (sadece ücretsiz limiti aştığınızda ücret alınır)

### Maliyet Bilgileri:
- **Text Search**: Her arama $32/1000 istek
- **Aylık Ücretsiz Kredi**: $200
- **Yaklaşık Ücretsiz Kullanım**: ~6,000 arama/ay

## Adım 6: API Anahtarını Uygulamaya Ekleme

### app.json dosyasını güncelleyin:

```json
{
  "expo": {
    "name": "LandmarkAI",
    "extra": {
      "googlePlacesApiKey": "AIzaSyBORa4NrLwf-YOUR-API-KEY-HERE"
    }
  }
}
```

### Güvenlik için .env dosyası kullanın (Önerilen):

1. **.env** dosyası oluşturun (proje kök dizininde):
```
GOOGLE_PLACES_API_KEY=AIzaSyBORa4NrLwf-YOUR-API-KEY-HERE
```

2. **app.json**'u güncelleyin:
```json
{
  "expo": {
    "extra": {
      "googlePlacesApiKey": "${GOOGLE_PLACES_API_KEY}"
    }
  }
}
```

3. **.gitignore**'a ekleyin:
```
.env
```

## Adım 7: Test Etme

1. Uygulamanızı yeniden başlatın:
```bash
npx expo start
```

2. Bir analiz yapın ve konsol loglarını kontrol edin:
   - "🔍 Searching for place:" mesajları görmelisiniz
   - "✅ Found place:" başarılı aramalar için görünecek

## Sorun Giderme

### "API key not configured" hatası:
- `app.json` dosyasındaki API key'i kontrol edin
- `npx expo start --clear` ile cache'i temizleyin

### "OVER_QUERY_LIMIT" hatası:
- Günlük/aylık limitinizi aştınız
- Google Cloud Console'dan quota limitlerini kontrol edin

### "REQUEST_DENIED" hatası:
- API key kısıtlamalarını kontrol edin
- iOS Bundle ID doğru mu?
- Places API etkin mi?

### Koordinatlar yanlış:
- Bu sistem artık Google Places'den gerçek koordinatları alır
- AI'dan gelen koordinatlar sadece fallback olarak kullanılır

## Kullanım İpuçları

1. **Rate Limiting**: Servis otomatik olarak istekler arasında 200ms bekler
2. **Fallback**: API çalışmazsa eski koordinat sistemine geri döner  
3. **Monitoring**: Google Cloud Console'dan kullanımı izleyebilirsiniz
4. **Cost Control**: API kullanımını sınırlamak için quotalar belirleyebilirsiniz

## Destek

API ile ilgili sorunlar için:
- Google Cloud Support
- Places API Documentation: https://developers.google.com/maps/documentation/places/web-service