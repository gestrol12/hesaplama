{
    let isActive = true; // Uzantının aktif olup olmadığını kontrol eder.
    let selectedValues = []; // Seçilen sayısal değerleri depolar.
    let closeTimer = null; // Kapanma zamanlayıcısı için referans.

    // Varsayılan hesaplama yöntemleri.
    let percentageConfigs = [
        { label: "%10", description: "Diğerleri", multiplier: 0.10, maxAmount: null, color: "#e0f2f7" },
        { label: "%15", description: "ANINDATRANSFER_BANK_TRANSFER", multiplier: 0.15, maxAmount: 500, color: "#e0f7de" },
        { label: "%20", description: "Payco/ Minipay Havale", multiplier: 0.20, maxAmount: 500, color: "#ffe0b2" }
    ];

    // Varsayılan toplu seçim eşikleri.
    let topluSecimEsikleri = [
        { start: 10000, end: 49999, percentage: 0.20 },
        { start: 50000, end: null, percentage: 0.25 }
    ];

    // Varsayılan genel ayarlar.
    let genelAyarlar = {
        backgroundTransparency: 50,
        tema: "Nordic Breeze",
        bildirimSesiAktif: false,
        bildirimSesiTuru: "ding",
        otomatikKapanmaSuresi: 4
    };

    // Tema seçenekleri listesi
    const temaSecenekleri = [
        { value: "Nordic Breeze", label: "Nordic Breeze" },
        { value: "Solaris Glow", label: "Solaris Glow" },
        { value: "Midnight Deep", label: "Midnight Deep" },
        { value: "Minty Fresh", label: "Minty Fresh" },
        { value: "Orchid Haze", label: "Orchid Haze" }
    ];

    // Otomatik kapanma süresi seçenekleri
    const otomatikKapanmaSecenekleri = [0, 3, 4, 5, 6, 7, 8, 9]; // 0 saniye seçeneği eklendi

    // Bildirim Sesi Türleri
    const bildirimSesiSecenekleri = [
        { value: "none", label: "Ses Yok" },
        { value: "ding", label: "Ding" },
        { value: "successChime", label: "Başarılı Çınlama" },
        { value: "pop", label: "Pop" },
        { value: "whoosh", label: "Whoosh" }
    ];

    // --- Web Audio API ile Ses Üretme ---
    let audioContext = null;

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(type) {
        if (!genelAyarlar.bildirimSesiAktif || type === "none") {
            return;
        }

        initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case "ding":
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case "successChime":
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case "pop":
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case "whoosh":
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            default:
                // If a sound type is not recognized, play a default ding
                playSound("ding");
                break;
        }
    }


    // --- Ayarları Yükleme ve Kaydetme Fonksiyonları (chrome.storage.local ile iletişim) ---

    // Ayarları arka plan betiğinden yükler.
    function loadSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "loadSettings" }, (response) => {
                if (response && response.status === "success") {
                    if (response.data.percentageConfigs) {
                        percentageConfigs = response.data.percentageConfigs;
                    }
                    if (response.data.topluSecimEsikleri) {
                        topluSecimEsikleri = response.data.topluSecimEsikleri;
                    }
                    if (response.data.genelAyarlar) {
                        genelAyarlar = { ...genelAyarlar, ...response.data.genelAyarlar };
                    }
                } else {
                    console.error("Ayarlar yüklenirken hata oluştu:", response ? response.message : "Yanıt yok.");
                }
                resolve(); // Yükleme tamamlandı (hata olsa bile)
            });
        });
    }

    // Ayarları arka plan betiğine kaydeder.
    function saveSettings() {
        chrome.runtime.sendMessage({
            action: "saveSettings",
            percentageConfigs: percentageConfigs,
            topluSecimEsikleri: topluSecimEsikleri,
            genelAyarlar: genelAyarlar
        }, (response) => {
            if (response && response.status === "success") {
                console.log('Ayarlar kaydedildi.');
            } else {
                console.error("Ayarlar kaydedilirken hata oluştu:", response ? response.message : "Yanıt yok.");
            }
        });
    }

    // Script başladığında ayarları yükle
    (async () => {
        await loadSettings();
    })();

    // --- Yardımcı Fonksiyonlar ---

    // Kontrastlı metin rengi hesaplar (açık/koyu arka plana göre)
    function getContrastTextColor(hexColor) {
        if (!hexColor) return '#000000';
        const hex = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;
        if (hex.length !== 3 && hex.length !== 6) return '#000000';

        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
        if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Rengi belirli bir miktarda açar veya koyulaştırır
    function adjustBrightness(hex, amount) {
        if (!hex || typeof hex !== 'string') return null;
        let usePound = false;
        let originalHex = hex;

        if (hex.startsWith("#")) {
            hex = hex.slice(1);
            usePound = true;
        } else if (hex.startsWith("rgb")) {
            return originalHex; // Cannot simply adjust rgb strings this way
        }

        if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
            return originalHex;
        }

        let r_val, g_val, b_val;
        if (hex.length === 3) {
            r_val = parseInt(hex[0] + hex[0], 16);
            g_val = parseInt(hex[1] + hex[1], 16);
            b_val = parseInt(hex[2] + hex[2], 16);
        } else {
            r_val = parseInt(hex.slice(0, 2), 16);
            g_val = parseInt(hex.slice(2, 4), 16);
            b_val = parseInt(hex.slice(4, 6), 16);
        }

        if (isNaN(r_val) || isNaN(g_val) || isNaN(b_val)) {
            return originalHex;
        }

        r_val = Math.max(0, Math.min(255, r_val + amount));
        g_val = Math.max(0, Math.min(255, g_val + amount));
        b_val = Math.max(0, Math.min(255, b_val + amount));

        const toSingleHex = (c) => c.toString(16).padStart(2, '0');
        return `${usePound ? "#" : ""}${toSingleHex(r_val)}${toSingleHex(g_val)}${toSingleHex(b_val)}`;
    }

    // Temayı ayarlar modalına uygular
    function applyTheme(tema) {
        let bgColor, textColor, cardBgColor, cardTextColor, inputBgColor, inputBorderColor, menuBorderColor, btnHoverBg, btnActiveBg, btnActiveText, btnActiveBorder;

        switch (tema) {
            case "Solaris Glow":
                bgColor = '#fff8e1'; textColor = '#795548'; cardBgColor = '#fff0cb'; cardTextColor = '#5d4037';
                inputBgColor = '#fffdf9'; inputBorderColor = '#ffe0b2'; menuBorderColor = '#ffe0b2';
                btnHoverBg = '#fff0cb'; btnActiveBg = '#ffe0b2'; btnActiveText = '#5d4037'; btnActiveBorder = '#ffcc80';
                break;
            case "Midnight Deep":
                bgColor = '#2c3e50'; textColor = '#ecf0f1'; cardBgColor = '#34495e'; cardTextColor = '#bdc3c7';
                inputBgColor = '#3b5266'; inputBorderColor = '#567083'; menuBorderColor = '#3b5266';
                btnHoverBg = '#3e5060'; btnActiveBg = '#4a6075'; btnActiveText = '#ffffff'; btnActiveBorder = '#527690';
                break;
            case "Minty Fresh":
                bgColor = '#e6fffa'; textColor = '#004d40'; cardBgColor = '#d1f7f0'; cardTextColor = '#00392e';
                inputBgColor = '#f2fffb'; inputBorderColor = '#b2dfdb'; menuBorderColor = '#b2dfdb';
                btnHoverBg = '#c1f0e8'; btnActiveBg = '#b2dfdb'; btnActiveText = '#00392e'; btnActiveBorder = '#80cbc4';
                break;
            case "Orchid Haze":
                bgColor = '#f3e5f5'; textColor = '#4a148c'; cardBgColor = '#ebdcf0'; cardTextColor = '#38006b';
                inputBgColor = '#faf5fb'; inputBorderColor = '#e1bee7'; menuBorderColor = '#e1bee7';
                btnHoverBg = '#e5d4ea'; btnActiveBg = '#e1bee7'; btnActiveText = '#38006b'; btnActiveBorder = '#ce93d8';
                break;
            case "Nordic Breeze":
            default:
                bgColor = '#eaf4f7'; textColor = '#34495e'; cardBgColor = '#dcebf0'; cardTextColor = '#2c3e50';
                inputBgColor = '#f0f8fa'; inputBorderColor = '#c5d9e0'; menuBorderColor = '#c5d9e0';
                btnHoverBg = '#d8e5e9'; btnActiveBg = '#c5d9e0'; btnActiveText = '#2c3e50'; btnActiveBorder = '#b0c8d0';
                break;
        }

        const modalContent = document.getElementById("settings-modal-content");
        const settingsMenu = document.getElementById("settings-menu");

        if (modalContent) {
            modalContent.style.backgroundColor = bgColor;
            modalContent.style.color = textColor;
            modalContent.style.setProperty('--card-bg-color', cardBgColor);
            modalContent.style.setProperty('--card-text-color', cardTextColor);
            modalContent.style.setProperty('--input-bg-color', inputBgColor);
            modalContent.style.setProperty('--input-border-color', inputBorderColor);
            modalContent.style.setProperty('--button-hover-bg-color', btnHoverBg);
            modalContent.style.setProperty('--button-active-bg-color', btnActiveBg);
            modalContent.style.setProperty('--button-active-text-color', btnActiveText);
            modalContent.style.setProperty('--button-active-border-color', btnActiveBorder);
        }
        if (settingsMenu) {
            settingsMenu.style.borderRightColor = menuBorderColor;
        }

        document.querySelectorAll('#settings-menu button').forEach(btn => {
            const isActiveButton = btn.classList.contains("active-menu-button");
            if (isActiveButton) {
                btn.style.backgroundColor = btnActiveBg;
                btn.style.color = btnActiveText;
                btn.style.borderColor = btnActiveBorder;
                btn.style.fontWeight = "bold";
            } else {
                btn.style.backgroundColor = "transparent";
                btn.style.color = "inherit";
                btn.style.borderColor = "transparent";
                btn.style.fontWeight = "500";
            }
        });
        const activeMenuButton = document.querySelector('#settings-menu button.active-menu-button');
        if (activeMenuButton && modalContent && modalContent.style.getPropertyValue('--button-active-bg-color')) {
            Object.assign(activeMenuButton.style, {
                backgroundColor: modalContent.style.getPropertyValue('--button-active-bg-color'),
                color: modalContent.style.getPropertyValue('--button-active-text-color'),
                fontWeight: "bold",
                borderColor: modalContent.style.getPropertyValue('--button-active-border-color')
            });
        }
    }

    // Hesaplama penceresinin genel ayarlarını uygular (şeffaflık, tema renkleri)
    function applyGeneralSettings(element) {
        const transparency = genelAyarlar.backgroundTransparency / 100;
        if (element) {
            const currentTheme = temaSecenekleri.find(t => t.value === genelAyarlar.tema);
            const themeColor = currentTheme ? currentTheme.value : "Nordic Breeze"; // Varsayılan tema

            let bgColor, textColor, borderColor, cardBgColor, cardTextColor;

            switch (themeColor) {
                case "Solaris Glow":
                    bgColor = `rgba(255, 248, 225, ${transparency})`;
                    textColor = '#795548';
                    borderColor = 'rgba(255, 224, 178, 0.7)';
                    cardBgColor = '#fff0cb'; cardTextColor = '#5d4037';
                    break;
                case "Midnight Deep":
                    bgColor = `rgba(44, 62, 80, ${transparency})`;
                    textColor = '#ecf0f1';
                    borderColor = 'rgba(52, 73, 94, 0.7)';
                    cardBgColor = '#34495e'; cardTextColor = '#bdc3c7';
                    break;
                case "Minty Fresh":
                    bgColor = `rgba(230, 255, 250, ${transparency})`;
                    textColor = '#004d40';
                    borderColor = 'rgba(178, 223, 219, 0.7)';
                    cardBgColor = '#d1f7f0'; cardTextColor = '#00392e';
                    break;
                case "Orchid Haze":
                    bgColor = `rgba(243, 229, 245, ${transparency})`;
                    textColor = '#4a148c';
                    borderColor = 'rgba(225, 190, 231, 0.7)';
                    cardBgColor = '#ebdcf0'; cardTextColor = '#38006b';
                    break;
                case "Nordic Breeze":
                default:
                    bgColor = `rgba(234, 244, 247, ${transparency})`;
                    textColor = '#34495e';
                    borderColor = 'rgba(197, 217, 224, 0.7)';
                    cardBgColor = '#dcebf0'; cardTextColor = '#2c3e50';
                    break;
            }

            element.style.backgroundColor = bgColor;
            element.style.color = textColor;
            element.style.borderColor = borderColor;
            element.style.setProperty('--calc-window-card-bg-color', cardBgColor);
            element.style.setProperty('--calc-window-card-text-color', cardTextColor);
            element.style.setProperty('--calc-window-border-color', borderColor);
        }
    }

    // Bildirim sesi çalar (Artık Web Audio API kullanıyor)
    function playNotificationSound() {
        if (genelAyarlar.bildirimSesiAktif && genelAyarlar.bildirimSesiTuru !== "none") {
            playSound(genelAyarlar.bildirimSesiTuru);
        }
    }

    // Ekranın sağ üstünde bildirim gösterir
    function showNotification(message) {
        const notificationDiv = document.createElement("div");
        notificationDiv.textContent = message;
        Object.assign(notificationDiv.style, {
            position: "fixed", top: "20px", right: "20px",
            backgroundColor: "#4CAF50", color: "white",
            padding: "10px 20px", borderRadius: "8px",
            zIndex: 1000001, opacity: 0, transition: "opacity 0.5s ease-in-out",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
        });
        document.body.appendChild(notificationDiv);
        setTimeout(() => notificationDiv.style.opacity = 1, 10);
        setTimeout(() => {
            notificationDiv.style.opacity = 0;
            notificationDiv.addEventListener("transitionend", () => notificationDiv.remove());
        }, 3000);
    }

    // Ayarlar modalı için başlık oluşturur
    function createSectionTitle(title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        const modalContent = document.getElementById("settings-modal-content");
        Object.assign(h3.style, {
            fontSize: "16px", marginBottom: "15px", marginTop: "0", fontWeight: "600",
            color: "inherit", borderBottom: "1px solid", paddingBottom: "5px",
            borderColor: modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ddd'
        });
        return h3;
    }

    // Temalı butonlar oluşturur
    function createStyledButton(text, type = 'primary') {
        const button = document.createElement("button");
        button.textContent = text;
        const modalContent = document.getElementById("settings-modal-content");
        let bgColor, textColor, hoverBg, activeBg, borderColor;

        switch (type) {
            case 'primary':
                bgColor = modalContent ? modalContent.style.getPropertyValue('--button-active-bg-color') : '#3498db';
                textColor = modalContent ? modalContent.style.getPropertyValue('--button-active-text-color') : 'white';
                hoverBg = modalContent ? adjustBrightness(bgColor, 20) : '#2980b9';
                activeBg = modalContent ? adjustBrightness(bgColor, -20) : '#2c3e50';
                borderColor = modalContent ? modalContent.style.getPropertyValue('--button-active-border-color') : '#2980b9';
                break;
            case 'danger':
                bgColor = '#e74c3c'; textColor = 'white';
                hoverBg = '#c0392b'; activeBg = '#a93226';
                borderColor = '#c0392b';
                break;
            case 'secondary': // For "Yeni Eşik Ekle"
                bgColor = '#5cb85c'; textColor = 'white';
                hoverBg = '#4cae4c'; activeBg = '#449d44';
                borderColor = '#4cae4c';
                break;
            default:
                bgColor = '#3498db'; textColor = 'white';
                hoverBg = '#2980b9'; activeBg = '#2c3e50';
                borderColor = '#2980b9';
        }

        Object.assign(button.style, {
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
            padding: "8px 15px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
            whiteSpace: "nowrap"
        });

        button.addEventListener("mouseover", () => {
            button.style.backgroundColor = hoverBg;
            button.style.borderColor = hoverBg;
        });
        button.addEventListener("mouseout", () => {
            button.style.backgroundColor = bgColor;
            button.style.borderColor = borderColor;
        });
        button.addEventListener("mousedown", () => {
            button.style.backgroundColor = activeBg;
            button.style.borderColor = activeBg;
        });
        button.addEventListener("mouseup", () => {
            button.style.backgroundColor = hoverBg; // Go back to hover state after click
            button.style.borderColor = hoverBg;
        });

        return button;
    }

    // Ayarlar modalındaki input alanlarını oluşturur ve değişiklikleri yönetir.
    function createStyledInput(labelText, initialValue, onChangeCallback, inputType = "text") {
        const container = document.createElement("div");
        const modalContent = document.getElementById("settings-modal-content");
        Object.assign(container.style, {
            marginBottom: "10px", display: "flex", flexDirection: "column", gap: "5px"
        });
        const label = document.createElement("label");
        label.textContent = labelText + ":";
        Object.assign(label.style, { fontWeight: "bold", fontSize: "12px", color: "inherit" });
        const input = document.createElement("input");
        input.type = inputType;
        input.value = (initialValue === null || initialValue === undefined) ? "" : initialValue; // Null/undefined durumunu boş stringe çevir
        Object.assign(input.style, {
            width: "100%", padding: "10px", borderRadius: "6px",
            border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
            fontSize: "13px", boxSizing: "border-box",
            backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : '#fff',
            color: "inherit"
        });
        // Input değiştikçe onChangeCallback'i çağır ve ayarları kaydet
        input.addEventListener("input", (event) => {
            onChangeCallback(event.target.value);
            saveSettings(); // Her input değiştiğinde kaydet
        });
        container.appendChild(label); container.appendChild(input);
        return container;
    }

    let newCalculation = {}; // Yeni hesaplama yöntemi eklerken geçici olarak verileri tutar.

    // YENİ: Hesaplama kutusunu kapatmak için merkezi fonksiyon
    function closePercentageBox() {
        const existingBox = document.getElementById("percentage-box");
        if (existingBox) {
            existingBox.style.transition = "opacity 0.3s ease-out";
            existingBox.style.opacity = "0";
            setTimeout(() => {
                if (existingBox) existingBox.remove();
                selectedValues = []; // Kutu kapandığında seçili değerleri temizle
            }, 300);
        }
    }

    // Metni panoya kopyalar ve bildirim gösterir
    function copyTextToClipboard(text) {
        // Önceki kapanma zamanlayıcısını temizle
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showNotification("Kopyalandı!");
        playNotificationSound(); // Kopyalama işleminde bildirim sesi çal

        // Otomatik kapanma süresini kontrol et
        if (genelAyarlar.otomatikKapanmaSuresi > 0) {
            closeTimer = setTimeout(() => {
                closePercentageBox(); // Belirlenen süre sonunda kutuyu kapat
            }, genelAyarlar.otomatikKapanmaSuresi * 1000);
        } else {
            // Eğer otomatik kapanma süresi 0 ise hemen kapat
            closePercentageBox();
        }
    }

    // --- Hesaplama Kutusu Oluşturma ve Yönetme ---

    // Hesaplama kutusunu oluşturan veya güncelleyen ana fonksiyon
    function createOrUpdatePercentageBox(numberValue) {
        let container = document.getElementById("percentage-box");
        if (!container) {
            container = document.createElement("div");
            container.id = "percentage-box";
            document.body.appendChild(container);
            applyGeneralSettings(container); // Tema ve şeffaflığı uygula

            Object.assign(container.style, {
                position: "fixed",
                top: "calc(70% + 60px)",
                right: "20px",
                transform: "translateY(-50%)",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                zIndex: 999999,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontFamily: "'Roboto', sans-serif",
                fontSize: "13px",
                minWidth: "220px",
                willChange: "transform",
                maxWidth: "95vw",
                transformOrigin: "top left",
                padding: "10px",
                opacity: 1, // Kutuyu görünür yap
                transition: "opacity 0.3s ease-in-out" // Geçiş efekti ekle
            });

            // Ayarlar butonu
            const settingsBtn = document.createElement("div");
            settingsBtn.innerHTML = '&#9881;'; // Dişli çark ikonu
            Object.assign(settingsBtn.style, {
                position: "absolute",
                top: "-12px",
                right: "-10px",
                width: "24px",
                height: "24px",
                backgroundColor: "#64b5f6",
                color: "white",
                borderRadius: "50%",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
                lineHeight: "24px",
                cursor: "pointer",
                boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
            });
            container.appendChild(settingsBtn);

            // Ayarlar modalı overlay'i (arkaplan karartma)
            const modalOverlay = document.createElement("div");
            modalOverlay.id = "settings-modal-overlay";
            Object.assign(modalOverlay.style, {
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1000000,
                display: "none", justifyContent: "center", alignItems: "center",
                fontFamily: "'Roboto', sans-serif"
            });
            document.body.appendChild(modalOverlay); // Modalı body'ye ekle

            // Ayarlar modalı içeriği
            const modalContent = document.createElement("div");
            modalContent.id = "settings-modal-content";
            Object.assign(modalContent.style, {
                padding: "20px", borderRadius: "12px", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
                width: "90%", maxWidth: "1000px", display: "flex", flexDirection: "row",
                gap: "20px", maxHeight: "85vh", overflowY: "auto"
            });
            modalOverlay.appendChild(modalContent);

            // Ayarlar modalı menüsü
            const settingsMenu = document.createElement("div");
            settingsMenu.id = "settings-menu";
            Object.assign(settingsMenu.style, {
                display: "flex", flexDirection: "column", gap: "10px", minWidth: "200px",
                paddingRight: "20px", borderRight: "1px solid #e0e0e0"
            });
            modalContent.appendChild(settingsMenu);

            // Ayarlar modalı içerik alanı
            const settingsContent = document.createElement("div");
            settingsContent.id = "settings-content";
            Object.assign(settingsContent.style, { padding: "10px", flexGrow: 1 });
            modalContent.appendChild(settingsContent);

            // Ayarlar menüsü butonları
            const buttonsData = [
                { id: "hesaplama-yontemleri", text: "Hesaplama Yöntemleri" },
                { id: "toplu-secim-yonetimi", text: "Toplu Seçim Yönetimi" },
                { id: "hesaplama-ekleme", text: "Hesaplama Ekleme" },
                { id: "genel-ayarlar", text: "Genel Ayarlar" }
            ];

            buttonsData.forEach(({ id, text }) => {
                const button = document.createElement("button");
                button.id = id;
                button.textContent = text;
                Object.assign(button.style, {
                    backgroundColor: "transparent", color: "inherit", border: "1px solid transparent",
                    padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
                    textAlign: "left", transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                    width: "100%", fontWeight: "500"
                });
                button.addEventListener("mouseover", () => {
                    if (modalContent.style.getPropertyValue('--button-hover-bg-color')) {
                        button.style.backgroundColor = modalContent.style.getPropertyValue('--button-hover-bg-color');
                    } else {
                        button.style.backgroundColor = genelAyarlar.tema === "Midnight Deep" ? "#3e5060" : "#e9e9e9";
                    }
                });
                button.addEventListener("mouseout", () => {
                    const isActiveButton = button.classList.contains("active-menu-button");
                    if (!isActiveButton) {
                        button.style.backgroundColor = "transparent";
                    }
                });
                button.addEventListener("click", () => {
                    document.querySelectorAll('#settings-menu button').forEach(btn => {
                        btn.classList.remove("active-menu-button");
                        Object.assign(btn.style, {
                            backgroundColor: "transparent", color: "inherit",
                            fontWeight: "500", borderColor: "transparent"
                        });
                    });
                    button.classList.add("active-menu-button");
                       if (modalContent.style.getPropertyValue('--button-active-bg-color')) {
                        button.style.backgroundColor = modalContent.style.getPropertyValue('--button-active-bg-color');
                        button.style.color = modalContent.style.getPropertyValue('--button-active-text-color') || 'inherit';
                        button.style.borderColor = modalContent.style.getPropertyValue('--button-active-border-color') || 'transparent';
                    } else { // Fallback
                        button.style.backgroundColor = genelAyarlar.tema === "Midnight Deep" ? "#4a6075" : "#dcdcdc";
                        button.style.color = genelAyarlar.tema === "Midnight Deep" ? "#ffffff" : "#000000";
                    }
                    button.style.fontWeight = "bold";
                    renderSettingsContent(id); // Menü içeriğini render et
                });
                settingsMenu.appendChild(button);
            });
        }

        // Kutunun içeriğini temizle ve yeniden oluştur
        // Ayarlar butonu ve modal zaten eklendiği için bunları tekrar eklemeye gerek yok.
        // Sadece hesaplama sonuçlarını içeren div'leri temizleyip yeniden ekle.
        const existingResults = container.querySelectorAll('.calculation-result-box, .total-result-box');
        existingResults.forEach(box => box.remove());

        // Hesaplama yöntemlerini render et
        percentageConfigs.forEach(({ label, description, multiplier, maxAmount, color }) => {
            let calculated = numberValue * multiplier;
            if (maxAmount && calculated > maxAmount) calculated = maxAmount;
            const value = calculated.toFixed(2).replace(".", ",");
            const box = document.createElement("div");
            box.classList.add('calculation-result-box'); // Yeni sınıf ekle
            const backgroundColor = color || "#e0f2f7";
            const borderColor = adjustBrightness(backgroundColor, -20) || "#a7d1eb";
            const boxTextColor = getContrastTextColor(backgroundColor);

            Object.assign(box.style, {
                backgroundColor: backgroundColor,
                border: `1px solid ${borderColor}`,
                color: boxTextColor,
                borderRadius: "8px", padding: "10px 14px", cursor: "pointer",
                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                fontWeight: "normal", fontSize: "12px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)"
            });

            const fullTextContent = `${label} (${description}): ${value}`;
            const parts = fullTextContent.split(':');
            const labelPart = parts[0];
            const valuePart = parts[1];
            box.innerHTML = '';
            const [percentageLabel, descriptionTextWithParen] = labelPart.split('(');
            const descriptionText = descriptionTextWithParen ? descriptionTextWithParen.slice(0, -1) : '';
            const percentageSpan = document.createElement('span');
            percentageSpan.textContent = percentageLabel.trim();
            percentageSpan.style.fontWeight = 'bold';
            const descSpan = document.createElement('span');
            descSpan.textContent = descriptionText ? ` (${descriptionText.trim()})` : '';
            descSpan.style.fontSize = "11px"; descSpan.style.opacity = "0.8";
            const valueSpan = document.createElement("span");
            valueSpan.innerHTML = `:${valuePart}`;
            valueSpan.style.fontWeight = "bold";

            box.appendChild(percentageSpan);
            box.appendChild(descSpan);
            box.appendChild(valueSpan);

            box.addEventListener("mouseover", () => {
                box.style.backgroundColor = adjustBrightness(backgroundColor, 20) || "#cce5f0";
                box.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.12)";
            });
            box.addEventListener("mouseout", () => {
                box.style.backgroundColor = backgroundColor;
                box.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
            });
            box.addEventListener("click", () => {
                copyTextToClipboard(value);
                const clickBgColor = adjustBrightness(backgroundColor, -30);
                box.style.backgroundColor = clickBgColor || backgroundColor;
                setTimeout(() => box.style.backgroundColor = backgroundColor, 300);
            });
            container.appendChild(box);
        });

        // Toplu seçim sonucunu render et (sadece birden fazla seçim varsa)
        if (selectedValues.length > 1) {
            const sum = selectedValues.reduce((a, b) => a + b, 0);
            let percentage = 0.15; // Varsayılan toplu seçim yüzdesi
            let foundEsik = false;

            for (const esik of topluSecimEsikleri) {
                if (esik.start !== null && sum >= esik.start && (esik.end === null || sum <= esik.end)) {
                    percentage = esik.percentage;
                    foundEsik = true;
                    break;
                }
            }

            // Eğer eşik bulunamadıysa ve "Toplu Seçim" adında bir yapılandırma varsa onu kullan
            if (!foundEsik) {
                const topluSecimAyari = percentageConfigs.find(config => config.description === "Toplu Seçim");
                if (topluSecimAyari && typeof topluSecimAyari.multiplier === 'number') {
                    percentage = topluSecimAyari.multiplier;
                }
            }

            const totalResult = (sum * percentage).toFixed(2).replace(".", ",");
            const totalBox = document.createElement("div");
            totalBox.classList.add('total-result-box'); // Yeni sınıf ekle
            totalBox.textContent = `Toplam ${selectedValues.length} seçim – %${(percentage * 100).toFixed(0)}: ${totalResult}`;
            Object.assign(totalBox.style, {
                backgroundColor: container.style.getPropertyValue('--calc-window-card-bg-color') || "#f0f0f0",
                color: container.style.getPropertyValue('--calc-window-card-text-color') || "#333",
                border: `1px solid ${container.style.getPropertyValue('--calc-window-border-color') || "#dcdcdc"}`,
                borderRadius: "8px", padding: "10px 14px", cursor: "pointer",
                fontWeight: "bold", fontSize: "13px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                marginTop: "5px"
            });
            totalBox.addEventListener("mouseover", () => {
                let currentBg = totalBox.style.backgroundColor || (container.style.getPropertyValue('--calc-window-card-bg-color') || "#f0f0f0");
                totalBox.style.backgroundColor = adjustBrightness(currentBg, genelAyarlar.tema === "Midnight Deep" ? 10 : -10 );
                totalBox.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.12)";
            });
            totalBox.addEventListener("mouseout", () => {
                totalBox.style.backgroundColor = container.style.getPropertyValue('--calc-window-card-bg-color') || "#f0f0f0";
                totalBox.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
            });
            totalBox.addEventListener("click", () => {
                copyTextToClipboard(totalResult);
                const clickBg = genelAyarlar.tema === "Midnight Deep" ? "#506880" : "#c8e6c9";
                totalBox.style.backgroundColor = clickBg;
                setTimeout(() => totalBox.style.backgroundColor = container.style.getPropertyValue('--calc-window-card-bg-color') || "#f0f0f0", 300);
            });
            container.appendChild(totalBox);
        }
    }

    // --- Ayarlar Modalı İçeriği Oluşturma ---

    // Ayarlar modalının içeriğini sekmeye göre render eder
    function renderSettingsContent(tabId) {
        const contentArea = document.getElementById("settings-content");
        const modalContent = document.getElementById("settings-modal-content");
        if (!contentArea) return;

        contentArea.innerHTML = ""; // Mevcut içeriği temizle

        if (tabId === "hesaplama-yontemleri") {
            contentArea.appendChild(createSectionTitle("Hesaplama Yöntemlerini Yönet"));
            percentageConfigs.forEach((config, index) => {
                const methodContainer = document.createElement("div");
                Object.assign(methodContainer.style, {
                    backgroundColor: modalContent ? modalContent.style.getPropertyValue('--card-bg-color') : "#f9f9f9",
                    color: modalContent ? modalContent.style.getPropertyValue('--card-text-color') : "inherit",
                    border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ddd'}`,
                    borderRadius: "8px", padding: "15px", marginBottom: "10px"
                });
                // Her input değiştiğinde saveSettings() çağrısı yapılıyor
                const labelInput = createStyledInput("Etiket", config.label, (value) => { config.label = value; });
                const descriptionInput = createStyledInput("Açıklama", config.description, (value) => { config.description = value; });
                const percentageInput = createStyledInput("Yüzde Oranı (%)", (config.multiplier * 100).toFixed(2), (value) => { config.multiplier = parseFloat(value) / 100; }, "number");
                const maxAmountInput = createStyledInput("Max Tutar", config.maxAmount === null ? "" : config.maxAmount, (value) => { config.maxAmount = value ? parseFloat(value) : null; }, "number");

                const colorContainer = document.createElement("div");
                Object.assign(colorContainer.style, { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" });
                const colorLabel = document.createElement("label");
                colorLabel.textContent = "Renk:";
                Object.assign(colorLabel.style, { fontWeight: "bold", fontSize: "12px", color: "inherit" });
                const colorInput = document.createElement("input");
                colorInput.type = "color";
                colorInput.value = config.color || "#e0f2f7";
                Object.assign(colorInput.style, {
                    width: "40px", height: "25px", borderRadius: "4px",
                    border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                    cursor: "pointer",
                    backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : 'transparent'
                });
                colorInput.addEventListener("input", (event) => {
                    config.color = event.target.value;
                    saveSettings(); // Renk değiştiğinde kaydet
                });
                const previewButton = document.createElement("button");
                previewButton.textContent = "Önizle";
                Object.assign(previewButton.style, {
                    backgroundColor: config.color || "#e0f2f7",
                    color: getContrastTextColor(config.color || "#e0f2f7"),
                    border: "none", padding: "6px 12px", borderRadius: "4px",
                    cursor: "pointer", fontSize: "11px"
                });
                previewButton.addEventListener("click", () => {
                    previewButton.style.backgroundColor = colorInput.value;
                    previewButton.style.color = getContrastTextColor(colorInput.value);
                });
                colorContainer.appendChild(colorLabel);
                colorContainer.appendChild(colorInput);
                colorContainer.appendChild(previewButton);

                const deleteButton = createStyledButton('Sil', 'danger');
                deleteButton.innerHTML = '&#10006; Sil';
                Object.assign(deleteButton.style, { padding: "8px 12px", fontSize: "12px" });
                deleteButton.addEventListener("click", () => {
                    percentageConfigs.splice(index, 1);
                    renderSettingsContent("hesaplama-yontemleri");
                    saveSettings(); // Silme işleminden sonra kaydet
                });
                methodContainer.appendChild(labelInput);
                methodContainer.appendChild(descriptionInput);
                methodContainer.appendChild(percentageInput);
                methodContainer.appendChild(maxAmountInput);
                const bottomRow = document.createElement("div");
                Object.assign(bottomRow.style, { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" });
                bottomRow.appendChild(colorContainer);
                bottomRow.appendChild(deleteButton);
                methodContainer.appendChild(bottomRow);
                contentArea.appendChild(methodContainer);
            });
        } else if (tabId === "toplu-secim-yonetimi") {
            contentArea.appendChild(createSectionTitle("Toplu Seçim Eşikleri"));
            topluSecimEsikleri.forEach((esik, index) => {
                const esikContainer = document.createElement("div");
                Object.assign(esikContainer.style, {
                    backgroundColor: modalContent ? modalContent.style.getPropertyValue('--card-bg-color') : "#f9f9f9",
                    color: modalContent ? modalContent.style.getPropertyValue('--card-text-color') : "inherit",
                    border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ddd'}`,
                    borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex",
                    gap: "10px", alignItems: "center", flexWrap: "wrap"
                });
                // Her input değiştiğinde saveSettings() çağrısı yapılıyor
                const startInput = createStyledInput("Başlangıç", esik.start === null ? '' : esik.start, (value) => { esik.start = value ? parseFloat(value) : null; });
                const endInput = createStyledInput("Bitiş", esik.end === null ? '' : esik.end, (value) => { esik.end = value ? parseFloat(value) : null; });
                const percentageInput = createStyledInput("Yüzde (%)", (esik.percentage * 100).toFixed(2), (value) => { esik.percentage = parseFloat(value) / 100; }, "number");
                const deleteButton = createStyledButton('', 'danger');
                deleteButton.innerHTML = '&#10006;';
                Object.assign(deleteButton.style, { padding: "8px 10px", fontSize: "12px", marginLeft: "auto" });
                deleteButton.addEventListener("click", () => {
                    topluSecimEsikleri.splice(index, 1);
                    renderSettingsContent("toplu-secim-yonetimi");
                    saveSettings(); // Silme işleminden sonra kaydet
                });
                esikContainer.appendChild(startInput);
                esikContainer.appendChild(endInput);
                esikContainer.appendChild(percentageInput);
                esikContainer.appendChild(deleteButton);
                contentArea.appendChild(esikContainer);
            });
            const yeniEsikEkleButton = createStyledButton("Yeni Eşik Ekle", "secondary");
            Object.assign(yeniEsikEkleButton.style, { marginBottom: "15px", backgroundColor: "#5cb85c" });
            yeniEsikEkleButton.addEventListener("click", () => {
                topluSecimEsikleri.push({ start: null, end: null, percentage: 0.15 });
                renderSettingsContent("toplu-secim-yonetimi");
                saveSettings(); // Ekleme işleminden sonra kaydet
            });
            contentArea.appendChild(yeniEsikEkleButton);
        } else if (tabId === "hesaplama-ekleme") {
            contentArea.appendChild(createSectionTitle("Yeni Hesaplama Yöntemi Ekle"));
            const formContainer = document.createElement("div");
            Object.assign(formContainer.style, {
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--card-bg-color') : "#fff",
                color: modalContent ? modalContent.style.getPropertyValue('--card-text-color') : "inherit",
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ddd'}`,
                borderRadius: "8px", padding: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)"
            });
            const etiketInput = createStyledInput("Etiket", "", (value) => newCalculation.etiket = value);
            const aciklamaInput = createStyledInput("Açıklama", "", (value) => newCalculation.aciklama = value);
            const yuzdeInput = createStyledInput("Yüzde Oranı (%)", "", (value) => newCalculation.yuzde = parseFloat(value) / 100, "number");
            const maxTutarInput = createStyledInput("Max Tutar", "", (value) => newCalculation.maxTutar = value ? parseFloat(value) : null, "number");
            const renkLabelContainer = document.createElement("div");
            Object.assign(renkLabelContainer.style, { marginBottom: "10px" });
            const renkLabel = document.createElement("label");
            renkLabel.textContent = "Renk:";
            Object.assign(renkLabel.style, { fontWeight: "bold", fontSize: "12px", display: "block", marginBottom: "5px" });
            renkLabelContainer.appendChild(renkLabel);
            const renkInput = document.createElement("input");
            renkInput.type = "color";
            renkInput.value = "#f0f0f0";
            Object.assign(renkInput.style, {
                width: "100%", height: "35px", borderRadius: "6px",
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                cursor: "pointer", marginBottom: "15px",
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : 'transparent'
            });
            renkInput.addEventListener("input", (event) => newCalculation.renk = event.target.value);
            renkLabelContainer.appendChild(renkInput);
            const ekleButton = createStyledButton("Ekle ve Kaydet");
            Object.assign(ekleButton.style, { backgroundColor: "#28a745", width: "100%", marginTop: "10px" });
            ekleButton.addEventListener("click", () => {
                if (newCalculation.etiket && newCalculation.aciklama && newCalculation.yuzde !== undefined) {
                    percentageConfigs.push({
                        label: newCalculation.etiket, description: newCalculation.aciklama,
                        multiplier: newCalculation.yuzde, maxAmount: newCalculation.maxTutar || null,
                        color: newCalculation.renk || "#f0f0f0"
                    });
                    newCalculation = {}; // newCalculation objesini sıfırla
                    saveSettings(); // Yeni ekleme işleminden sonra kaydet
                    showNotification("Yeni hesaplama yöntemi eklendi ve kaydedildi!");
                    renderSettingsContent("hesaplama-yontemleri"); // Yöntemler sekmesine geri dön
                    const targetButton = document.getElementById("hesaplama-yontemleri");
                    if (targetButton) {
                        document.querySelectorAll('#settings-menu button').forEach(btn => {
                            btn.classList.remove("active-menu-button");
                            Object.assign(btn.style, { backgroundColor: "transparent", color: "inherit", fontWeight: "500", borderColor: "transparent" });
                        });
                        targetButton.classList.add("active-menu-button");
                           if (modalContent && modalContent.style.getPropertyValue('--button-active-bg-color')) {
                                Object.assign(targetButton.style, {
                                    backgroundColor: modalContent.style.getPropertyValue('--button-active-bg-color'),
                                    color: modalContent.style.getPropertyValue('--button-active-text-color'),
                                    fontWeight: "bold",
                                    borderColor: modalContent.style.getPropertyValue('--button-active-border-color')
                                });
                            }
                    }
                } else {
                    alert("Lütfen etiket, açıklama ve yüzde oranını giriniz.");
                }
            });
            formContainer.appendChild(etiketInput);
            formContainer.appendChild(aciklamaInput);
            formContainer.appendChild(yuzdeInput);
            formContainer.appendChild(maxTutarInput);
            formContainer.appendChild(renkLabelContainer);
            formContainer.appendChild(renkInput);
            formContainer.appendChild(ekleButton);
            contentArea.appendChild(formContainer);
        } else if (tabId === "genel-ayarlar") {
            contentArea.appendChild(createSectionTitle("Genel Ayarlar"));
            const settingsGrid = document.createElement("div");
            Object.assign(settingsGrid.style, {
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px",
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--card-bg-color') : "#fff",
                color: modalContent ? modalContent.style.getPropertyValue('--card-text-color') : "inherit",
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ddd'}`,
                borderRadius: "8px", padding: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)"
            });

            // Ayar satırı oluşturucu
            function createSettingRow(labelText, controlElement) {
                const div = document.createElement("div");
                Object.assign(div.style, { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" });
                const label = document.createElement("label");
                label.textContent = labelText;
                Object.assign(label.style, { fontWeight: "bold", fontSize: "12px", color: "inherit" });
                div.appendChild(label);
                div.appendChild(controlElement);
                return div;
            }

            // Şeffaflık ayarı
            const seffaflikInput = document.createElement("input");
            seffaflikInput.type = "range"; // Range input kullanmak daha pratik
            seffaflikInput.min = "0"; seffaflikInput.max = "100"; seffaflikInput.step = "1";
            seffaflikInput.value = genelAyarlar.backgroundTransparency;
            Object.assign(seffaflikInput.style, {
                width: "100%", padding: "8px", borderRadius: "6px",
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : '#fff',
                color: "inherit", fontSize: "13px"
            });
            const seffaflikValueDisplay = document.createElement("span");
            seffaflikValueDisplay.textContent = `${genelAyarlar.backgroundTransparency}%`;
            seffaflikInput.addEventListener("input", (e) => { // 'input' olayı her değişimde tetiklenir
                genelAyarlar.backgroundTransparency = parseInt(e.target.value);
                seffaflikValueDisplay.textContent = `${genelAyarlar.backgroundTransparency}%`;
                const calcWindow = document.getElementById("percentage-box");
                if (calcWindow) applyGeneralSettings(calcWindow);
            });
            seffaflikInput.addEventListener("change", () => { // 'change' olayı değer sabitlenince tetiklenir
                saveSettings(); // Değişiklik kalıcı olduğunda kaydet
            });
            const seffaflikContainer = document.createElement("div");
            Object.assign(seffaflikContainer.style, { display: "flex", alignItems: "center", gap: "10px" });
            seffaflikContainer.appendChild(seffaflikInput);
            seffaflikContainer.appendChild(seffaflikValueDisplay);
            settingsGrid.appendChild(createSettingRow("Arka Plan Şeffaflığı:", seffaflikContainer));

            // Tema ayarı
            const temaSelect = document.createElement("select");
            Object.assign(temaSelect.style, {
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : '#fff',
                color: "inherit", borderRadius: "6px", padding: "8px", fontSize: "13px", width: "100%"
            });
            temaSecenekleri.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value; optionElement.textContent = option.label;
                optionElement.selected = option.value === genelAyarlar.tema;
                temaSelect.appendChild(optionElement);
            });
            temaSelect.addEventListener("change", (e) => {
                genelAyarlar.tema = e.target.value;
                applyTheme(genelAyarlar.tema);
                const calcWindow = document.getElementById("percentage-box");
                if (calcWindow) applyGeneralSettings(calcWindow);
                saveSettings();
            });
            settingsGrid.appendChild(createSettingRow("Tema:", temaSelect));

            // Bildirim sesi aktif/pasif ayarı
            const sesCheckbox = document.createElement("input");
            sesCheckbox.type = "checkbox"; sesCheckbox.checked = genelAyarlar.bildirimSesiAktif;
            Object.assign(sesCheckbox.style, { width: "20px", height: "20px", marginRight: "auto", accentColor: "#3498db" });
            sesCheckbox.addEventListener("change", (e) => {
                genelAyarlar.bildirimSesiAktif = e.target.checked;
                saveSettings();
            });
            settingsGrid.appendChild(createSettingRow("Bildirim Sesi Aktif:", sesCheckbox));

            // Bildirim Sesi Türü Seçimi ve Önizleme
            const bildirimSesiTuruContainer = document.createElement("div");
            Object.assign(bildirimSesiTuruContainer.style, { display: "flex", alignItems: "center", gap: "10px", width: "100%" });

            const bildirimSesiTuruSelect = document.createElement("select");
            Object.assign(bildirimSesiTuruSelect.style, {
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : '#fff',
                color: "inherit", borderRadius: "6px", padding: "8px", fontSize: "13px", flexGrow: "1"
            });
            bildirimSesiSecenekleri.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value; optionElement.textContent = option.label;
                optionElement.selected = option.value === genelAyarlar.bildirimSesiTuru;
                bildirimSesiTuruSelect.appendChild(optionElement);
            });
            bildirimSesiTuruSelect.addEventListener("change", (e) => {
                genelAyarlar.bildirimSesiTuru = e.target.value;
                saveSettings();
            });

            const previewSoundButton = createStyledButton("Dinle", "secondary");
            Object.assign(previewSoundButton.style, { padding: "8px 12px", fontSize: "12px", backgroundColor: "#007bff", borderColor: "#007bff" });
            previewSoundButton.addEventListener("click", () => {
                if (genelAyarlar.bildirimSesiAktif && genelAyarlar.bildirimSesiTuru !== "none") {
                    playSound(genelAyarlar.bildirimSesiTuru);
                } else if (genelAyarlar.bildirimSesiTuru === "none") {
                     alert("Bildirim sesi ayarı 'Ses Yok' olarak seçili. Lütfen başka bir ses türü seçin.");
                } else if (!genelAyarlar.bildirimSesiAktif) {
                     alert("Bildirim sesi aktif değil. Lütfen 'Bildirim Sesi Aktif' kutucuğunu işaretleyin.");
                }
            });

            bildirimSesiTuruContainer.appendChild(bildirimSesiTuruSelect);
            bildirimSesiTuruContainer.appendChild(previewSoundButton);
            settingsGrid.appendChild(createSettingRow("Bildirim Sesi Türü:", bildirimSesiTuruContainer));


            // Otomatik kapanma süresi ayarı
            const kapanmaSelect = document.createElement("select");
            Object.assign(kapanmaSelect.style, {
                border: `1px solid ${modalContent ? modalContent.style.getPropertyValue('--input-border-color') : '#ccc'}`,
                backgroundColor: modalContent ? modalContent.style.getPropertyValue('--input-bg-color') : '#fff',
                color: "inherit", borderRadius: "6px", padding: "8px", fontSize: "13px", width: "100%"
            });
            otomatikKapanmaSecenekleri.forEach(saniye => {
                const optionElement = document.createElement("option");
                optionElement.value = saniye; optionElement.textContent = saniye === 0 ? "Asla Kapanma" : saniye + " saniye";
                optionElement.selected = saniye === genelAyarlar.otomatikKapanmaSuresi;
                kapanmaSelect.appendChild(optionElement);
            });
            kapanmaSelect.addEventListener("change", (e) => {
                genelAyarlar.otomatikKapanmaSuresi = parseInt(e.target.value);
                saveSettings();
            });
            settingsGrid.appendChild(createSettingRow("Otomatik Kapanma Süresi:", kapanmaSelect));

            contentArea.appendChild(settingsGrid);
        }
    }

    // --- Olay Dinleyicileri ---

    // selectionchange olay dinleyicisi
    document.addEventListener("selectionchange", () => {
        if (!isActive) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // Normalize the text to a number
        const normalizedText = selectedText.replace(/\./g, "").replace(",", ".");
        const numberValue = parseFloat(normalizedText);

        // Eğer seçim boşsa veya geçerli bir sayı değilse
        if (!selectedText || isNaN(numberValue)) {
            // Seçim boşaldığında veya geçersiz olduğunda kutuyu kapatma.
            // Sadece kopyalama işlemi sonrası kapanacak.
            return;
        }

        // Eğer yeni bir sayı seçildiyse (öncekiyle aynı değilse) listeye ekle
        // Bu, aynı sayıyı tekrar tekrar seçince listeye tekrar eklenmesini engeller.
        if (selectedValues.length === 0 || selectedValues[selectedValues.length - 1] !== numberValue) {
            selectedValues.push(numberValue);
        }

        createOrUpdatePercentageBox(numberValue); // Hesaplama kutusunu oluştur/güncelle
    });


    // Ayarlar butonu veya overlay tıklamalarını yönetir
    document.addEventListener('click', function(event) {
        const settingsBtn = event.target.closest('div[style*="absolute"]'); // Dişli çark butonu
        const percentageBox = document.getElementById('percentage-box');

        // Ayarlar butonuna tıklandığında modalı aç
        if (percentageBox && settingsBtn && percentageBox.contains(settingsBtn) && settingsBtn.innerHTML === '⚙') {
            const modal = document.getElementById("settings-modal-overlay");
            if (modal) {
                modal.style.display = "flex";
                applyTheme(genelAyarlar.tema);
                // Menü butonlarını sıfırla ve "Genel Ayarlar" sekmesini aktif et
                document.querySelectorAll('#settings-menu button').forEach(btn => {
                    btn.classList.remove("active-menu-button");
                    Object.assign(btn.style, {
                        backgroundColor: "transparent", color: "inherit",
                        fontWeight: "500", borderColor: "transparent"
                    });
                });
                const initialButton = document.getElementById("genel-ayarlar");
                const modalContent = document.getElementById("settings-modal-content");
                if (initialButton && modalContent) {
                    initialButton.classList.add("active-menu-button");
                    Object.assign(initialButton.style, {
                        backgroundColor: modalContent.style.getPropertyValue('--button-active-bg-color'),
                        color: modalContent.style.getPropertyValue('--button-active-text-color'),
                        fontWeight: "bold",
                        borderColor: modalContent.style.getPropertyValue('--button-active-border-color')
                    });
                    renderSettingsContent("genel-ayarlar");
                }
            }
        }

        // Modal overlay'ine tıklandığında modalı kapat
        const modalOverlay = document.getElementById("settings-modal-overlay");
        if (modalOverlay && event.target === modalOverlay) {
            modalOverlay.style.display = "none";
        }
    });

    // Arka plan betiğinden gelen mesajları dinler (uzantının popup'ı ile iletişim için)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggle") {
            isActive = request.value;
            const existingBox = document.getElementById("percentage-box");
            if (!isActive && existingBox) {
                closePercentageBox(); // Uzantı kapatıldığında kutuyu kapat ve değerleri temizle
            }
            sendResponse({ status: "success", message: `Uzantı durumu: ${isActive ? 'Aktif' : 'Pasif'}` });
            return true; // Asenkron yanıt için
        }
    });
}
