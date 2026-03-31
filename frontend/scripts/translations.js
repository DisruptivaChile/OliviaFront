// =============================================
// frontend/scripts/translations.js
// Traducción automática con MyMemory API
// Gratuita sin registro (1000 palabras/día)
// Con email: 10,000 palabras/día
// =============================================

const MANUAL_TRANSLATIONS = {
    'es': {
        'preordenar': 'PREORDENAR ',
        'conocenos': 'CONÓCENOS',
        'nombres': 'Nombres',
        'apellidos': 'Apellidos',
        'correo_electronico': 'Correo electrónico',
        'genero': 'Género',
        'mujer': 'Mujer',
        'hombre': 'Hombre',
        'otro': 'Otro',
        'enviar': 'ENVIAR',
        'ver-terminos': 'VER TÉRMINOS Y CONDICIONES',
        'telefono': 'Teléfono',
        'ciudad': 'Ciudad',
        'direccion-envio': 'Dirección de envío',
        'region': 'Región',
        'pais': 'País',
        'notas-adicionales': 'Notas adicionales',
        'pagar-mercadopago': 'PAGAR CON MERCADOPAGO',
        'pago-seguro': 'Pago 100% seguro — tarjetas, débito, transferencia y más',
        'finalizar-compra': 'Finalizar compra',
        'campo-obligatorio': '*Campos obligatorios',
        'iniciar-sesion': 'Iniciar Sesión',
        'inicio': 'Inicio',
        'catalogo': 'Catálogo'
    },
    'en': {
        'preordenar': 'PRE-ORDER',
        'conocenos': 'ABOUT US',
        'nombres': 'Names',
        'apellidos': 'Last Names',
        'correo_electronico': 'Email Address',
        'genero': 'Gender',
        'mujer': 'Woman',
        'hombre': 'Man',
        'otro': 'Other',
        'enviar': 'SUBMIT',
        'ver-terminos': 'VIEW TERMS AND CONDITIONS',
        'telefono': 'Phone',
        'ciudad': 'City',
        'direccion-envio': 'Shipping Address',
        'region': 'Region',
        'pais': 'Country',
        'notas-adicionales': 'Additional Notes',
        'pagar-mercadopago': 'PAY WITH MERCADOPAGO',
        'pago-seguro': '100% secure payment — credit cards, debit, transfer and more',
        'finalizar-compra': 'End purchase',
        'campo-obligatorio': '*Required fields',
        'iniciar-sesion': 'Log In',
        'inicio': 'Home',
        'catalogo': 'Catalog'
    }
};

// ── Configuración ─────────────────────────────────────────────────────
// Opcional: agrega tu email para mayor límite diario
const MYMEMORY_EMAIL = 'disruptiva.testings@gmail.com'; // Ej: 'tu@email.com'

// Términos que nunca deben traducirse
const PROTECTED_TERMS = ['Olivia Merino', 'Olivia', 'Merino'];

function protegerTerminos(text) {
    let result = text;
    PROTECTED_TERMS.forEach((term, i) => {
        result = result.replace(new RegExp(term, 'gi'), `##${i}##`);
    });
    return result;
}

function restaurarTerminos(text) {
    let result = text;
    PROTECTED_TERMS.forEach((term, i) => {
        result = result.replace(new RegExp(`##${i}##`, 'g'), term);
    });
    return result;
}

const CACHE_PREFIX  = 'olivia_translate_';
const CACHE_VERSION = 'v2_';

// ── Estado ────────────────────────────────────────────────────────────
let currentLanguage = localStorage.getItem('oliviaLanguage') || 'es';
let isTranslating   = false;

// ── Datos de banderas ─────────────────────────────────────────────────
const flagData = {
    es: { src: 'https://res.cloudinary.com/dzi3s9oof/image/upload/v1770054456/cl_mmwm5r.svg', label: 'Español' },
    en: { src: 'https://res.cloudinary.com/dzi3s9oof/image/upload/v1770054456/us_ieog1r.svg', label: 'English' }
};


