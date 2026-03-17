// ========================================
// Natis Fine Creation — Public JS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initScrollAnimations();
  initParticles();
  initGalleryFilter();
  initLightbox();
  initContactForm();
});

function initNav() {
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  if (!nav) return;

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 50);
  });

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        toggle.classList.remove("open");
        links.classList.remove("open");
      });
    });
  }
}

function initScrollAnimations() {
  const elements = document.querySelectorAll(".fade-up, .fade-left, .fade-right");
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  elements.forEach((el, i) => {
    el.style.transitionDelay = `${i % 3 * 0.15}s`;
    observer.observe(el);
  });
}

function initParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = (8 + Math.random() * 12) + "s";
    p.style.animationDelay = Math.random() * 10 + "s";
    p.style.width = p.style.height = (2 + Math.random() * 4) + "px";
    container.appendChild(p);
  }
}

function initGalleryFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".gallery-item");
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.category;
      items.forEach(item => {
        if (cat === "all" || item.dataset.category === cat) {
          item.style.display = "";
          requestAnimationFrame(() => item.classList.add("visible"));
        } else {
          item.style.display = "none";
          item.classList.remove("visible");
        }
      });
    });
  });
}

function initLightbox() {
  const items = document.querySelectorAll(".gallery-item, .preview-img-wrap");
  if (!items.length) return;

  let lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <button class="lightbox-close">✕</button>
    <img src="" alt="">
    <div class="lightbox-info"><h3></h3><p></p></div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector("img");
  const lbTitle = lightbox.querySelector("h3");
  const lbDesc = lightbox.querySelector("p");
  const lbClose = lightbox.querySelector(".lightbox-close");

  items.forEach(item => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img");
      const overlay = item.querySelector(".gallery-item-overlay, .preview-overlay");
      if (!img) return;
      lbImg.src = img.src;
      lbTitle.textContent = overlay?.querySelector("h3, .preview-title")?.textContent || "";
      lbDesc.textContent = overlay?.querySelector("p, .preview-cat")?.textContent || "";
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("contactStatus");
    const btn = form.querySelector('button[type="submit"]');

    const data = {
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      subject: form.querySelector('[name="subject"]').value,
      message: form.querySelector('[name="message"]').value,
      mathAnswer: form.querySelector('[name="mathAnswer"]').value,
      mathExpected: form.querySelector('[name="mathExpected"]').value,
      privacyAccepted: form.querySelector('[name="privacy"]').checked,
      honeypot: form.querySelector('[name="website_url"]').value
    };

    btn.disabled = true;
    btn.textContent = "Wird gesendet...";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        status.className = "form-status success";
        status.textContent = result.message || "Nachricht erfolgreich gesendet!";
        form.reset();
      } else {
        status.className = "form-status error";
        status.textContent = result.error || "Fehler beim Senden.";
      }
    } catch {
      status.className = "form-status error";
      status.textContent = "Verbindungsfehler. Bitte versuche es später erneut.";
    }

    btn.disabled = false;
    btn.textContent = "Nachricht senden";
  });
}
