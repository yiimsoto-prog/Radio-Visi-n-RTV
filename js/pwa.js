// ==============================================================
// PWA.JS - CONTROL INTEGRAL DE PWA, SERVICE WORKER E INSTALACIÓN
// IMCOTNV & RadioVisión RTV - Versión 2.1.0 Profesional
// ==============================================================

const APP_VERSION = '2.5.1';
let swRegistration = null;
let deferredPrompt = null;
let _hasPwaModalOpened = false;
let _updateCheckTimer = null;

/**
 * Detecta si el usuario está navegando desde un dispositivo iOS (iPhone, iPad o iPod)
 */
function isIOS() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detecta si la aplicación ya está instalada y ejecutándose en modo autónomo (Standalone / PWA)
 */
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Verifica si hay formularios administrativos abiertos para evitar pérdidas involuntarias de datos
 */
function isFormCurrentlyEditing() {
  const modalIds = [
    'adminModal',
    'adminUniversalModal',
    'adminUserModal',
    'adminVisitorModal',
    'bulkEditModal',
    'infoItemModal',
    'doctrineModal',
    'itemModal',
    'bannerItemModal'
  ];

  for (const id of modalIds) {
    const m = document.getElementById(id);
    if (m && !m.classList.contains('hidden')) {
      return true;
    }
  }
  return false;
}

/**
 * Captura del evento nativo beforeinstallprompt de Chromium
 */
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que el navegador muestre su mini-infobar por defecto
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Evento beforeinstallprompt capturado y listo para usar.');

  // Asegurar que los botones de instalación sean visibles
  syncPwaUIState();

  // Mostrar el banner flotante sutil después de 5 segundos de navegación si no se ha descartado
  scheduleFloatingPrompt(5000);
});

/**
 * Detecta cuando el usuario ha completado la instalación exitosa de la PWA
 */
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  console.log('[PWA] ¡La aplicación fue instalada exitosamente en el dispositivo!');
  if (typeof window.showToast === 'function') {
    window.showToast("✓ ¡Aplicación instalada exitosamente en tu pantalla de inicio!", "success");
  }
  dismissPwaFloatingPrompt(true);
  closePwaInstallModal();
  syncPwaUIState();
});

/**
 * Sincroniza la visibilidad de los botones de instalación en Header, Menú Móvil y Modal
 */
function syncPwaUIState() {
  const pwaBtn = document.getElementById('pwaInstallBtn');
  const pwaMobBtn = document.getElementById('pwaMobInstallBtn');
  const nativeActionBox = document.getElementById('pwaNativeActionBox');
  const iosGuideBox = document.getElementById('pwaIosGuideBox');
  const desktopGuideBox = document.getElementById('pwaDesktopGuideBox');

  const installed = isStandalone();

  if (installed) {
    // Si ya está instalada, ocultar el botón o mostrar distintivo
    if (pwaBtn) {
      pwaBtn.title = "App Oficial Instalada";
      pwaBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-300"></i><span class="hidden sm:inline">App Activa</span><span class="sm:hidden text-[11px]">✓</span>';
      pwaBtn.className = "inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-700/80 text-white font-extrabold text-xs shadow-sm shrink-0 gap-1.5 cursor-default";
      pwaBtn.onclick = function() {
        if (typeof window.showToast === 'function') {
          window.showToast("¡Ya estás utilizando la App instalada de IMCOTNV & RadioVisión!", "info");
        }
      };
    }
    if (pwaMobBtn) {
      pwaMobBtn.classList.add('hidden');
    }
    dismissPwaFloatingPrompt(true);
    return;
  }

  // Si no está instalada, adaptar las guías del modal según el sistema operativo
  if (isIOS()) {
    if (nativeActionBox) nativeActionBox.classList.add('hidden');
    if (iosGuideBox) iosGuideBox.classList.remove('hidden');
    if (desktopGuideBox) desktopGuideBox.classList.add('hidden');
  } else if (deferredPrompt) {
    if (nativeActionBox) nativeActionBox.classList.remove('hidden');
    if (iosGuideBox) iosGuideBox.classList.add('hidden');
    if (desktopGuideBox) desktopGuideBox.classList.add('hidden');
  } else {
    // Computadora u otros navegadores
    if (nativeActionBox) nativeActionBox.classList.remove('hidden');
    if (iosGuideBox) iosGuideBox.classList.add('hidden');
    if (desktopGuideBox) desktopGuideBox.classList.remove('hidden');
  }
}

