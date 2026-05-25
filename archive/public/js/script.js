// Wait for DOM to be fully loaded before initializing Feather Icons
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Feather Icons after DOM is ready
  if (typeof feather !== "undefined") {
    feather.replace();
  } else {
    console.error("Ngebug dibagian feather ketua");
  }
});

// keamanan kecil
// Simple rate limiting
const submissions = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const userSubmissions = submissions.get(ip) || [];

  // Max 2 aspirasi per jam
  const oneHour = 60 * 60 * 1000;
  const recentSubmissions = userSubmissions.filter(
    (time) => now - time < oneHour
  );

  if (recentSubmissions.length >= 2) {
    return false;
  }

  recentSubmissions.push(now);
  submissions.set(ip, recentSubmissions);
  return true;
}

function sanitizeInput(text) {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim()
    .substring(0, 1000); // Max 1000 karakter
}

// Fungsi untuk inisialisasi animasi scroll reveal
function initScrollReveal() {
  // Tambahkan class scroll-reveal ke elemen-elemen yang ingin dianimasikan
  const elementsToAnimate = [
    // Section headings
    { selector: "#about h2", class: "scroll-reveal" },
    { selector: "#proker h2", class: "scroll-reveal" },
    { selector: "#aspirasi h2", class: "scroll-reveal" },
    { selector: "#contact h2", class: "scroll-reveal" },

    // About section elements
    { selector: ".visi-card", class: "scroll-reveal-left" },
    { selector: ".misi-card", class: "scroll-reveal-right" },
    { selector: ".logo-container", class: "scroll-reveal-scale" },

    // Members section
    { selector: ".members-title", class: "scroll-reveal" },
    { selector: ".members-title2", class: "scroll-reveal" },
    { selector: ".section-title", class: "scroll-reveal" },

    // Core members
    {
      selector: ".core-members-grid .member-card",
      class: "scroll-reveal-scale",
    },

    // Commission sections
    { selector: ".commission-section", class: "scroll-reveal" },

    // Program cards
    { selector: ".program-card", class: "scroll-reveal-scale" },

    // Form elements
    { selector: ".aspirasi-form p", class: "scroll-reveal" },
    { selector: ".form-group", class: "scroll-reveal" },
    { selector: ".checkbox-group", class: "scroll-reveal" },
    { selector: ".submit-btn", class: "scroll-reveal" },
    { selector: ".reset-btn", class: "scroll-reveal" },

    // Contact section
    { selector: "#contact p", class: "scroll-reveal" },
    { selector: ".social-links", class: "scroll-reveal-scale" },
  ];

  // Tambahkan class ke setiap elemen
  elementsToAnimate.forEach((item) => {
    const elements = document.querySelectorAll(item.selector);
    elements.forEach((el) => {
      if (
        !el.classList.contains("scroll-reveal") &&
        !el.classList.contains("scroll-reveal-left") &&
        !el.classList.contains("scroll-reveal-right") &&
        !el.classList.contains("scroll-reveal-scale")
      ) {
        el.classList.add(item.class);
      }
    });
  });
}

// Fungsi untuk mengecek apakah elemen terlihat di viewport
function isElementInViewport(el, threshold = 0.1) {
  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return (
    rect.top <= windowHeight - windowHeight * threshold &&
    rect.bottom >= windowHeight * threshold
  );
}

// Fungsi untuk mengaktifkan animasi scroll reveal
function activateScrollReveal() {
  const scrollElements = document.querySelectorAll(
    ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale"
  );

  scrollElements.forEach((el) => {
    if (isElementInViewport(el, 0.15) && !el.classList.contains("visible")) {
      el.classList.add("visible");
    }
  });
}

