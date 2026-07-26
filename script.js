// ============================================================
// Artem Mikhailov — Portfolio
// Mobile menu, masked hero reveal, scroll choreography,
// active-nav highlighting, language bars, footer year.
// ============================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const mobileNavQuery = window.matchMedia("(max-width: 760px)");

function setNavigationState(open) {
  navLinks.classList.toggle("open", open);
  navLinks.inert = mobileNavQuery.matches && !open;
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

setNavigationState(false);

navToggle.addEventListener("click", () => setNavigationState(!navLinks.classList.contains("open")));

// Close mobile menu after clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setNavigationState(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    setNavigationState(false);
    navToggle.focus();
  }
});

mobileNavQuery.addEventListener("change", () => setNavigationState(false));

// ---------- Hero masked-line reveal (plays once on load) ----------
requestAnimationFrame(() => {
  document.querySelector(".hero").classList.add("lines-in");
});

// ---------- Scroll choreography ----------
// One rAF scheduler keeps nav, parallax and progress work in the same frame.
const nav = document.querySelector(".nav");
const heroBg = document.querySelector(".hero-bg");
const scrollProgress = document.querySelector(".scroll-progress");
let lastY = window.scrollY;
let scrollFrame = 0;

function updateScrollChoreography() {
  const y = window.scrollY;
  nav.classList.toggle("is-scrolled", y > 12);

  if (prefersReducedMotion || y < 120 || navLinks.classList.contains("open")) {
    nav.classList.remove("hidden");
  } else if (y > lastY + 6) {
    nav.classList.add("hidden");
  } else if (y < lastY - 6) {
    nav.classList.remove("hidden");
  }

  if (heroBg && !prefersReducedMotion && y < window.innerHeight * 1.2) {
    heroBg.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
  }

  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
  }

  lastY = y;
  scrollFrame = 0;
}

function queueScrollChoreography() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollChoreography);
}

window.addEventListener("scroll", queueScrollChoreography, { passive: true });
updateScrollChoreography();

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
  { threshold: 0.12, rootMargin: "0px 0px -6%" }
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
          const isCurrent = a.getAttribute("href") === `#${entry.target.id}`;
          a.classList.toggle("active", isCurrent);
          if (isCurrent) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
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
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const updateTilt = () => {
      const r = card.getBoundingClientRect();
      const px = (pointerX - r.left) / r.width - 0.5;
      const py = (pointerY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
      // spotlight position for the ::before glow
      card.style.setProperty("--mx", `${(pointerX - r.left).toFixed(0)}px`);
      card.style.setProperty("--my", `${(pointerY - r.top).toFixed(0)}px`);
      pointerFrame = 0;
    };

    card.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(updateTilt);
    });
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
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
      startTrail();
    },
    { passive: true }
  );

  // lerp loop — glow trails the cursor with a soft delay
  let trailFrame;
  let trailRunning = false;
  const trail = () => {
    cx += (gx - cx) * 0.12;
    cy += (gy - cy) * 0.12;
    glow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    trailFrame = requestAnimationFrame(trail);
  };

  const startTrail = () => {
    if (!trailRunning && !document.hidden) {
      trailRunning = true;
      trail();
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(trailFrame);
      trailRunning = false;
    } else if (glowVisible) {
      startTrail();
    }
  });
}

// ---------- Footer year ----------

// ============================================================
// Project Detail Modal Logic (Feature Expansion)
// ============================================================

const projectModal = document.getElementById("projectModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalTechnologies = document.getElementById("modalTechnologies");
const modalLink = document.getElementById("modalLink");

/**
 * Shows the project detail modal with a smooth transition.
 */
function showModal(cardElement) {
    // 1. Extract Data (assuming data attributes are attached to project-card elements)
    const title = cardElement.dataset.title || "Project Title";
    const description = cardElement.dataset.description || "No description available.";
    const linkUrl = cardElement.dataset.link;
    const technologies = cardElement.dataset.technologies ? cardElement.dataset.technologies.split(',').map(t => t.trim()) : [];

    // 2. Populate Modal Content
    modalTitle.textContent = title;
    modalDescription.textContent = description;

    // Clear and repopulate technologies badges
    modalTechnologies.innerHTML = '';
    technologies.forEach(tech => {
        const badge = document.createElement('span');
        badge.className = 'px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200';
        badge.textContent = tech;
        modalTechnologies.appendChild(badge);
    });

    // Set link
    if (linkUrl) {
        modalLink.href = linkUrl;
        modalLink.style.display = 'inline-flex'; // Show the button if a link exists
    } else {
        modalLink.style.display = 'none'; // Hide the button otherwise
    }

    // 3. Transition In (CSS classes handle the visual transition)
    projectModal.classList.remove("opacity-0", "pointer-events-none");
    projectModal.classList.add("opacity-100");
    document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
}

/**
 * Hides the project detail modal with a smooth transition.
 */
function hideModal() {
    // 1. Transition Out
    projectModal.classList.remove("opacity-100");
    projectModal.classList.add("opacity-0", "pointer-events-none");

    // 2. Cleanup and Reset after transition ends (300ms defined in CSS)
    setTimeout(() => {
        document.body.style.overflow = ''; // Restore body scroll
    }, 300);
}


// --- Event Listeners for Modal ---

// Close button listener
closeModalButton.addEventListener("click", hideModal);

// Click outside modal background to close
projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
        hideModal();
    }
});

// Keyboard escape key handler to close modal
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !projectModal.classList.contains("opacity-0")) {
        hideModal();
    }
});


// --- Event Delegation for Project Cards ---

/**
 * Attaches a single click listener to the container, delegating the event
 * to handle clicks on project cards efficiently.
 */
function initializeProjectCardListeners() {
    const projectsGrid = document.querySelector(".projects-grid");
    if (!projectsGrid) return;

    projectsGrid.addEventListener("click", (event) => {
        // Check if the clicked element or its ancestor is a project card
        const cardElement = event.target.closest(".project-card");
        if (cardElement) {
            showModal(cardElement);
        }
    });
}

// Initialize listeners once all DOM elements are ready
document.addEventListener("DOMContentLoaded", initializeProjectCardListeners);