// ── Cache helpers ─────────────────────────────────────────────────────
function getCacheKey(text, targetLang) {
    const shortText = text.trim().substring(0, 60).replace(/\s+/g, '_');
    try {
        return CACHE_PREFIX + CACHE_VERSION + targetLang + '_' + btoa(unescape(encodeURIComponent(shortText))).substring(0, 30);
    } catch {
        return CACHE_PREFIX + CACHE_VERSION + targetLang + '_' + shortText.substring(0, 20);
    }
}

function getFromCache(text, targetLang) {
    try { return localStorage.getItem(getCacheKey(text, targetLang)); }
    catch { return null; }
}

function saveToCache(text, targetLang, translation) {
    try { localStorage.setItem(getCacheKey(text, targetLang), translation); }
    catch { clearOldCache(); }
}

function clearOldCache() {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_PREFIX + CACHE_VERSION)) {
            keysToDelete.push(key);
        }
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
}


// ── Traducir un texto via MyMemory API ───────────────────────────────
async function translateText(text, targetLang) {
    if (!text || !text.trim()) return text;
    if (targetLang === 'es') return text;

    const cached = getFromCache(text, targetLang);
    if (cached) return cached;

    try {
        const langPair = `es|${targetLang}`;
        const textoProtegido = protegerTerminos(text);
        let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoProtegido)}&langpair=${langPair}`;
        if (MYMEMORY_EMAIL) url += `&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;

        const res  = await fetch(url);
        if (!res.ok) throw new Error('MyMemory error: ' + res.status);

        const data = await res.json();

        // MyMemory devuelve 200 pero con código de error interno
        if (data.responseStatus !== 200) {
            throw new Error('MyMemory: ' + data.responseDetails);
        }

        const translated = restaurarTerminos(data.responseData.translatedText || text);
        saveToCache(text, targetLang, translated);
        return translated;

    } catch (err) {
        console.warn('⚠️ Error traduciendo:', err.message);
        return text;
    }
}


// ── Traducir todos los elementos [data-i18n] ──────────────────────────
async function translatePage(targetLang) {
    // === NUEVO: TRADUCCIÓN MANUAL PRIMERO ===
    const manualElements = document.querySelectorAll('[data-i18n]');
    manualElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (MANUAL_TRANSLATIONS[targetLang] && MANUAL_TRANSLATIONS[targetLang][key]) {
            // Guardamos el original si no existe para poder volver a 'es'
            if (!el.getAttribute('data-i18n-original')) {
                el.setAttribute('data-i18n-original', el.textContent.trim());
            }
            el.textContent = MANUAL_TRANSLATIONS[targetLang][key];
        }
    });

    // Si el idioma es español, restauramos originales y salimos
    if (targetLang === 'es') {
        document.querySelectorAll('[data-i18n-original]').forEach(el => {
            el.textContent = el.getAttribute('data-i18n-original');
        });
        document.querySelectorAll('[data-placeholder-original]').forEach(el => {
            el.placeholder = el.getAttribute('data-placeholder-original');
        });
        return;
    }

    // === EL RESTO DE TU LÓGICA DE API (MyMemory) ===
    const elements = Array.from(document.querySelectorAll(
        'h1, h2, h3, h4, h5, p, span, button, label, a, li, th, td'
    )).filter(el => {
        // Evitamos volver a procesar los que ya tradujimos manualmente
        if (el.hasAttribute('data-i18n')) return false; 
        
        const text = el.childNodes;
        const hasDirectText = Array.from(text).some(n => 
            n.nodeType === 3 && n.textContent.trim().length > 2
        );
        return hasDirectText && !el.closest('script, style, .fa, [data-no-translate]');
    });

    if (elements.length === 0) {
        // Aún si no hay elementos de texto largo, traducimos los placeholders
        await traducirPlaceholders(targetLang);
        return;
    }

    // ... (aquí sigue el resto de tu código de lotes/batch de MyMemory)
    mostrarIndicadorTraduccion(true);
    isTranslating = true;
    try {
        const BATCH_SIZE = 5;
        for (let i = 0; i < elements.length; i += BATCH_SIZE) {
            const batch = elements.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (el) => {
                // ... (tu código actual de translateText)
                if (!el.getAttribute('data-i18n-original')) {
                     el.setAttribute('data-i18n-original', el.textContent.trim());
                }
                const originalText = el.getAttribute('data-i18n-original');
                const translated = await translateText(originalText, targetLang);
                if (translated) el.textContent = translated;
            }));
        }
        await traducirPlaceholders(targetLang);
    } finally {
        isTranslating = false;
        mostrarIndicadorTraduccion(false);
    }
}