/**
 * Función principal llamada por los botones "Instalar App"
 */
function installPWA() {
  if (isStandalone()) {
    if (typeof window.showToast === 'function') {
      window.showToast("La aplicación ya está instalada en tu pantalla de inicio.", "info");
    }
    return;
  }

  // Si tenemos el prompt nativo listo de Android / Chrome, dispararlo de inmediato
  if (deferredPrompt) {
    executePwaNativeInstall();
    return;
  }

  // Si es iOS o navegador sin prompt activo, abrir el modal con la guía visual ilustrada
  openPwaInstallModal();
}
window.installPWA = installPWA;

/**
 * Ejecuta el prompt nativo de Chromium
 */
function executePwaNativeInstall() {
  if (!deferredPrompt) {
    // Si no está disponible aún el prompt nativo, mostrar el modal explicativo
    openPwaInstallModal();
    return;
  }

  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult && choiceResult.outcome === 'accepted') {
      console.log('[PWA] El usuario aceptó instalar la aplicación.');
      if (typeof window.showToast === 'function') {
        window.showToast("Instalando IMCOTNV & RadioVisión en tu dispositivo... 📻", "info");
      }
      dismissPwaFloatingPrompt(true);
      closePwaInstallModal();
    } else {
      console.log('[PWA] El usuario canceló la instalación.');
    }
    deferredPrompt = null;
    syncPwaUIState();
  }).catch((err) => {
    console.warn('[PWA] Error en prompt:', err);
    openPwaInstallModal();
  });
}
window.executePwaNativeInstall = executePwaNativeInstall;

/**
 * Abre el modal visual de instalación adaptado al sistema del usuario
 */
function openPwaInstallModal() {
  _hasPwaModalOpened = true;
  syncPwaUIState();
  const modal = document.getElementById('pwaInstallGuideModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}
window.openPwaInstallModal = openPwaInstallModal;

/**
 * Cierra el modal de instalación
 */
function closePwaInstallModal() {
  const modal = document.getElementById('pwaInstallGuideModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}
window.closePwaInstallModal = closePwaInstallModal;

/**
 * Programa la aparición del banner flotante sutil
 */
function scheduleFloatingPrompt(delayMs = 6000) {
  if (isStandalone()) return;

  const dismissedUntil = localStorage.getItem('rtv_pwa_dismissed_until');
  if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
    return;
  }

  setTimeout(() => {
    if (!isStandalone() && !_hasPwaModalOpened) {
      const banner = document.getElementById('pwaFloatingPrompt');
      if (banner) {
        banner.classList.remove('hidden');
      }
    }
  }, delayMs);
}

/**
 * Descarta el banner flotante por 7 días o de forma permanente
 */
function dismissPwaFloatingPrompt(permanent = false) {
  const banner = document.getElementById('pwaFloatingPrompt');
  if (banner) {
    banner.classList.remove('toast-animate-in');
    banner.classList.add('toast-animate-out');
    setTimeout(() => {
      banner.classList.add('hidden');
      banner.classList.remove('toast-animate-out');
    }, 350);
  }

  const duration = permanent ? 365 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem('rtv_pwa_dismissed_until', (Date.now() + duration).toString());
}
window.dismissPwaFloatingPrompt = dismissPwaFloatingPrompt;

/**
 * Inicializa el Service Worker con detección de versiones, skipWaiting y Form Guard
 */
function initPWA() {
  syncPwaUIState();

  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker no soportado en este navegador.');
    return;
  }

  // Protección ante cierres accidentales cuando hay formularios en edición (Form Guard)
  window.addEventListener('beforeunload', (e) => {
    if (isFormCurrentlyEditing()) {
      e.preventDefault();
      e.returnValue = 'Tienes cambios o formularios abiertos en el panel administrativo. ¿Seguro que deseas salir?';
      return e.returnValue;
    }
  });

  // Registro del Service Worker
  navigator.serviceWorker.register('./sw.js')
    .then((registration) => {
      swRegistration = registration;
      console.log(`[PWA v${APP_VERSION}] Service Worker activo en:`, registration.scope);

      // Si ya hay un worker en espera de activarse
      if (registration.waiting) {
        showUpdateNotification(registration.waiting);
      }

      // Detectar cuando se descarga un nuevo Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification(newWorker);
          }
        });
      });

      // Polling de actualizaciones (cada 30 min + al recuperar foco / online)
      const checkForUpdates = () => {
        if (!registration || typeof registration.update !== 'function') return;
        registration.update().catch(() => {});
      };
      if (_updateCheckTimer) clearInterval(_updateCheckTimer);
      _updateCheckTimer = setInterval(checkForUpdates, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdates();
      });
      window.addEventListener('online', checkForUpdates);
      // Primera verificación diferida
      setTimeout(checkForUpdates, 15000);
    })
    .catch((err) => {
      console.warn('[PWA] Error registrando Service Worker:', err);
    });

  // Recarga automática controlada cuando un nuevo Service Worker toma el control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      if (isFormCurrentlyEditing()) {
        console.log('[PWA] Actualización pospuesta porque hay un formulario en edición.');
        return;
      }
      refreshing = true;
      window.location.reload();
    }
  });

  // Detección de conectividad online/offline
  window.addEventListener('online', () => {
    if (typeof window.showToast === 'function') {
      window.showToast("✓ Conexión a Internet restablecida", "success");
    }
  });

  window.addEventListener('offline', () => {
    if (typeof window.showToast === 'function') {
      window.showToast("Modo Offline activo: La Biblia y recursos guardados siguen disponibles sin internet.", "info");
    }
  });

  // Programar evaluación del prompt flotante después de cargar
  scheduleFloatingPrompt(6000);
}
window.initPWA = initPWA;

