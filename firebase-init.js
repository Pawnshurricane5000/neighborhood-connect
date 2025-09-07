<<<<<<< HEAD
// Firebase initialization
import { auth, provider } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

// Make Firebase functions available globally
window.auth = auth;
window.provider = provider;
window.signInWithPopup = signInWithPopup;
window.onAuthStateChanged = onAuthStateChanged;

console.log('Firebase loaded successfully');
=======
// Firebase initialization
import { auth, provider } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

// Make Firebase functions available globally
window.auth = auth;
window.provider = provider;
window.signInWithPopup = signInWithPopup;
window.onAuthStateChanged = onAuthStateChanged;

console.log('Firebase loaded successfully');
>>>>>>> 3dc65e7cba26a703c63e38d82ccff2cfbce780e2
