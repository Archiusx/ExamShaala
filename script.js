// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_4_adS0YQs8bGMbEvNSpLpW3BpCdvIAU",
  authDomain: "mark1-7ce7e.firebaseapp.com",
  projectId: "mark1-7ce7e",
  storageBucket: "mark1-7ce7e.appspot.com",
  messagingSenderId: "147908886392",
  appId: "1:147908886392:web:7d209960ba65868172128d",
  measurementId: "G-6J34J730EW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

console.log('🔥 Firebase initialized');
console.log('✅ Auth:', auth);
console.log('✅ DB:', db);

// Utility functions
function showAlert(id, message, type = 'error') {
  const container = document.getElementById(id);
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  container.innerHTML = `
    <div class="alert alert-${type}">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  setTimeout(() => container.innerHTML = '', 5000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  if (loading) {
    btn.classList.add('btn-loading');
  } else {
    btn.classList.remove('btn-loading');
  }
}

async function saveUserProfile(user, examCategory = '') {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        fullName: user.displayName || 'Student',
        email: user.email,
        examCategory: examCategory || 'Not specified',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'student',
        platform: 'ExamShaala',
        provider: user.providerData[0]?.providerId || 'password'
      });
    } else {
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch (error) {
    console.error('Profile save error:', error);
  }
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  
  console.log('📱 DOM Ready - Attaching event listeners...');
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const forms = document.querySelectorAll('.form-wrapper');
  
  console.log('📑 Found tabs:', tabs.length);
  console.log('📝 Found forms:', forms.length);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
      
      document.getElementById('loginAlert').innerHTML = '';
      document.getElementById('signupAlert').innerHTML = '';
    });
  });
  
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('🔐 Login button clicked!');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('📧 Email:', email);
    
    if (!email || !password) {
      showAlert('loginAlert', 'Please fill all fields');
      return;
    }
    
    setLoading('loginBtn', true);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserProfile(result.user);
      
      showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
      
    } catch (error) {
      let msg = 'Login failed. Please check credentials.';
      
      if (error.code === 'auth/user-not-found') msg = 'No account found. Please sign up.';
      else if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try later.';
      
      showAlert('loginAlert', msg);
    } finally {
      setLoading('loginBtn', false);
    }
  });
  
  // Signup form
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const exam = document.getElementById('signupExam').value;
    
    if (!name || !email || !password) {
      showAlert('signupAlert', 'Please fill all required fields');
      return;
    }
    
    if (name.length < 3) {
      showAlert('signupAlert', 'Please enter your full name');
      return;
    }
    
    if (password.length < 6) {
      showAlert('signupAlert', 'Password must be at least 6 characters');
      return;
    }
    
    setLoading('signupBtn', true);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await saveUserProfile(result.user, exam);
      
      showAlert('signupAlert', 'Account created! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
      
    } catch (error) {
      let msg = 'Signup failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') msg = 'Email already registered. Please sign in.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      else if (error.code === 'auth/weak-password') msg = 'Password too weak. Use stronger password.';
      
      showAlert('signupAlert', msg);
    } finally {
      setLoading('signupBtn', false);
    }
  });
  
  // Google login
  document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    setLoading('googleLoginBtn', true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(result.user);
      
      showAlert('loginAlert', 'Signed in with Google! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
      
    } catch (error) {
      let msg = 'Google sign-in failed.';
      
      if (error.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
      else if (error.code === 'auth/popup-blocked') msg = 'Please allow popups.';
      
      showAlert('loginAlert', msg);
    } finally {
      setLoading('googleLoginBtn', false);
    }
  });
  
  // Google signup
  document.getElementById('googleSignupBtn').addEventListener('click', async () => {
    setLoading('googleSignupBtn', true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(result.user);
      
      showAlert('signupAlert', 'Signed up with Google! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
      
    } catch (error) {
      let msg = 'Google sign-up failed.';
      
      if (error.code === 'auth/popup-closed-by-user') msg = 'Sign-up cancelled.';
      else if (error.code === 'auth/popup-blocked') msg = 'Please allow popups.';
      
      showAlert('signupAlert', msg);
    } finally {
      setLoading('googleSignupBtn', false);
    }
  });
  
  // Forgot password
  document.getElementById('forgotLink').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    
    if (!email) {
      showAlert('loginAlert', 'Please enter your email first');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert('loginAlert', 'Password reset email sent! Check inbox.', 'success');
    } catch (error) {
      let msg = 'Failed to send reset email.';
      
      if (error.code === 'auth/user-not-found') msg = 'No account with this email.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      
      showAlert('loginAlert', msg);
    }
  });
  
  // Email validation
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        input.style.borderColor = 'var(--error)';
      } else {
        input.style.borderColor = '';
      }
    });
  });
  
  // Password strength
  const pwdInput = document.getElementById('signupPassword');
  if (pwdInput) {
    pwdInput.addEventListener('input', () => {
      const len = pwdInput.value.length;
      if (len > 0 && len < 6) pwdInput.style.borderColor = 'var(--error)';
      else if (len >= 6 && len < 8) pwdInput.style.borderColor = '#F59E0B';
      else if (len >= 8) pwdInput.style.borderColor = 'var(--success)';
      else pwdInput.style.borderColor = '';
    });
  }
  
  console.log('✅ ExamShaala loaded');
});