// Throttle function untuk optimasi performa scroll
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Inisialisasi semua animasi
function initAnimations() {
  // Tunggu sampai DOM sepenuhnya dimuat
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnimations);
    return;
  }

  // Inisialisasi scroll reveal
  initScrollReveal();

  // Aktivasi elemen yang sudah terlihat saat page load
  activateScrollReveal();

  // Event listener untuk scroll
  const throttledScrollHandler = throttle(activateScrollReveal, 16);
  window.addEventListener("scroll", throttledScrollHandler);

  // Event listener untuk resize
  window.addEventListener("resize", throttle(activateScrollReveal, 100));
}

// Jalankan inisialisasi
initAnimations();

// Export functions jika diperlukan untuk debugging
window.scrollAnimations = {
  initScrollReveal,
  activateScrollReveal,
};

// Enhanced smooth scrolling dengan animasi yang lebih halus dan keren
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");

    if (targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeMobileMenu();
      return;
    }

    const target = document.querySelector(targetId);
    if (target) {
      const clickedMenu = this;
      clickedMenu.style.transform = "scale(0.95)";
      clickedMenu.style.transition = "transform 0.2s ease";

      setTimeout(() => {
        clickedMenu.style.transform = "scale(1)";
      }, 200);

      const navbar = document.querySelector(".navbar");
      const navbarHeight = navbar ? navbar.offsetHeight : 80;
      const targetPosition = target.offsetTop - navbarHeight - 20;

      smoothScrollTo(targetPosition, 1000);
      closeMobileMenu();

      setTimeout(() => {
        target.style.transform = "scale(1.02)";
        target.style.transition =
          "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

        setTimeout(() => {
          target.style.transform = "scale(1)";
        }, 600);
      }, 500);
    }
  });
});

// Fungsi custom smooth scroll dengan easing yang lebih halus
function smoothScrollTo(targetPosition, duration) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animationStep(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animationStep);
    }
  }

  requestAnimationFrame(animationStep);
}

// Active menu indicator - highlight menu yang sedang aktif
function updateActiveMenu() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".navbar-nav a");

  let currentSection = "";
  const scrollPosition = window.pageYOffset + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      currentSection = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");

    if (
      href === `#${currentSection}` ||
      (href === "#" && currentSection === "hero")
    ) {
      link.classList.add("active");
      link.style.textShadow = "0 0 px rgba(255, 255, 255, 0.8)";
      link.style.transition = "all 0.3s ease";
    } else {
      link.style.textShadow = "none";
    }
  });
}

window.addEventListener("scroll", updateActiveMenu);
document.addEventListener("DOMContentLoaded", updateActiveMenu);

// Mobile Menu Variables dan Functions
let isMenuOpen = false;

function openMobileMenu() {
  const navbarNav = document.querySelector(".navbar-nav");
  const hamburgerMenu = document.getElementById("hamburger-menu");

  if (navbarNav && hamburgerMenu) {
    navbarNav.classList.add("mobile-menu-open");
    hamburgerMenu.classList.add("hamburger-active");
    isMenuOpen = true;

    const overlay = document.createElement("div");
    overlay.className = "mobile-menu-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);

    overlay.addEventListener("click", closeMobileMenu);
    document.body.style.overflow = "hidden";
  }
}
function closeMobileMenu() {
  const navbarNav = document.querySelector(".navbar-nav");
  const hamburgerMenu = document.getElementById("hamburger-menu");

  if (navbarNav && hamburgerMenu) {
    navbarNav.classList.remove("mobile-menu-open");
    hamburgerMenu.classList.remove("hamburger-active");
    isMenuOpen = false;

    const overlay = document.querySelector(".mobile-menu-overlay");
    if (overlay) {
      overlay.remove();
    }

    document.body.style.overflow = "";
  }
}

