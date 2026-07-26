// ============================================================
// Artem Mikhailov — Portfolio
// Mobile menu, masked hero reveal, scroll choreography,
// active-nav highlighting, language bars, footer year.
// ============================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

// Close mobile menu after clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// ---------- Hero masked-line reveal (plays once on load) ----------
requestAnimationFrame(() => {
  document.querySelector(".hero").classList.add("lines-in");
});

// ---------- Nav hide on scroll down / reveal on scroll up ----------
const nav = document.querySelector(".nav");
let lastY = window.scrollY;
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  // keep visible near the top or when the mobile menu is open
  if (y < 120 || navLinks.classList.contains("open")) {
    nav.classList.remove("hidden");
  } else if (y > lastY + 6) {
    nav.classList.add("hidden");
  } else if (y < lastY - 6) {
    nav.classList.remove("hidden");
  }
  lastY = y;
  ticking = false;
}

if (!prefersReducedMotion) {
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
}

// ---------- Scroll-reveal (single elements) ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- Staggered groups ----------
const staggerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        staggerObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".stagger").forEach((el) => staggerObserver.observe(el));

// ---------- Animate language progress bars when visible ----------
const progressObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
        progressObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".progress-bar").forEach((el) => progressObserver.observe(el));

// ---------- Highlight active section in nav ----------
const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);

sections.forEach((s) => sectionObserver.observe(s));

// ---------- Typewriter: hero greeting ----------
// Types the mono greeting char-by-char after the masked reveal settles.
// With reduced motion the full text is already in the markup — nothing to do.
const typeTarget = document.getElementById("typeTarget");

if (typeTarget && !prefersReducedMotion) {
  const fullText = typeTarget.dataset.text || typeTarget.textContent;
  typeTarget.textContent = "";

  setTimeout(() => {
    let i = 0;
    const tick = () => {
      typeTarget.textContent = fullText.slice(0, ++i);
      if (i < fullText.length) setTimeout(tick, 45);
    };
    tick();
  }, 500);
}

// ---------- Subtle tilt on project cards ----------
// Pointer-fine devices only; angles are small (max ~2.5deg) so text stays readable.
const finePointer = window.matchMedia("(pointer: fine)").matches;

if (finePointer && !prefersReducedMotion) {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
      // spotlight position for the ::before glow
      card.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

// ---------- Parallax accent ----------
// The aurora layer floats slower than the hero content while scrolling.
// Transform-only, driven by one rAF-throttled scroll handler.
const heroBg = document.querySelector(".hero-bg");

if (heroBg && !prefersReducedMotion) {
  let parallaxTicking = false;

  const applyParallax = () => {
    const vh = window.innerHeight;
    if (window.scrollY < vh * 1.2) {
      heroBg.style.transform = `translate3d(0, ${(window.scrollY * 0.12).toFixed(1)}px, 0)`;
    }
    parallaxTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!parallaxTicking) {
        requestAnimationFrame(applyParallax);
        parallaxTicking = true;
      }
    },
    { passive: true }
  );
}

// ---------- Scroll progress bar ----------
const scrollProgress = document.querySelector(".scroll-progress");

if (scrollProgress) {
  let progressTicking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${max > 0 ? (window.scrollY / max).toFixed(4) : 0})`;
    progressTicking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!progressTicking) {
        requestAnimationFrame(updateProgress);
        progressTicking = true;
      }
    },
    { passive: true }
  );
  updateProgress();
}

// ---------- Cursor glow — soft halo trailing the pointer ----------
if (finePointer && !prefersReducedMotion) {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let gx = -500, gy = -500, cx = gx, cy = gy, glowVisible = false;

  window.addEventListener(
    "mousemove",
    (e) => {
      gx = e.clientX;
      gy = e.clientY;
      if (!glowVisible) {
        glow.classList.add("on");
        glowVisible = true;
      }
    },
    { passive: true }
  );

  // lerp loop — glow trails the cursor with a soft delay
  (function trail() {
    cx += (gx - cx) * 0.12;
    cy += (gy - cy) * 0.12;
    glow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    requestAnimationFrame(trail);
  })();
}

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
