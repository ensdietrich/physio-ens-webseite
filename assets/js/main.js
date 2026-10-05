(() => {
  "use strict";

  /* ---------------------------------------------------------------------
   * Central business data — edit here once the practice details are final.
   * Every element with data-field="key" in the HTML mirrors this object.
   * ------------------------------------------------------------------- */
  const BUSINESS = {
    // addressLine1: "Musterstraße 1",
    // addressLine2: "55116 Mainz",
    // phone: "+49 (0) 6131 000000",
    // email: "info@physiotherapie-ens.de",
  };
  void BUSINESS; // placeholder hook for future centralised data-binding

  /* ---------------------------- Language toggle ---------------------------- */
  const root = document.documentElement;
  const langDeBtn = document.getElementById("langDe");
  const langEnBtn = document.getElementById("langEn");
  const STORAGE_KEY = "pe-lang";

  function applyLanguage(lang) {
    const nodes = document.querySelectorAll("[data-de]");
    nodes.forEach((el) => {
      const value = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-de");
      if (value === null) return;
      el.textContent = value;
    });

    document.querySelectorAll("[data-de-placeholder]").forEach((el) => {
      const value = lang === "en" ? el.getAttribute("data-en-placeholder") : el.getAttribute("data-de-placeholder");
      if (value !== null) el.setAttribute("placeholder", value);
    });

    document.querySelectorAll("[data-de-aria]").forEach((el) => {
      const value = lang === "en" ? el.getAttribute("data-en-aria") : el.getAttribute("data-de-aria");
      if (value !== null) el.setAttribute("aria-label", value);
    });

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const value = lang === "en" ? metaDesc.getAttribute("data-en") : metaDesc.getAttribute("data-de");
      if (value) metaDesc.setAttribute("content", value);
    }

    root.lang = lang;
    langDeBtn.setAttribute("aria-pressed", String(lang === "de"));
    langEnBtn.setAttribute("aria-pressed", String(lang === "en"));
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  let initialLang = "de";
  try {
    initialLang = localStorage.getItem(STORAGE_KEY) || "de";
  } catch (e) { /* storage unavailable */ }
  applyLanguage(initialLang);

  langDeBtn.addEventListener("click", () => applyLanguage("de"));
  langEnBtn.addEventListener("click", () => applyLanguage("en"));

  /* ---------------------------- Header scroll state ---------------------------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------- Mobile navigation ---------------------------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  function closeMobileNav() {
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function openMobileNav() {
    mobileNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.contains("is-open");
    isOpen ? closeMobileNav() : openMobileNav();
  });
  mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });

  /* ---------------------------- Reveal on scroll ---------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            entry.target.style.setProperty("--i", index % 6);
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // Safety net: a large/instant scroll jump (scrollbar drag, Page Down,
    // programmatic jump) can skip over elements without ever rendering a
    // frame where they intersect, leaving them permanently hidden. Force-
    // reveal anything that has already passed the viewport on scroll/resize.
    let ticking = false;
    const forceRevealPassed = () => {
      ticking = false;
      revealEls.forEach((el) => {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    };
    const scheduleForceReveal = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(forceRevealPassed);
    };
    window.addEventListener("scroll", scheduleForceReveal, { passive: true });
    window.addEventListener("resize", scheduleForceReveal);
    scheduleForceReveal();
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------- Hero video controls ---------------------------- */
  const heroVideo = document.getElementById("heroVideo");
  const videoToggle = document.getElementById("videoToggle");

  if (heroVideo && videoToggle) {
    if (prefersReducedMotion) {
      heroVideo.pause();
      videoToggle.setAttribute("data-state", "paused");
    }

    videoToggle.addEventListener("click", () => {
      if (heroVideo.paused) {
        heroVideo.play();
        videoToggle.setAttribute("data-state", "playing");
        videoToggle.setAttribute("aria-label", root.lang === "en" ? "Pause video" : "Video pausieren");
      } else {
        heroVideo.pause();
        videoToggle.setAttribute("data-state", "paused");
        videoToggle.setAttribute("aria-label", root.lang === "en" ? "Play video" : "Video abspielen");
      }
    });

    // Pause the hero video once it scrolls out of view to save resources.
    if ("IntersectionObserver" in window) {
      const heroIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && !heroVideo.paused) {
              heroVideo.pause();
            } else if (entry.isIntersecting && videoToggle.getAttribute("data-state") === "playing" && heroVideo.paused && !prefersReducedMotion) {
              heroVideo.play();
            }
          });
        },
        { threshold: 0.1 }
      );
      heroIo.observe(heroVideo);
    }
  }

  /* ---------------------------- FAQ accordion (single-open) ---------------------------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------------------------------------------------------------------
   * Contact form
   * This is a static site with no backend. Until a form endpoint (e.g.
   * Formspree / Web3Forms) is wired up, submitting opens a pre-filled
   * mailto: draft to the practice address as a working fallback.
   * ------------------------------------------------------------------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const PRACTICE_EMAIL = "info@physiotherapie-ens.de";

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.classList.remove("is-visible", "success", "error");

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const phone = String(data.get("phone") || "").trim();
      const time = String(data.get("time") || "").trim();
      const message = String(data.get("message") || "").trim();

      const isEn = root.lang === "en";
      const subject = isEn ? `Appointment request from ${name}` : `Terminanfrage von ${name}`;
      const bodyLines = isEn
        ? [`Name: ${name}`, `E-mail: ${email}`, phone && `Phone: ${phone}`, time && `Preferred time: ${time}`, "", message]
        : [`Name: ${name}`, `E-Mail: ${email}`, phone && `Telefon: ${phone}`, time && `Bevorzugte Zeit: ${time}`, "", message];
      const body = bodyLines.filter(Boolean).join("\n");

      const mailto = `mailto:${PRACTICE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;

      status.textContent = isEn
        ? "Your e-mail app should now open with a pre-filled message — please press send there to complete your request."
        : "Ihr E-Mail-Programm sollte sich nun mit einer vorausgefüllten Nachricht öffnen — bitte dort abschließend senden, um die Anfrage abzuschließen.";
      status.classList.add("is-visible", "success");
      form.reset();
    });
  }
})();