// Wait for DOM before setting up mobile menu
document.addEventListener("DOMContentLoaded", function () {
  // Mobile Menu Toggle
  const hamburgerMenu = document.getElementById("hamburger-menu");

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (isMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  } else {
    console.error("");
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && isMenuOpen) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen) {
      closeMobileMenu();
    }
  });

  // FORM FUNCTIONALITY - PERBAIKAN SELECTOR
  const namaGroup = document.getElementById("namaGroup");
  const kelasGroup = document.getElementById("kelasGroup");
  const nama = document.getElementById("nama");
  const kelasInput = document.getElementById("kelas"); // PERBAIKI: gunakan 'kelas' bukan 'kelasInput'

  // PERBAIKAN: Check elements dengan benar
  if (!namaGroup || !kelasGroup || !nama || !kelasInput) {
    console.error("Form elements not found:", {
      namaGroup: !!namaGroup,
      kelasGroup: !!kelasGroup,
      nama: !!nama,
      kelasInput: !!kelasInput,
    });
    return;
  }

  // Fungsi untuk membuat animasi slide yang halus
  function slideUp(element) {
    element.style.height = element.scrollHeight + "px";
    element.style.overflow = "hidden";
    element.style.transition = "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

    element.offsetHeight;

    element.style.height = "0px";
    element.style.opacity = "0";
    element.style.marginBottom = "0px";
    element.style.paddingTop = "0px";
    element.style.paddingBottom = "0px";

    setTimeout(() => {
      element.style.display = "none";
    }, 400);
  }

  function slideDown(element) {
    element.style.display = "block";
    element.style.height = "0px";
    element.style.opacity = "0";
    element.style.overflow = "hidden";
    element.style.marginBottom = "0px";
    element.style.paddingTop = "0px";
    element.style.paddingBottom = "0px";
    element.style.transition = "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

    element.offsetHeight;

    element.style.height = element.scrollHeight + "px";
    element.style.opacity = "1";
    element.style.marginBottom = "";
    element.style.paddingTop = "";
    element.style.paddingBottom = "";

    setTimeout(() => {
      element.style.height = "auto";
      element.style.overflow = "visible";
    }, 400);
  }

  // PERBAIKAN: URL Google Apps Script - pastikan ini adalah URL yang benar
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyTSpgEzf-IVMimrawkc4twNDxpDZxWlhWSt0O-8YVpOKNGB3Piia56VyWFuJIAZsDvVA/exec";

  // Form submission dengan perbaikan
  document
    .getElementById("aspirasiForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const form = e.target;
      const submitBtn = document.getElementById("submitBtn");
      const loading = document.getElementById("loading");
      const message = document.getElementById("message");

      // Ambil data form
      const formData = new FormData(form);
      const data = {
        nama: formData.get("nama") || "",
        kelas: formData.get("kelas") || "",
        isi: formData.get("isi"),
        waktu: new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      // Validasi
      if (!data.isi || data.isi.trim() === "") {
        showMessage("Isi aspirasi harus diisi!", "error");
        return;
      }

      // Sanitize input
      data.isi = sanitizeInput(data.isi);

      try {
        // Tampilkan loading
        submitBtn.disabled = true;
        loading.style.display = "block";
        message.style.display = "none";

        // PERBAIKAN: Gunakan metode POST dengan form data untuk Google Apps Script
        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            nama: data.nama,
            kelas: data.kelas,
            isi: data.isi,
            waktu: data.waktu,
          }),
        });

        // Coba baca response sebagai text dulu
        const responseText = await response.text();

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          // Jika tidak bisa parse sebagai JSON, anggap berhasil
          result = { success: true };
        }

        if (result.success !== false) {
          showMessage(
            `✅ Aspirasi berhasil dikirim! Terima kasih atas partisipasi Kamu.`,
            "success"
          );
          form.reset();
        } else {
          throw new Error(
            result.message || result.error || "Terjadi kesalahan"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showMessage(`❌ Terjadi kesalahan: ${error.message}`, "error");
      } finally {
        // Sembunyikan loading
        submitBtn.disabled = false;
        loading.style.display = "none";
      }
    });

  function showMessage(text, type) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = "block";

    // Auto hide setelah 5 detik untuk pesan sukses
    if (type === "success") {
      setTimeout(() => {
        message.style.display = "none";
      }, 5000);
    }
  }

  // PERBAIKAN: Test connection yang lebih baik
  window.addEventListener("load", async function () {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "GET",
      });

      if (response.ok) {
        const text = await response.text();
        console.log("Connection test successful:", text);
      } else {
        console.log("Connection test failed with status:", response.status);
      }
    } catch (error) {}
  });

  // Scroll effect untuk navbar dengan transisi halus
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");

    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
        // Jangan override style positioning, hanya ubah background
        navbar.style.background = "rgba(102, 126, 234, 0.95)";
        navbar.style.backdropFilter = "blur(10px)";
        navbar.style.transition =
          "background 0.3s ease, backdrop-filter 0.3s ease";
      } else {
        navbar.classList.remove("scrolled");
        navbar.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        navbar.style.backdropFilter = "none";
        navbar.style.transition =
          "background 0.3s ease, backdrop-filter 0.3s ease";
      }
    }
  });
  // =======================================
  // BAGIAN ANIMASI JUMP TEXT
  // =======================================

  class JumpTextAnimation {
    constructor() {
      this.isAnimating = false;
      this.animationInterval = null;
      this.letters = [];
      this.initialized = false;
      this.init();
    }

    init() {
      // Pastikan DOM sudah ready
      const initializeWhenReady = () => {
        if (document.readyState === "complete") {
          setTimeout(() => this.setupAnimation(), 100);
        } else {
          setTimeout(initializeWhenReady, 50);
        }
      };

      initializeWhenReady();
    }

    setupAnimation() {
      if (this.initialized) return;

      // Prioritas utama: .hero-title (sesuai CSS)
      const selectors = [
        ".hero-title",
        "#hero .hero-title",
        ".hero .hero-title",
        "#hero h1",
        ".hero h1",
        "h1",
      ];

      let heroTitle = null;
      for (const selector of selectors) {
        heroTitle = document.querySelector(selector);
        if (heroTitle) break;
      }

      if (!heroTitle) {
        setTimeout(() => this.setupAnimation(), 500);
        return;
      }

      // Pastikan elemen visible
      heroTitle.style.opacity = "1";
      heroTitle.style.visibility = "visible";

      // Split text menjadi letters dengan class yang sesuai CSS
      this.wrapLetters(heroTitle);

      // Start animasi periodic
      this.startPeriodicAnimation();

      this.initialized = true;
    }

    wrapLetters(element) {
      const text = element.textContent.trim();

      // Split menjadi karakter individual dengan class sesuai CSS
      const letters = text.split("").map((char, index) => {
        const className = char === " " ? "jump-char space" : "jump-char";
        const content = char === " " ? "&nbsp;" : char;
        return `<span class="${className}" data-index="${index}">${content}</span>`;
      });

      // Replace konten element
      element.innerHTML = letters.join("");

      // Get semua jump-char elements (sesuai CSS)
      this.letters = element.querySelectorAll(".jump-char");

      // Pastikan parent sudah ada class hero-title
      if (!element.classList.contains("hero-title")) {
        element.classList.add("hero-title");
      }
    }

    animateWave() {
      if (this.isAnimating || !this.letters || this.letters.length === 0) {
        return;
      }

      this.isAnimating = true;

      // Animate setiap letter dengan staggered delay
      this.letters.forEach((letter, index) => {
        setTimeout(() => {
          if (!letter.classList.contains("space")) {
            // Gunakan class 'animate' sesuai CSS keyframes
            letter.classList.add("animate");

            // Remove animation class setelah selesai (0.6s sesuai CSS)
            setTimeout(() => {
              letter.classList.remove("animate");
            }, 600);
          }
        }, index * 80); // Staggered delay
      });

      // Reset animation flag
      setTimeout(() => {
        this.isAnimating = false;
      }, this.letters.length * 80 + 600);
    }

    startPeriodicAnimation() {
      // Animasi pertama setelah 1 detik
      setTimeout(() => {
        this.animateWave();
      }, 1000);

      // Repeat setiap 8 detik
      this.animationInterval = setInterval(() => {
        this.animateWave();
      }, 8000);
    }

    // Manual trigger method
    triggerAnimation() {
      if (!this.isAnimating && this.initialized) {
        this.animateWave();
      }
    }

    // Stop animation
    stopAnimation() {
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }

    // Restart animation
    restartAnimation() {
      this.stopAnimation();
      this.startPeriodicAnimation();
    }
  }

  // Initialize animation
  let jumpTextAnimation = null;

  // Initialization dengan multiple fallbacks
  function initializeJumpText() {
    if (!jumpTextAnimation) {
      jumpTextAnimation = new JumpTextAnimation();
    }
  }

  // Multiple initialization points
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initializeJumpText, 200);
  });

  window.addEventListener("load", () => {
    setTimeout(initializeJumpText, 100);
  });

  // Fallback initialization
  setTimeout(initializeJumpText, 1000);

  // Add hover trigger setelah initialization
  setTimeout(() => {
    // Prioritas untuk .hero-title
    const heroSelectors = [
      ".hero-title",
      "#hero .hero-title",
      "#hero h1",
      ".hero h1",
      "h1",
    ];

    for (const selector of heroSelectors) {
      const heroTitle = document.querySelector(selector);
      if (heroTitle) {
        heroTitle.addEventListener("mouseenter", function () {
          if (jumpTextAnimation && jumpTextAnimation.initialized) {
            jumpTextAnimation.triggerAnimation();
          }
        });

        // Add click trigger juga
        heroTitle.addEventListener("click", function () {
          if (jumpTextAnimation && jumpTextAnimation.initialized) {
            jumpTextAnimation.triggerAnimation();
          }
        });
        break;
      }
    }
  }, 2000);

  // Performance optimization
  document.addEventListener("visibilitychange", function () {
    if (jumpTextAnimation) {
      if (document.hidden) {
        jumpTextAnimation.stopAnimation();
      } else {
        jumpTextAnimation.restartAnimation();
      }
    }
  });

  // Debug function untuk testing
  window.testJumpAnimation = function () {
    if (jumpTextAnimation) {
      jumpTextAnimation.triggerAnimation();
    } else {
    }
  };
});

