const PRODUCTS = [
  { key: "starter", label: "STARTER EDITION", name: "The ebook", description: "A clear starting point for exploring practical AI services.", price: 3500, featured: false, cta: "Buy the ebook", includes: ["The AI Side Hustle Secret PDF", "15 practical AI service paths", "Beginner-friendly explanations", "30-day implementation plan in the book"] },
  { key: "starterBundle", label: "STARTER BUNDLE", name: "Learn + apply toolkit", description: "The book plus practical resources to help you take action.", price: 5500, featured: true, cta: "Get the starter bundle", includes: ["Everything in the Starter Edition", "100 AI Prompts Vault", "AI Action Workbook", "First Client Message Kit", "30-Day AI Action Plan"] },
  { key: "completeToolkit", label: "COMPLETE TOOLKIT", name: "AI business toolkit", description: "A fuller set of guides, planners and ready-to-use resources.", price: 9500, featured: false, cta: "Get the complete toolkit", includes: ["Everything in the Starter Bundle", "Pricing worksheet + client tracker", "Service-launch checklist", "300 AI prompts organized by task", "30-day content calendar"] }
];
const money = (value) => `₦${Number(value).toLocaleString("en-NG")}`;

function renderOffers() {
  const grid = document.querySelector("#offer-grid");
  grid.innerHTML = PRODUCTS.map((product) => `
    <article class="offer-card ${product.featured ? "popular" : ""}">
      ${product.featured ? '<span class="popular-label">MOST POPULAR</span>' : ""}
      <span class="offer-name">${product.label}</span>
      <h3>${product.name}</h3>
      <p class="offer-desc">${product.description}</p>
      <div class="offer-price"><strong>${money(product.price)}</strong><span>one-time payment</span></div>
      <ul class="offer-includes">${product.includes.map((item) => `<li>${item}</li>`).join("")}</ul>
      <button class="button offer-cta" data-buy="${product.key}">${product.cta}<span aria-hidden="true">→</span></button>
      <p class="offer-foot">Digital product · Seller checkout</p>
    </article>`).join("");
  document.querySelectorAll("[data-buy]").forEach((button) => button.addEventListener("click", () => openSellerCheckout(button.dataset.buy)));
}

function openSellerCheckout(key) {
  const product = PRODUCTS.find((item) => item.key === key);
  trackEvent("InitiateCheckout", { content_name: product?.name || key, value: product?.price, currency: "NGN" });
  const url = window.SELLER_LINKS?.[key]?.trim();
  if (!url) {
    showToast("Seller checkout link not added yet. Add it in seller-links.js.");
    return;
  }
  window.location.assign(url);
}

function trackEvent(eventName, payload = {}) {
  if (typeof window.fbq === "function") window.fbq("track", eventName, payload);
}

function setupAnalytics() {
  const pixelId = window.SELLER_LINKS?.facebookPixelId?.trim();
  if (pixelId && /^[0-9]+$/.test(pixelId)) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq("init", pixelId);
    trackEvent("PageView");
    const offerSection = document.querySelector("#offers");
    if (offerSection && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackEvent("ViewContent", { content_name: "AI Side Hustle Secret packages" });
          observer.disconnect();
        }
      }, { threshold: 0.25 });
      observer.observe(offerSection);
    }
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 4200);
}



function setupProofCarousel() {
  const track = document.querySelector(".proof-gallery");
  const cards = [...(track?.querySelectorAll(".proof-card") || [])];
  const previous = document.querySelector("[data-proof-prev]");
  const next = document.querySelector("[data-proof-next]");
  const position = document.querySelector(".proof-position");
  const carouselArea = track?.closest(".proof-section") || track;
  if (!track || cards.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let paused = false;
  let timer = null;

  const stepSize = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || "0");
  const updatePosition = () => {
    if (!position) return;
    const step = stepSize();
    const first = Math.max(0, Math.round(track.scrollLeft / step));
    const shown = Math.max(1, Math.round(track.clientWidth / step));
    position.textContent = `${first + 1}–${Math.min(first + shown, cards.length)} of ${cards.length}`;
  };
  const move = (direction) => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    let target;
    if (direction > 0 && track.scrollLeft >= maxScroll - 2) target = 0;
    else if (direction < 0 && track.scrollLeft <= 2) target = maxScroll;
    else target = Math.max(0, Math.min(maxScroll, track.scrollLeft + stepSize() * direction));
    track.scrollTo({ left: target, behavior: reduceMotion.matches ? "auto" : "smooth" });
  };
  const stop = () => { window.clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (visible && !paused && !document.hidden && !reduceMotion.matches) {
      timer = window.setInterval(() => move(1), 4800);
    }
  };

  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  track.addEventListener("scroll", updatePosition, { passive: true });
  carouselArea.addEventListener("pointerenter", () => { paused = true; stop(); });
  carouselArea.addEventListener("pointerleave", () => { paused = false; start(); });
  carouselArea.addEventListener("focusin", () => { paused = true; stop(); });
  carouselArea.addEventListener("focusout", (event) => {
    if (!carouselArea.contains(event.relatedTarget)) { paused = false; start(); }
  });
  carouselArea.addEventListener("touchstart", () => {
    paused = true;
    stop();
    window.setTimeout(() => { paused = false; start(); }, 6500);
  }, { passive: true });
  document.addEventListener("visibilitychange", start);
  reduceMotion.addEventListener?.("change", start);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }, { threshold: 0.15 });
    observer.observe(track);
  } else {
    visible = true;
    start();
  }
  updatePosition();
}
function setupPageMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const selectors = [
    "main > section:not(.hero)",
    ".truth-inner > *",
    ".benefit-card",
    ".chapter-list div",
    ".steps-grid article",
    ".who-list span",
    ".proof-card",
    ".offer-card",
    ".faq-list details",
    ".author-monogram",
    ".floating-note"
  ];
  const targets = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
  targets.forEach((element) => {
    element.dataset.reveal = "";
    const siblings = [...element.parentElement.children].filter((child) => targets.includes(child));
    const index = siblings.indexOf(element);
    element.style.setProperty("--reveal-delay", `${Math.min(Math.max(index, 0) * 65, 260)}ms`);
  });

  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
  targets.forEach((element) => observer.observe(element));

  const progress = document.querySelector(".scroll-progress span");
  if (progress) {
    let queued = false;
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${available > 0 ? window.scrollY / available : 0})`;
      queued = false;
    };
    window.addEventListener("scroll", () => {
      if (!queued) {
        window.requestAnimationFrame(updateProgress);
        queued = true;
      }
    }, { passive: true });
    updateProgress();
  }
}
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.setAttribute("aria-label", open ? "Open menu" : "Close menu");
  navigation.classList.toggle("open", !open);
});
navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));
document.querySelector("#year").textContent = new Date().getFullYear();
renderOffers();
setupAnalytics();
setupPageMotion();
setupProofCarousel();






