// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleActive');
    const triggerButton = document.getElementById('triggerCalculation');
    const statusDiv = document.getElementById('status');

    // Uzantının aktiflik durumunu arka plandan alıp butonu güncelle
    chrome.runtime.sendMessage({ action: "loadSettings" }, (response) => {
        if (response && response.status === "success" && response.data.genelAyarlar) {
            const isActive = response.data.genelAyarlar.isActive; // isActive ayarını takip etmek gerekebilir
            // Şu anki kodunuzda isActive content.js içinde, bu yüzden popupta doğrudan kontrol edemeyiz.
            // Bunun yerine, content.js'e toggle mesajı gönderip o tarafın durumunu değiştirmesini sağlayacağız.
            // Bu popup buttonu sadece "toggle" mesajı gönderecek ve content.js de buna göre aktif/pasif olacak.
            // Başlangıçta aktif/pasif durumunu göstermek için daha karmaşık bir mesajlaşma yapısı gerekebilir.
            // Şimdilik sadece toggle yapacak şekilde bırakalım.
        }
    });

    toggleButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggle", value: !isActive }, (response) => {
                    // isActive durumu content.js içinde yönetildiği için, buradaki isActive bir state tutmayacak.
                    // Sadece bir toggle komutu gönderecek.
                    if (response && response.status) {
                        statusDiv.textContent = `Uzantı durumu değişti.`;
                    } else {
                        statusDiv.textContent = `Durum değiştirilemedi.`;
                    }
                    setTimeout(() => statusDiv.textContent = '', 2000);
                });
            }
        });
    });

    triggerButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "manualTrigger" }, (response) => {
                    if (response && response.status === "success") {
                        statusDiv.textContent = response.message;
                    } else if (response && response.status === "error") {
                        statusDiv.textContent = response.message;
                    } else {
                        statusDiv.textContent = "Hesaplama tetiklenemedi.";
                    }
                    setTimeout(() => statusDiv.textContent = '', 3000);
                });
            }
        });
    });
});