// Fungsi untuk menghitung jumlah anggota MPK tanpa duplikasi nama
function countUniqueMembers() {
  // Set untuk menyimpan nama unik (Set otomatis menghilangkan duplikat)
  const uniqueNames = new Set();

  // Ambil semua elemen yang berisi nama anggota
  const memberNames = document.querySelectorAll(".member-name");

  // Loop melalui setiap nama dan tambahkan ke Set
  memberNames.forEach((nameElement) => {
    const name = nameElement.textContent.trim();
    if (name) {
      uniqueNames.add(name);
    }
  });

  // Return jumlah nama unik
  return uniqueNames.size;
}

// Fungsi untuk menampilkan jumlah anggota di halaman
function displayMemberCount() {
  const memberCountElement = document.getElementById("member-count");
  if (memberCountElement) {
    const totalMembers = countUniqueMembers();
    memberCountElement.textContent = `${totalMembers} anggota`;
  }
}

// Fungsi untuk debugging
function findDuplicateNames() {
  const nameCount = {};
  const duplicates = [];

  // Hitung frekuensi setiap nama
  const memberNames = document.querySelectorAll(".member-name");
  memberNames.forEach((nameElement) => {
    const name = nameElement.textContent.trim();
    if (name) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
  });

  // Cari nama yang muncul lebih dari sekali
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > 1) {
      duplicates.push({ name, count });
    }
  }

  return duplicates;
}

// Jalankan fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  displayMemberCount();
});

// Fungsi untuk refresh count (jika diperlukan)
function refreshMemberCount() {
  displayMemberCount();
}

// Bagian Animasi Scrolling
