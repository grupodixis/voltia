const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const animatedItems = document.querySelectorAll("[data-animate]");
const galleryImages = document.querySelectorAll(".sector-card img, .matrix-grid img");
const orbitLogo = document.querySelector("[data-orbit-logo]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const siteIntro = document.querySelector("[data-site-intro]");
const introLogo = document.querySelector("[data-intro-logo]");
const introLogoShell = document.querySelector("[data-intro-logo-shell]");
const navLinks = [...document.querySelectorAll("[data-nav] a[href^='#']")];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
let orbitElements = null;
let orbitFrame = null;
let navFrame = null;
let introOrbitFrame = null;

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

function rotatePoint(x, y, angle) {
  const radians = (angle * Math.PI) / 180;
  const dx = x - 74;
  const dy = y - 74;
  return {
    x: 74 + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: 74 + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

function orbitPosition(angle, radiusX, radiusY, rotation) {
  const radians = angle * Math.PI * 2;
  return rotatePoint(
    74 + Math.cos(radians) * radiusX,
    74 + Math.sin(radians) * radiusY,
    rotation
  );
}

function updateLogoOrbits() {
  orbitFrame = null;
  if (!orbitElements) return;

  // Use physical scroll distance so the orbital motion remains visible on long pages.
  const progress = window.scrollY / 720;
  const positions = [
    orbitPosition(progress * 0.95 + 0.03, 64, 30, -18),
    orbitPosition(progress * -0.72 + 0.36, 31, 66, 36),
    orbitPosition(progress * 0.54 + 0.62, 58, 43, 9),
  ];

  orbitElements.forEach((element, index) => {
    const position = positions[index];
    element.setAttribute("transform", `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`);
  });
}

function requestOrbitUpdate() {
  if (!orbitFrame) orbitFrame = requestAnimationFrame(updateLogoOrbits);
}

function startIntroOrbits() {
  if (!introLogo?.contentDocument) return;

  const electrons = [
    introLogo.contentDocument.getElementById("electron-a"),
    introLogo.contentDocument.getElementById("electron-b"),
    introLogo.contentDocument.getElementById("electron-c"),
  ];
  if (!electrons.every(Boolean)) return;

  const startedAt = performance.now();
  const animate = (time) => {
    if (!document.documentElement.classList.contains("intro-pending")) return;
    const progress = (time - startedAt) / 2400;
    const positions = [
      orbitPosition(progress + 0.03, 64, 30, -18),
      orbitPosition(progress * -0.76 + 0.36, 31, 66, 36),
      orbitPosition(progress * 0.58 + 0.62, 58, 43, 9),
    ];

    electrons.forEach((electron, index) => {
      electron.setAttribute(
        "transform",
        `translate(${positions[index].x.toFixed(2)} ${positions[index].y.toFixed(2)})`
      );
    });
    introOrbitFrame = requestAnimationFrame(animate);
  };
  introOrbitFrame = requestAnimationFrame(animate);
}

function finishSiteIntro() {
  if (!siteIntro || !introLogoShell || !orbitLogo) return;

  const introRect = introLogoShell.getBoundingClientRect();
  const targetRect = orbitLogo.getBoundingClientRect();
  const introCenterX = introRect.left + introRect.width / 2;
  const introCenterY = introRect.top + introRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  introLogoShell.style.setProperty("--intro-x", `${targetCenterX - introCenterX}px`);
  introLogoShell.style.setProperty("--intro-y", `${targetCenterY - introCenterY}px`);
  introLogoShell.style.setProperty("--intro-scale", `${targetRect.width / introRect.width}`);

  document.documentElement.classList.add("intro-revealing");
  siteIntro.classList.add("is-exiting");

  window.setTimeout(() => {
    if (introOrbitFrame) cancelAnimationFrame(introOrbitFrame);
    document.documentElement.classList.remove("intro-pending", "intro-revealing");
    siteIntro.remove();
    try {
      localStorage.setItem("stavion-intro-seen", "1");
    } catch (error) {
      // Without storage, the intro is shown again on the next visit.
    }
  }, 900);
}

function initializeSiteIntro() {
  if (!document.documentElement.classList.contains("intro-pending") || !siteIntro) {
    siteIntro?.remove();
    return;
  }

  const connectIntroLogo = (attempt = 0) => {
    if (introLogo?.contentDocument?.getElementById("electron-a")) {
      startIntroOrbits();
      return;
    }
    if (attempt < 20) window.setTimeout(() => connectIntroLogo(attempt + 1), 80);
  };

  introLogo?.addEventListener("load", () => connectIntroLogo());
  connectIntroLogo();
  window.setTimeout(finishSiteIntro, 3000);
}

function setActiveNav(sectionId) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateActiveNav() {
  navFrame = null;
  const marker = Math.min(window.innerHeight * 0.48, 380);
  let activeSection = navSections[0];

  navSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) activeSection = section;
  });

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
    activeSection = navSections[navSections.length - 1];
  }

  if (activeSection) setActiveNav(activeSection.id);
}

