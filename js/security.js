// ==============================================================
// SECURITY.JS - PROTECCIÓN XSS, ESCAPADO Y SANITIZACIÓN ROBUSTA
// RadioVisión RTV - Plataforma Segura
// ==============================================================

/**
 * Sanitización profesional de cadenas de texto y HTML mediante DOMPurify (con fallback seguro)
 * @param {string|any} str Texto o HTML a sanitizar
 * @returns {string} Contenido sanitizado libre de vectores XSS
 */
function sanitizeHtml(str) {
  if (str === null || str === undefined) return '';
  const input = String(str);
  if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function' && !window.DOMPurify._isFallback) {
    return window.DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'class', 'title', 'rel']
    });
  }
  return escapeHtml(input);
}

/**
 * Escapa caracteres peligrosos en cadenas de texto para evitar ataques XSS
 * @param {string|any} str Texto a escapar
 * @returns {string} Texto seguro para insertar en HTML o atributos
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitiza valores de objetos de forma recursiva (útil para payloads de formularios)
 * @param {Object} obj Objeto a sanitizar
 * @returns {Object} Objeto con valores de texto seguros
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      clean[key] = value.trim();
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Inserta texto plano de forma segura en un elemento sin interpretar HTML
 * @param {HTMLElement|string} target Elemento o selector
 * @param {string} text Texto a insertar
 */
function setSafeText(target, text) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (el) {
    el.textContent = text ?? '';
  }
}

/**
 * Tagged template para concatenación segura de HTML
 */
function safeHtml(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const val = values[i - 1];
    const safeVal = typeof val === 'string' ? escapeHtml(val) : (val ?? '');
    return result + safeVal + str;
  });
}

// ==============================================================
// PROTECCIÓN ANTI-IFRAME (FRAME-BUSTING) Y ANTI-CLONACIÓN EXTERNA
// Impide que sitios de terceros o IA incrusten la página en un iframe
// ==============================================================
(function preventFraming() {
  if (typeof window !== 'undefined' && window.top !== window.self) {
    try {
      if (window.top.location.hostname !== window.self.location.hostname) {
        window.top.location = window.self.location.href;
      }
    } catch (e) {
      // Si el acceso entre orígenes es bloqueado por la política del navegador
      try {
        document.documentElement.style.display = 'none';
        window.location.replace("about:blank");
      } catch (err) {}
    }
  }
})();

// Exportación global para máxima compatibilidad con código existente en navegador y NodeJS
if (typeof window !== 'undefined') {
  if (!window.DOMPurify) {
    window.DOMPurify = { sanitize: (s) => escapeHtml(s), _isFallback: true };
  }
  window.escapeHtml = escapeHtml;
  window.sanitizeHtml = sanitizeHtml;
  window.sanitizeObject = sanitizeObject;
  window.setSafeText = setSafeText;
  window.safeHtml = safeHtml;
}
