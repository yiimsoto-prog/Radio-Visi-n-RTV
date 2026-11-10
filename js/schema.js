// ==============================================================
// SCHEMA.JS - DATOS ESTRUCTURADOS SCHEMA.ORG (CHURCH, LOCALBUSINESS, EVENT)
// RadioVisión RTV - Posicionamiento Local, Google Rich Results y SEO Dinámico
// Sede Central: Challhuahuacho, Apurímac (-14.120528, -72.250722)
// ==============================================================

const CHURCH_AND_RADIO_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Church", "LocalBusiness", "Place"],
      "@id": "https://radiovisionrtv.com/#church",
      "name": "IMCOTNV - Iglesia Misionera Casa de Oración para Todas las Naciones",
      "alternateName": "Iglesia Misionera Casa de Oración para Todas las Naciones - IMCOTNV",
      "slogan": "Oración • Palabra • Misión",
      "url": "https://radiovisionrtv.com",
      "logo": "https://radiovisionrtv.com/img/logo-iglesia.jpg",
      "image": "https://radiovisionrtv.com/img/templo-central.jpg",
      "description": "Comunidad Cristiana Evangélica Pentecostal comprometida con la proclamación del Evangelio a toda nación: Oración • Palabra • Misión en Challhuahuacho, Apurímac.",
      "telephone": "+51932028894",
      "email": "contacto@radiovisionrtv.com",
      "priceRange": "Gratuito",
      "currenciesAccepted": "PEN",
      "paymentAccepted": "Donaciones Voluntarias",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "03000, Challhuahuacho 03261",
        "addressLocality": "Challhuahuacho",
        "addressRegion": "Apurímac",
        "postalCode": "03261",
        "addressCountry": "PE"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-14.120528",
        "longitude": "-72.250722"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Wednesday"],
          "opens": "19:00",
          "closes": "21:00",
          "description": "Culto de Oración y Estudio Doctrinal Bíblico"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday"],
          "opens": "18:30",
          "closes": "20:30",
          "description": "Culto Juvenil y Alabanza"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Sunday"],
          "opens": "10:00",
          "closes": "12:30",
          "description": "Escuela Bíblica Dominical y Culto de Alabanza"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Sunday"],
          "opens": "18:00",
          "closes": "20:30",
          "description": "Gran Culto Evangelístico y Misionero Central"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/radiovisionrtv",
        "https://www.youtube.com/@radiovisionrtv2020",
        "https://wa.me/51932028894"
      ]
    },
    {
      "@type": ["RadioStation", "Organization"],
      "@id": "https://radiovisionrtv.com/#radiostation",
      "name": "Radio Visión RTV",
      "alternateName": "Radio Visión Cristiana 24 Horas",
      "url": "https://radiovisionrtv.com",
      "logo": "https://radiovisionrtv.com/img/logo-radio.jpg",
      "broadcastDisplayName": "Radio Visión RTV 24/7",
      "genre": [
        "Música Cristiana",
        "Alabanza y Adoración",
        "Prédicas y Sermones Bíblicos",
        "Oración y Consejería Pastoral",
        "Estudio Bíblico"
      ],
      "inLanguage": "es",
      "potentialAction": {
        "@type": "ListenAction",
        "target": [
          {
            "@type": "EntryPoint",
            "urlTemplate": "https://radiovisionrtv.com/#radiovision",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
              "http://schema.org/AndroidPlatform",
              "http://schema.org/IOSPlatform"
            ]
          }
        ],
        "expectsAcceptanceOf": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "PEN",
          "category": "Free"
        }
      }
    },
    // Eventos Semanales y Cultos Congregacionales
    {
      "@type": "Event",
      "@id": "https://radiovisionrtv.com/#culto-miercoles",
      "name": "Culto de Avivamiento, Alabanza y Sana Doctrina",
      "description": "Servicio de oración congregacional, cánticos espirituales y exposición bíblica de la Palabra de Dios.",
      "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "startDate": "2026-10-21T19:00:00-05:00",
      "endDate": "2026-10-21T21:00:00-05:00",
      "location": [
        {
          "@type": "Place",
          "name": "Templo Central IMCOTNV Challhuahuacho",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Challhuahuacho",
            "addressRegion": "Apurímac",
            "addressCountry": "PE"
          }
        },
        {
          "@type": "VirtualLocation",
          "url": "https://radiovisionrtv.com/#eventos"
        }
      ],
      "organizer": {
        "@type": "Organization",
        "name": "RadioVisión RTV",
        "url": "https://radiovisionrtv.com"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "PEN",
        "availability": "https://schema.org/InStock",
        "url": "https://radiovisionrtv.com/#eventos"
      }
    },
    {
      "@type": "Event",
      "@id": "https://radiovisionrtv.com/#culto-dominical",
      "name": "Gran Culto Evangelístico Dominical",
      "description": "Celebración dominical con predicación expositiva, ministración y transmisión radial en directo.",
      "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "startDate": "2026-10-25T18:00:00-05:00",
      "endDate": "2026-10-25T20:30:00-05:00",
      "location": [
        {
          "@type": "Place",
          "name": "Templo Central RadioVisión RTV",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Challhuahuacho",
            "addressRegion": "Apurímac",
            "addressCountry": "PE"
          }
        },
        {
          "@type": "VirtualLocation",
          "url": "https://radiovisionrtv.com/#eventos"
        }
      ],
      "organizer": {
        "@type": "Organization",
        "name": "RadioVisión RTV",
        "url": "https://radiovisionrtv.com"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "PEN",
        "availability": "https://schema.org/InStock",
        "url": "https://radiovisionrtv.com/#eventos"
      }
    }
  ]
};

