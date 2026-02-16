// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_4_adS0YQs8bGMbEvNSpLpW3BpCdvIAU",
  authDomain: "mark1-7ce7e.firebaseapp.com",
  projectId: "mark1-7ce7e",
  storageBucket: "mark1-7ce7e.appspot.com",
  messagingSenderId: "147908886392",
  appId: "1:147908886392:web:7d209960ba65868172128d",
  measurementId: "G-6J34J730EW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other modules
export { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp
};

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.email);
    // User is signed in - could redirect to dashboard here if needed
  } else {
    console.log('No user signed in');
  }
});
