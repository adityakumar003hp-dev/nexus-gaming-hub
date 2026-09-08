export const firebaseConfig = {
  projectId: "centered-osprey-478813-u9",
  appId: "1:924451548640:web:ffc882ce9e0c7b98ee4f85",
  apiKey: "AIzaSyDyTpj6wu6lSwHk44fh1xjYRxaIa1J0Bl8",
  authDomain: "centered-osprey-478813-u9.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-nexus20-2cdb8f0d-6145-4f13-9c84-052cb6c08edc",
  storageBucket: "centered-osprey-478813-u9.firebasestorage.app",
  messagingSenderId: "924451548640"
};

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

let appInstance = null;
let dbInstance = null;
let authInstance = null;

if (typeof window !== 'undefined' && window.db) {
  appInstance = window.app;
  dbInstance = window.db;
  authInstance = window.auth;
} else {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(appInstance);
    if (typeof window !== 'undefined') {
      window.app = appInstance;
      window.db = dbInstance;
      window.auth = authInstance;
    }
  } catch (e) {
    console.warn("firebase_config standalone initialization notice:", e);
    if (typeof window !== 'undefined') {
      appInstance = window.app || null;
      dbInstance = window.db || null;
      authInstance = window.auth || null;
    }
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
