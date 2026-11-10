// ==============================================================
// FIREBASE-CONFIG.JS - INTEGRACIÓN MODULAR CON GOOGLE FIREBASE SDK v10
// RadioVisión RTV - Autenticación Oficial por Correo y Contraseña
// SDKs: https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js
//       https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js
//       https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js
// ==============================================================

// Configuración Oficial de Firebase para RadioVisión RTV
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_QwdOdhREsaEWsSZ0YvAwSndwlbjolw8",
  authDomain: "radiovision-rtv-327c3.firebaseapp.com",
  projectId: "radiovision-rtv-327c3",
  storageBucket: "radiovision-rtv-327c3.firebasestorage.app",
  messagingSenderId: "1069672953293",
  appId: "1:1069672953293:web:4d073499dad4a5ba850084"
};

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let isFirebaseInitialized = false;

// Referencias a funciones SDK dinámicas
let _modularAppSDK = null;
let _modularAuthSDK = null;
let _modularFirestoreSDK = null;

/**
 * Recupera la configuración de Firebase guardada o la por defecto
 */
function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem('rtv_firebase_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  if (typeof window !== 'undefined' && window.appData && window.appData.firebaseConfig) {
    return window.appData.firebaseConfig;
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Carga e inicializa de forma asíncrona y segura los módulos de Firebase v10
 */
async function loadModularFirebaseSDK() {
  if (isFirebaseInitialized) return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  try {
    const config = getSavedFirebaseConfig();

    // Si el SDK oficial de Firebase ya está cargado en window.firebase (scripts.html), reutilizarlo sin duplicar descarga (~400 KB ahorrados)
    if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.initializeApp === 'function') {
      if (!window.firebase.apps.length) {
        firebaseApp = window.firebase.initializeApp(config);
      } else {
        firebaseApp = window.firebase.app();
      }
      if (typeof window.firebase.auth === 'function') {
        firebaseAuth = window.firebase.auth();
      }
      if (typeof window.firebase.firestore === 'function') {
        firestoreDb = window.firebase.firestore();
      }
      isFirebaseInitialized = true;
      window.firebaseApp = firebaseApp;
      window.firebaseAuth = firebaseAuth;
      window.firestoreDb = firestoreDb;
      window.firestoreModularDb = firestoreDb;
      if (typeof window.initFirebaseAuthSessionListener === 'function') {
        window.initFirebaseAuthSessionListener();
      }
      return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth, isOffline: false };
    }

    _modularAppSDK = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    _modularAuthSDK = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    try {
      _modularFirestoreSDK = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    } catch (e) {
      console.warn("[Firebase] Firestore modular diferido:", e);
    }

    if (!_modularAppSDK.getApps().length) {
      firebaseApp = _modularAppSDK.initializeApp(config);
    } else {
      firebaseApp = _modularAppSDK.getApp();
    }

    if (_modularAuthSDK) {
      firebaseAuth = _modularAuthSDK.getAuth(firebaseApp);
    }
    if (_modularFirestoreSDK) {
      firestoreDb = _modularFirestoreSDK.getFirestore(firebaseApp);
    }

    isFirebaseInitialized = true;

    if (typeof window !== 'undefined') {
      window.firebaseApp = firebaseApp;
      window.firebaseAuth = firebaseAuth;
      window.firestoreModularDb = firestoreDb;
      window.firestoreDb = firestoreDb;
      if (typeof window.initFirebaseAuthSessionListener === 'function') {
        window.initFirebaseAuthSessionListener();
      }
    }
    return { app: firebaseApp, db: window.firestoreDb || firestoreDb, auth: firebaseAuth, isOffline: false };
  } catch (err) {
    console.warn('[Firebase Modular] Modo sin conexión o local:', err);
    return { app: null, db: null, auth: null, isOffline: true };
  }
}

/**
 * Inicializa Google Firebase Modular v10 con soporte completo para Auth y Firestore
 * @param {Object} [customConfig] Configuración opcional
 */
function initFirebaseModular(customConfig = null) {
  loadModularFirebaseSDK();
  return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth, isOffline: !isFirebaseInitialized };
}

/**
 * Obtiene la instancia activa de Firebase Auth (SDK Modular v10)
 * @returns {any} Instancia de Firebase Auth
 */
function getAuth() {
  if (!firebaseAuth && !isFirebaseInitialized) {
    loadModularFirebaseSDK();
  }
  return firebaseAuth;
}