// Función auxiliar para no repetir código
async function traducirPlaceholders(targetLang) {
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    for (const el of inputs) {
        const original = el.getAttribute('data-placeholder-original') || el.placeholder;
        if (!el.getAttribute('data-placeholder-original')) {
            el.setAttribute('data-placeholder-original', original);
        }
        const translated = await translateText(original, targetLang);
        if (translated) el.placeholder = translated;
    }
}


// ── Indicador visual ──────────────────────────────────────────────────
function mostrarIndicadorTraduccion(mostrar) {
    let indicator = document.getElementById('translateIndicator');
    if (mostrar) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'translateIndicator';
            indicator.style.cssText =
                'position:fixed;bottom:1rem;right:1rem;z-index:9999;' +
                'background:#1a1a1a;color:#fff;padding:0.5rem 1rem;' +
                'border-radius:20px;font-size:0.78rem;font-family:Poppins,sans-serif;' +
                'display:flex;align-items:center;gap:0.5rem;' +
                'box-shadow:0 4px 15px rgba(0,0,0,0.2);';
            indicator.innerHTML =
                '<span style="width:10px;height:10px;border:2px solid #fff;' +
                'border-top-color:transparent;border-radius:50%;' +
                'animation:oliviaSpin 0.8s linear infinite;display:inline-block;"></span>' +
                ' Translating...';
            if (!document.getElementById('translateSpinStyle')) {
                const style = document.createElement('style');
                style.id = 'translateSpinStyle';
                style.textContent = '@keyframes oliviaSpin { to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    } else {
        if (indicator) indicator.style.display = 'none';
    }
}


// ── Actualizar UI del selector de banderas ────────────────────────────
function updateSelectorUI() {
    const mainImg    = document.getElementById('currentFlagImg');
    const optionImg  = document.getElementById('optionFlagImg');
    const optionBtn  = document.getElementById('langOptionBtn');
    const optionText = document.getElementById('optionText');

    if (!mainImg || !optionImg || !optionBtn) return;

    const otherLang = currentLanguage === 'es' ? 'en' : 'es';

    mainImg.src    = flagData[currentLanguage].src;
    mainImg.alt    = flagData[currentLanguage].label;

    optionImg.src          = flagData[otherLang].src;
    optionText.textContent = flagData[otherLang].label;
    optionBtn.setAttribute('data-lang', otherLang);
}


// ── Cambiar idioma ────────────────────────────────────────────────────
async function changeLanguage(lang) {
    if (isTranslating) return;
    currentLanguage = lang;
    localStorage.setItem('oliviaLanguage', lang);
    updateSelectorUI();
    await translatePage(lang);
}


// ── Helper t() para compatibilidad ───────────────────────────────────
function t(key) {
    const el = document.querySelector(`[data-i18n="${key}"]`);
    return el ? (el.getAttribute('data-i18n-original') || el.textContent) : key;
}


// ── Inicialización ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    updateSelectorUI();

    if (currentLanguage === 'en') {
        await translatePage('en');
    }

    const optionBtn = document.getElementById('langOptionBtn');
    if (optionBtn) {
        optionBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const nextLang = optionBtn.getAttribute('data-lang');
            await changeLanguage(nextLang);
        });
    }
});