// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

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
const googleProvider = new GoogleAuthProvider();

// Utility Functions
function showAlert(containerId, message, type = 'error') {
  const container = document.getElementById(containerId);
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  container.innerHTML = `
    <div class="alert ${alertClass}">
      <i class="fas ${iconClass}"></i>
      <span>${message}</span>
    </div>
  `;
  
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
  }
}

// Create/Update user profile in Firestore
async function createOrUpdateUserProfile(user, examCategory = '') {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // New user - create profile
      const userProfile = {
        uid: user.uid,
        fullName: user.displayName || 'Student',
        email: user.email,
        examCategory: examCategory || 'Not specified',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'student',
        verified: false,
        platform: 'ExamShaala',
        authProvider: user.providerData[0]?.providerId || 'password'
      };
      await setDoc(userRef, userProfile);
    } else {
      // Existing user - update last login
      await setDoc(userRef, {
        lastLogin: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  
  // Tab Switching
  const tabSwitches = document.querySelectorAll('.tab-switch');
  const formContainers = document.querySelectorAll('.form-container');

  tabSwitches.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all
      tabSwitches.forEach(btn => btn.classList.remove('active'));
      formContainers.forEach(form => form.classList.remove('active'));
      
      // Add active class
      button.classList.add('active');
      document.getElementById(`${targetTab}-form`).classList.add('active');
      
      // Clear alerts
      document.getElementById('loginAlert').innerHTML = '';
      document.getElementById('registerAlert').innerHTML = '';
    });
  });

  // =====================================
  // EMAIL/PASSWORD SIGN UP
  // =====================================
  document.getElementById("registerFormElement").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById("registerFullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const examCategory = document.getElementById("registerExamCategory").value;
    
    // Validation
    if (!fullName || !email || !password) {
      showAlert('registerAlert', 'Please fill in all required fields.');
      return;
    }
    
    if (password.length < 6) {
      showAlert('registerAlert', 'Password must be at least 6 characters long.');
      return;
    }

    if (fullName.length < 3) {
      showAlert('registerAlert', 'Please enter your full name.');
      return;
    }
    
    setLoading('registerBtn', true);
    
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Create user profile in Firestore
      await createOrUpdateUserProfile(user, examCategory);
      
      showAlert('registerAlert', 'Account created successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      showAlert('registerAlert', errorMessage);
    } finally {
      setLoading('registerBtn', false);
    }
  });

  // =====================================
  // EMAIL/PASSWORD SIGN IN
  // =====================================
  document.getElementById("loginFormElement").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if (!email || !password) {
      showAlert('loginAlert', 'Please fill in all fields.');
      return;
    }
    
    setLoading('loginBtn', true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await createOrUpdateUserProfile(user);
      
      showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      showAlert('loginAlert', errorMessage);
    } finally {
      setLoading('loginBtn', false);
    }
  });

  // =====================================
  // GOOGLE SIGN IN (Login Page)
  // =====================================
  document.getElementById("googleSignInBtn").addEventListener("click", async () => {
    setLoading('googleSignInBtn', true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create or update user profile
      await createOrUpdateUserProfile(user);
      
      showAlert('loginAlert', 'Signed in with Google! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1500);
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      }
      
      showAlert('loginAlert', errorMessage);
    } finally {
      setLoading('googleSignInBtn', false);
    }
  });

  // =====================================
  // GOOGLE SIGN UP (Register Page)
  // =====================================
  document.getElementById("googleSignUpBtn").addEventListener("click", async () => {
    setLoading('googleSignUpBtn', true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create or update user profile
      await createOrUpdateUserProfile(user);
      
      showAlert('registerAlert', 'Signed up with Google! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1500);
      
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      let errorMessage = 'Failed to sign up with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      }
      
      showAlert('registerAlert', errorMessage);
    } finally {
      setLoading('googleSignUpBtn', false);
    }
  });

  // =====================================
  // FORGOT PASSWORD
  // =====================================
  document.getElementById("forgotPasswordLink").addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    
    if (!email) {
      showAlert('loginAlert', 'Please enter your email address first.');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert('loginAlert', 'Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      showAlert('loginAlert', errorMessage);
    }
  });

  // =====================================
  // INPUT ENHANCEMENTS
  // =====================================
  
  // Email validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value && !isValidEmail(input.value)) {
        input.style.borderColor = 'var(--error)';
      } else {
        input.style.borderColor = '';
      }
    });
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password strength indicator
  const passwordInput = document.getElementById('registerPassword');
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      if (password.length > 0 && password.length < 6) {
        passwordInput.style.borderColor = 'var(--error)';
      } else if (password.length >= 6 && password.length < 8) {
        passwordInput.style.borderColor = 'var(--warning)';
      } else if (password.length >= 8) {
        passwordInput.style.borderColor = 'var(--success)';
      } else {
        passwordInput.style.borderColor = '';
      }
    });
  }

  // Enter key support
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const activeForm = document.querySelector('.form-container.active');
      if (activeForm.id === 'login-form') {
        document.getElementById('loginBtn').click();
      } else if (activeForm.id === 'register-form') {
        document.getElementById('registerBtn').click();
      }
    }
  });

  console.log('✅ ExamShaala Auth System Initialized');
});

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User signed in:', user.email);
    // Optional: Auto-redirect if already logged in
    // window.location.href = "/dashboard.html";
  } else {
    console.log('No user signed in');
  }
});