function requestNavUpdate() {
  if (!navFrame) navFrame = requestAnimationFrame(updateActiveNav);
}

function setTheme(theme, persist = true) {
  const isLight = theme === "light";
  const isEnglish = document.documentElement.lang === "en";
  document.documentElement.dataset.theme = isLight ? "light" : "dark";

  if (themeToggle) {
    const label = isEnglish
      ? (isLight ? "Enable dark mode" : "Enable light mode")
      : (isLight ? "Activar modo oscuro" : "Activar modo claro");
    themeToggle.setAttribute("aria-label", label);
  }

  if (orbitLogo) {
    orbitElements = null;
    const logoPath = isLight
      ? "/assets/logo-stavion-light.svg?v=6"
      : "/assets/logo-stavion-dark.svg?v=6";
    if (orbitLogo.getAttribute("data") !== logoPath) {
      orbitLogo.setAttribute("data", logoPath);
    }
  }

  if (persist) localStorage.setItem("stavion-theme", isLight ? "light" : "dark");
}

function connectOrbitLogo(attempt = 0) {
  if (!orbitLogo) return;

  const svgDocument = orbitLogo.contentDocument;
  const elements = [
    svgDocument?.getElementById("electron-a"),
    svgDocument?.getElementById("electron-b"),
    svgDocument?.getElementById("electron-c"),
  ];

  if (elements.every(Boolean)) {
    orbitElements = elements;
    updateLogoOrbits();
    return;
  }

  if (attempt < 20) {
    window.setTimeout(() => connectOrbitLogo(attempt + 1), 100);
  }
}

if (orbitLogo) {
  orbitLogo.addEventListener("load", () => connectOrbitLogo());
  connectOrbitLogo();
  window.addEventListener("scroll", requestOrbitUpdate, { passive: true });
}

if (themeToggle) {
  setTheme(document.documentElement.dataset.theme, false);
  themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });
}

if (navLinks.length) {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveNav(link.getAttribute("href").slice(1));
    });
  });
  window.addEventListener("scroll", requestNavUpdate, { passive: true });
  window.addEventListener("resize", requestNavUpdate, { passive: true });
  updateActiveNav();
}

initializeSiteIntro();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

animatedItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 6, 5) * 80}ms`;
  observer.observe(item);
});

window.addEventListener(
  "scroll",
  () => {
    const viewportCenter = window.innerHeight / 2;
    galleryImages.forEach((image) => {
      const rect = image.getBoundingClientRect();
      const distance = rect.top + rect.height / 2 - viewportCenter;
      const offset = Math.max(-18, Math.min(18, distance * -0.025));
      image.style.setProperty("--parallax-y", `${offset}px`);
    });
  },
  { passive: true }
);
