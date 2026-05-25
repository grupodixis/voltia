const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const animatedItems = document.querySelectorAll("[data-animate]");
const galleryImages = document.querySelectorAll(".sector-card img, .matrix-grid img");

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
