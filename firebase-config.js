<<<<<<< HEAD
// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMxV_GVOxQbtKEA-XiuGzFKIIi1HBMTjk",
  authDomain: "neighbor-connect-2b315.firebaseapp.com",
  projectId: "neighbor-connect-2b315",
  storageBucket: "neighbor-connect-2b315.firebasestorage.app",
  messagingSenderId: "640076784196",
  appId: "1:640076784196:web:c10e2169714efcfb42d211",
  measurementId: "G-G76NJM8Y5N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
=======
// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMxV_GVOxQbtKEA-XiuGzFKIIi1HBMTjk",
  authDomain: "neighbor-connect-2b315.firebaseapp.com",
  projectId: "neighbor-connect-2b315",
  storageBucket: "neighbor-connect-2b315.firebasestorage.app",
  messagingSenderId: "640076784196",
  appId: "1:640076784196:web:c10e2169714efcfb42d211",
  measurementId: "G-G76NJM8Y5N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
>>>>>>> 3dc65e7cba26a703c63e38d82ccff2cfbce780e2
