// background.js

// Uzantı yüklendiğinde veya güncellendiğinde çalışır.
chrome.runtime.onInstalled.addListener(() => {
    console.log("Uzantı yüklendi veya güncellendi.");
    // Varsayılan ayarları yüklemeye çalışın. Eğer yoksa, content.js varsayılanları kullanacaktır.
    // Bu kısım, uzantı ilk yüklendiğinde veya güncellendiğinde depolamanın hazır olduğundan emin olmak içindir.
    chrome.storage.local.get(['percentageConfigs', 'topluSecimEsikleri', 'genelAyarlar'], (result) => {
        if (!result.percentageConfigs) {
            // Varsayılan percentageConfigs'i kaydet (eğer daha önce kaydedilmemişse)
            chrome.storage.local.set({
                percentageConfigs: [
                    { label: "%10", description: "Diğerleri", multiplier: 0.10, maxAmount: null, color: "#e0f2f7" },
                    { label: "%15", description: "ANINDATRANSFER_BANK_TRANSFER", multiplier: 0.15, maxAmount: 500, color: "#e0f7de" },
                    { label: "%20", description: "Payco/ Minipay Havale", multiplier: 0.20, maxAmount: 500, color: "#ffe0b2" }
                ]
            });
        }
        if (!result.topluSecimEsikleri) {
            // Varsayılan topluSecimEsikleri'ni kaydet (eğer daha önce kaydedilmemişse)
            chrome.storage.local.set({
                topluSecimEsikleri: [
                    { start: 10000, end: 49999, percentage: 0.20 },
                    { start: 50000, end: null, percentage: 0.25 }
                ]
            });
        }
        if (!result.genelAyarlar) {
            // Varsayılan genelAyarlar'ı kaydet (eğer daha önce kaydedilmemişse)
            chrome.storage.local.set({
                genelAyarlar: {
                    backgroundTransparency: 50,
                    tema: "Nordic Breeze",
                    bildirimSesiAktif: false,
                    bildirimSesiTuru: "ding",
                    otomatikKapanmaSuresi: 4
                }
            });
        }
    });
});

// Content script'ten gelen mesajları dinler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveSettings") {
        // Gelen ayarları chrome.storage.local'e kaydet
        chrome.storage.local.set({
            percentageConfigs: request.percentageConfigs,
            topluSecimEsikleri: request.topluSecimEsikleri,
            genelAyarlar: request.genelAyarlar
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Ayarlar kaydedilirken hata:", chrome.runtime.lastError);
                sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
                console.log("Ayarlar chrome.storage.local'e kaydedildi.");
                sendResponse({ status: "success" });
            }
        });
        return true; // Asenkron yanıt için true döndür
    } else if (request.action === "loadSettings") {
        // Ayarları chrome.storage.local'den yükle
        chrome.storage.local.get(['percentageConfigs', 'topluSecimEsikleri', 'genelAyarlar'], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Ayarlar yüklenirken hata:", chrome.runtime.lastError);
                sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
                console.log("Ayarlar chrome.storage.local'den yüklendi:", result);
                sendResponse({ status: "success", data: result });
            }
        });
        return true; // Asenkron yanıt için true döndür
    } else if (request.action === "toggle") {
        // Uzantının aktif/pasif durumunu content.js'e bildirmek için
        // Bu mesajın gönderildiği yerler content.js içinde değiştiği için
        // burada doğrudan bir işlem yapılmasına gerek kalmayabilir.
        sendResponse({ status: "success", message: `Uzantı durumu: ${request.value ? 'Aktif' : 'Pasif'}` });
        return true;
    }
});