/**
 * Muestra el banner interactivo de nueva versión disponible
 */
function showUpdateNotification(worker) {
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.className = 'fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] max-w-sm w-full bg-[#0c152e] border-2 border-yellow-400/80 rounded-2xl p-4 shadow-2xl text-white toast-animate-in flex flex-col gap-3 backdrop-blur-md';

  banner.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">
        <i class="fa-solid fa-arrows-rotate animate-spin"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-extrabold text-white flex items-center gap-2">
          <span>Actualización disponible</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] bg-yellow-400 text-slate-950 font-black">v${APP_VERSION}</span>
        </h4>
        <div class="text-xs text-slate-300 mt-1.5 space-y-0.5">
          <p>Hay una versión nueva de RadioVisión RTV / IMCOTNV.</p>
          <p class="text-amber-300 font-medium">Actualiza para recibir correcciones y contenido reciente.</p>
        </div>
      </div>
      <button id="pwa-update-close" class="text-slate-400 hover:text-white p-1 text-sm transition-colors" title="Descartar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="flex items-center gap-2 pt-1 border-t border-slate-700/60">
      <button id="pwa-update-btn" class="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
        <i class="fa-solid fa-cloud-arrow-down"></i>
        <span>Actualizar ahora</span>
      </button>
      <button id="pwa-update-later" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors">
        Más tarde
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  const updateBtn = banner.querySelector('#pwa-update-btn');
  updateBtn.addEventListener('click', () => {
    if (isFormCurrentlyEditing()) {
      const confirmForce = confirm("Tienes un formulario abierto. Si actualizas ahora podrías perder cambios no guardados. ¿Deseas actualizar de todos modos?");
      if (!confirmForce) return;
    }
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Actualizando...';
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });

  const dismiss = () => {
    banner.classList.remove('toast-animate-in');
    banner.classList.add('toast-animate-out');
    setTimeout(() => banner.remove(), 350);
  };

  banner.querySelector('#pwa-update-close')?.addEventListener('click', dismiss);
  banner.querySelector('#pwa-update-later')?.addEventListener('click', dismiss);
}
window.showUpdateNotification = showUpdateNotification;

// Auto-inicialización al cargar la ventana
if (typeof window !== 'undefined') {
  window.APP_VERSION = APP_VERSION;
  window.initPWA = initPWA;
  window.isFormCurrentlyEditing = isFormCurrentlyEditing;
  window.isStandalone = isStandalone;
  window.isIOS = isIOS;

  window.addEventListener('load', () => {
    try {
      initPWA();
    } catch(e) {
      console.warn('[PWA] Error iniciando PWA:', e);
    }
  });
}
