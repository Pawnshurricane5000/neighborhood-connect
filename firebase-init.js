// Firebase initialization
import { auth, provider } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

// Make Firebase functions available globally
window.auth = auth;
window.provider = provider;
window.signInWithPopup = signInWithPopup;
window.onAuthStateChanged = onAuthStateChanged;

console.log('Firebase loaded successfully');
