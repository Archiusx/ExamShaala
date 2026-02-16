// Early splash screen hiding (fallback)
setTimeout(() => {
  const splash = document.getElementById('splashScreen');
  const container = document.getElementById('authContainer');
  if (splash) splash.classList.add('hidden');
  if (container) container.classList.add('show');
}, 2000);

// Import Firebase functions
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  setDoc,
  serverTimestamp
} from './firebase.js';

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
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {

  // Tab Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // Clear alerts when switching tabs
      document.getElementById('loginAlert').innerHTML = '';
      document.getElementById('registerAlert').innerHTML = '';
    });
  });

  // Sign Up Handler
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
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
      
      // Update Firebase Auth display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        fullName: fullName,
        email: email,
        examCategory: examCategory || 'Not specified',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'student',
        verified: false,
        platform: 'ExamShaala'
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      
      showAlert('registerAlert', 'Account created successfully! You can now sign in.', 'success');
      
      // Switch to login tab after 2 seconds and pre-fill email
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('loginEmail').value = email;
      }, 2000);
      
      // Clear form
      document.getElementById("registerForm").reset();
      
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

  // Sign In Handler
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
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
      
      // Update last login in Firestore
      await setDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
      
      showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
      
      // Redirect to dashboard after 1.5 seconds
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

  // Forgot Password Handler
  document.getElementById("forgotPasswordLink").addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    
    if (!email) {
      showAlert('loginAlert', 'Please enter your email address first.');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert('loginAlert', 'Password reset email sent! Please check your inbox.', 'success');
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

  // Enter key support for both forms
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab.id === 'login-tab') {
        document.getElementById('loginBtn').click();
      } else if (activeTab.id === 'register-tab') {
        document.getElementById('registerBtn').click();
      }
    }
  });

  // Intersection Observer for animated feature list
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.brand-features li').forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
    observer.observe(item);
  });

  // Input Focus Effects
  const inputs = document.querySelectorAll('.form-input, .form-select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.style.transform = 'scale(1.02)';
      input.parentElement.style.transition = 'transform 0.3s ease';
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.style.transform = 'scale(1)';
    });
  });

  // Button Hover Effects
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(-2px) scale(1.02)';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(0) scale(1)';
      }
    });
  });

  // Email validation on input
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

  // Password strength indicator (optional enhancement)
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

  console.log('ExamShaala Auth System Initialized ✓');
});
