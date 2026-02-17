// =========================================================
//  script.js — BIT Node Dashboard UI Logic
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ─── Smooth Scroll for internal anchor links ──────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      const href   = anchor.getAttribute("href");
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        closeMobileNav();
        closeNotifications();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ─── Mobile Nav ───────────────────────────────────────────
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav    = document.getElementById("mobileNav");
  const overlay      = document.getElementById("overlay");

  function openMobileNav() {
    mobileNav?.classList.add("open");
    hamburgerBtn?.classList.add("active");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMobileNav() {
    mobileNav?.classList.remove("open");
    hamburgerBtn?.classList.remove("active");
    if (!notificationPanel?.classList.contains("active")) {
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  hamburgerBtn?.addEventListener("click", () => {
    const isOpen = mobileNav?.classList.contains("open");
    isOpen ? closeMobileNav() : openMobileNav();
  });

  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", closeMobileNav);
  });

  // ─── Notifications ────────────────────────────────────────
  const notificationBtn    = document.getElementById("notificationBtn");
  const notificationPanel  = document.getElementById("notificationPanel");
  const notificationClose  = document.getElementById("notificationClose");
  const notifBadge         = document.getElementById("notifBadge");
  const notifHeaderText    = document.getElementById("notifHeaderText");

  function openNotifications() {
    closeMobileNav();
    notificationPanel?.classList.add("active");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeNotifications() {
    notificationPanel?.classList.remove("active");
    if (!mobileNav?.classList.contains("open")) {
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  notificationBtn?.addEventListener("click",   openNotifications);
  notificationClose?.addEventListener("click", closeNotifications);
  overlay?.addEventListener("click", () => {
    closeMobileNav();
    closeNotifications();
  });

  // Mark individual notification as read
  document.querySelectorAll(".notification-item").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.remove("unread");
      updateNotifBadge();
    });
  });

  function updateNotifBadge() {
    const count = document.querySelectorAll(".notification-item.unread").length;
    if (notifBadge) {
      notifBadge.textContent = count;
      notifBadge.style.display = count > 0 ? "flex" : "none";
    }
    if (notifHeaderText) {
      notifHeaderText.textContent = count > 0
        ? `You have ${count} unread notification${count > 1 ? "s" : ""}`
        : "All notifications read";
    }
  }

  // ─── Sign Out ─────────────────────────────────────────────
  document.getElementById("signOutBtn")?.addEventListener("click", async () => {
    try {
      const bnAuth = window.__BITNode?.auth;
      const signOutFn = window.__BITNode?.signOut;
      if (bnAuth && signOutFn) {
        await signOutFn(bnAuth);
        sessionStorage.removeItem("bitnode_user");
        window.location.href = "auth.html";
      }
    } catch (e) {
      console.error("Sign out error:", e);
    }
  });

  // ─── Animated Counters ────────────────────────────────────
  function animateCounter(el) {
    const target   = parseInt(el.getAttribute("data-target"), 10);
    const duration = 1500;
    const step     = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, step);
  }

  // Trigger counters when stats bar enters viewport
  const statsSection = document.querySelector(".stats-bar");
  const counters     = document.querySelectorAll(".stat-num");
  let countersStarted = false;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        counters.forEach(c => animateCounter(c));
        counterObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });

  if (statsSection) counterObserver.observe(statsSection);

  // ─── Scroll-triggered card animations ────────────────────
  const cards = document.querySelectorAll(".nav-card, .tool-card, .community-card, .lang-card, .about-stat-card");

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0)";
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  cards.forEach((card, i) => {
    card.style.opacity   = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition= `opacity 0.45s ease ${i * 0.05}s, transform 0.45s ease ${i * 0.05}s, border-color 0.25s, box-shadow 0.25s, background 0.25s`;
    cardObserver.observe(card);
  });

  // ─── Sticky Header Shadow ─────────────────────────────────
  const header = document.getElementById("pageHeader");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  }, { passive: true });

  // ─── Session check: show welcome toast if just logged in ──
  const sessionUser = sessionStorage.getItem("bitnode_user");
  const justLoggedIn = sessionStorage.getItem("bitnode_just_logged_in");
  if (sessionUser && justLoggedIn) {
    sessionStorage.removeItem("bitnode_just_logged_in");
    const user = JSON.parse(sessionUser);
    showToast(`Welcome back, ${user.name}! 👋`, "success");
  }

  // ─── Toast notification system ────────────────────────────
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === "success" ? "check-circle" : "info-circle"}"></i>
      <span>${message}</span>
    `;

    // Inject toast styles if not already present
    if (!document.getElementById("toast-styles")) {
      const style = document.createElement("style");
      style.id = "toast-styles";
      style.textContent = `
        .toast {
          position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
          display:flex; align-items:center; gap:0.625rem;
          padding:0.875rem 1.25rem; border-radius:12px;
          font-size:0.9rem; font-weight:600; max-width:340px;
          box-shadow:0 8px 25px rgba(0,0,0,0.4);
          animation:toastIn 0.35s ease both;
          border:1px solid transparent;
        }
        .toast-success { background:#0d2818; border-color:rgba(34,197,94,0.3); color:#4ade80; }
        .toast-info    { background:#0d1833; border-color:rgba(99,102,241,0.3); color:#818cf8; }
        .toast-error   { background:#200d0d; border-color:rgba(239,68,68,0.3); color:#f87171; }
        @keyframes toastIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translateY(8px); } }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "toastOut 0.35s ease forwards";
      setTimeout(() => toast.remove(), 380);
    }, 3500);
  }

  // ─── Active nav highlight on scroll ───────────────────────
  const sections  = document.querySelectorAll("section[id], div[id]");
  const navLinks  = document.querySelectorAll(".nav-link");

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = "";
          if (link.getAttribute("href") === `#${entry.target.id}`) {
            link.style.color = "var(--primary-light)";
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(sec => navObserver.observe(sec));

  // ─── Header scrolled style ────────────────────────────────
  const headerScrollStyle = document.createElement("style");
  headerScrollStyle.textContent = `
    .header.scrolled { box-shadow:0 4px 30px rgba(0,0,0,0.5); }
  `;
  document.head.appendChild(headerScrollStyle);

});