/**
 * Inserta o actualiza el bloque de datos estructurados en el DOM
 */
function injectSchemaJsonLd() {
  let scriptEl = document.getElementById('schema-jsonld-church-radio');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'schema-jsonld-church-radio';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(CHURCH_AND_RADIO_SCHEMA, null, 2);
}

/**
 * Actualiza dinámicamente las etiquetas Open Graph y Twitter Cards
 * para compartir prédicas, noticias o testimonios con vista previa perfecta
 * @param {Object} meta Metadatos: { title, description, image, url, type }
 */
function updateDynamicSEO(meta = {}) {
  if (typeof document === 'undefined') return;

  const defaultTitle = 'RadioVisión RTV - Ministerio Radial y Misionero Pentecostal | Transmisión 24/7';
  const defaultDesc = 'Escucha la señal en vivo 24/7, participa en nuestros cultos, lee la Biblia y edifícate con la sana doctrina.';
  const defaultImg = 'https://radiovisionrtv.com/img/logo-radio.jpg';
  const defaultUrl = 'https://radiovisionrtv.com/';

  const title = meta.title ? `${meta.title} | RadioVisión RTV` : defaultTitle;
  const desc = meta.description || defaultDesc;
  const img = meta.image || defaultImg;
  const url = meta.url || defaultUrl;

  // Actualizar título de la ventana
  document.title = title;

  // Actualizar Meta Description estándar
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);

  // Actualizar Open Graph (Facebook, WhatsApp, Telegram, LinkedIn)
  const ogProps = {
    'og:title': title,
    'og:description': desc,
    'og:image': img,
    'og:url': url,
    'og:type': meta.type || 'website'
  };

  for (const [prop, val] of Object.entries(ogProps)) {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  }

  // Actualizar Twitter Cards
  const twitterProps = {
    'twitter:title': title,
    'twitter:description': desc,
    'twitter:image': img,
    'twitter:card': 'summary_large_image'
  };

  for (const [name, val] of Object.entries(twitterProps)) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  }
}

/**
 * Actualiza SEO dinámicamente al abrir o reproducir un podcast/prédica
 */
function updateSermonSEO(sermon) {
  if (!sermon) return;
  updateDynamicSEO({
    title: sermon.title || 'Prédica Bíblica',
    description: sermon.desc || (sermon.preacher ? `Mensaje de la Palabra de Dios por ${sermon.preacher}` : 'Mensaje bíblico y edificación espiritual.'),
    image: sermon.imageUrl || sermon.img || 'https://radiovisionrtv.com/img/logo-radio.jpg',
    url: `https://radiovisionrtv.com/#podcasts`,
    type: 'article'
  });
}

/**
 * Actualiza SEO dinámicamente al compartir un testimonio
 */
function updateTestimonySEO(testimony) {
  if (!testimony) return;
  updateDynamicSEO({
    title: `Testimonio de Fe: ${testimony.author || 'Hermano en Cristo'}`,
    description: (testimony.text || 'Dios ha hecho grandes cosas en nuestras vidas. Lee este testimonio de fe y gloria a Dios.').slice(0, 160) + '...',
    url: 'https://radiovisionrtv.com/#testimonios',
    type: 'article'
  });
}

// Inicializar en navegador
if (typeof window !== 'undefined') {
  window.CHURCH_AND_RADIO_SCHEMA = CHURCH_AND_RADIO_SCHEMA;
  window.injectSchemaJsonLd = injectSchemaJsonLd;
  window.updateDynamicSEO = updateDynamicSEO;
  window.updateSermonSEO = updateSermonSEO;
  window.updateTestimonySEO = updateTestimonySEO;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSchemaJsonLd);
  } else {
    injectSchemaJsonLd();
  }
}