/**
 * Obtiene la instancia activa de Firestore (SDK Modular v10)
 * @returns {any} Instancia de Firestore DB
 */
function getDb() {
  if (!firestoreDb && !isFirebaseInitialized) {
    loadModularFirebaseSDK();
  }
  return firestoreDb;
}

/**
 * Inicia sesión con correo y contraseña usando Firebase Auth SDK Modular v10
 */
async function signInWithEmailAndPassword(auth, email, password) {
  if (!_modularAuthSDK) {
    await loadModularFirebaseSDK();
  }
  if (_modularAuthSDK && typeof _modularAuthSDK.signInWithEmailAndPassword === 'function') {
    const targetAuth = auth || firebaseAuth || _modularAuthSDK.getAuth();
    return await _modularAuthSDK.signInWithEmailAndPassword(targetAuth, email, password);
  }
  // Fallback si firebase compat global está disponible
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    return await window.firebase.auth().signInWithEmailAndPassword(email, password);
  }
  throw new Error("El servicio Firebase Auth no está disponible en este momento.");
}

/**
 * Cierra la sesión activa en Firebase Auth
 */
async function signOut(auth) {
  if (!_modularAuthSDK) {
    await loadModularFirebaseSDK();
  }
  if (_modularAuthSDK && typeof _modularAuthSDK.signOut === 'function') {
    const targetAuth = auth || firebaseAuth || _modularAuthSDK.getAuth();
    return await _modularAuthSDK.signOut(targetAuth);
  }
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    return await window.firebase.auth().signOut();
  }
}

/**
 * Observa cambios en el estado de autenticación (sesión activa/cerrada)
 */
function onAuthStateChanged(auth, callback) {
  if (_modularAuthSDK && typeof _modularAuthSDK.onAuthStateChanged === 'function') {
    const targetAuth = auth || firebaseAuth || _modularAuthSDK.getAuth();
    return _modularAuthSDK.onAuthStateChanged(targetAuth, callback);
  }
  // Si aún está cargando dinámicamente, programar listener
  loadModularFirebaseSDK().then(() => {
    if (_modularAuthSDK && typeof _modularAuthSDK.onAuthStateChanged === 'function') {
      const targetAuth = auth || firebaseAuth || _modularAuthSDK.getAuth();
      _modularAuthSDK.onAuthStateChanged(targetAuth, callback);
    } else if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
      window.firebase.auth().onAuthStateChanged(callback);
    }
  }).catch(() => {});
}

/**
 * Envía correo de recuperación de contraseña oficial mediante Firebase Auth
 * @param {any} auth Instancia de Auth
 * @param {string} email Correo registrado del administrador
 */
async function sendPasswordResetEmail(auth, email) {
  if (!_modularAuthSDK) {
    await loadModularFirebaseSDK();
  }
  if (_modularAuthSDK && typeof _modularAuthSDK.sendPasswordResetEmail === 'function') {
    const targetAuth = auth || firebaseAuth || _modularAuthSDK.getAuth();
    return await _modularAuthSDK.sendPasswordResetEmail(targetAuth, email);
  }
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    return await window.firebase.auth().sendPasswordResetEmail(email);
  }
  throw new Error("El servicio Firebase Auth no está disponible para recuperación de contraseña.");
}

// Iniciar carga en segundo plano
if (typeof window !== 'undefined') {
  window.DEFAULT_FIREBASE_CONFIG = DEFAULT_FIREBASE_CONFIG;
  window.getSavedFirebaseConfig = getSavedFirebaseConfig;
  window.initFirebaseModular = initFirebaseModular;
  window.loadModularFirebaseSDK = loadModularFirebaseSDK;
  window.getAuth = getAuth;
  window.getDb = getDb;
  window.signInWithEmailAndPassword = signInWithEmailAndPassword;
  window.signOut = signOut;
  window.onAuthStateChanged = onAuthStateChanged;
  window.sendPasswordResetEmail = sendPasswordResetEmail;
  window.firebaseSendPasswordResetEmail = sendPasswordResetEmail;
  window.getFirebaseAuth = getAuth;
  window.firebaseSignInWithEmailAndPassword = signInWithEmailAndPassword;
  window.firebaseSignOut = signOut;
  window.firebaseOnAuthStateChanged = onAuthStateChanged;

  // Iniciar conexión inmediatamente
  loadModularFirebaseSDK();
}
