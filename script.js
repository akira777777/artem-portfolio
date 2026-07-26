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
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============================================================
// Project Detail Modal Logic (Feature Expansion)
// ============================================================

const projectModal = document.getElementById("projectModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalTechnologies = document.getElementById("modalTechnologies");
const modalLink = document.getElementById("modalLink");
const modalImage = document.getElementById("modalImage");
const modalRole = document.getElementById("modalRole");
const modalOutcome = document.getElementById("modalOutcome");

/** Element that opened the modal — focus returns here on close. */
let lastModalTrigger = null;

/**
 * Shows the project detail modal with a smooth transition.
 */
function showModal(cardElement) {
    lastModalTrigger = cardElement;

    // 1. Extract data from the card DOM so the modal works without data attributes
    const title = cardElement.querySelector(".project-name")?.textContent?.trim() || "Project";
    const description = cardElement.querySelector(".project-desc")?.textContent?.trim() || "No description available.";
    const linkUrl = cardElement.querySelector(".project-foot .link-arrow")?.href;
    const technologies = Array.from(cardElement.querySelectorAll(".tag-list li")).map(li => li.textContent.trim());

    // 2. Populate modal content
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalRole.textContent = cardElement.dataset.role || "—";
    modalOutcome.textContent = cardElement.dataset.outcome || "—";

    if (cardElement.dataset.img) {
        modalImage.src = cardElement.dataset.img;
        modalImage.alt = `Preview of ${title}`;
        modalImage.parentElement.style.display = "";
    } else {
        modalImage.removeAttribute("src");
        modalImage.parentElement.style.display = "none";
    }

    // Clear and repopulate technology badges
    modalTechnologies.innerHTML = '';
    technologies.forEach(tech => {
        const badge = document.createElement('span');
        badge.textContent = tech;
        modalTechnologies.appendChild(badge);
    });

    // Set link
    if (linkUrl) {
        modalLink.href = linkUrl;
        modalLink.style.display = 'inline-flex';
    } else {
        modalLink.style.display = 'none';
    }

    // 3. Transition in (CSS handles the animation via the .open class)
    projectModal.classList.add("open");
    document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
    closeModalButton.focus();
}

/**
 * Hides the project detail modal with a smooth transition.
 */
function hideModal() {
    projectModal.classList.remove("open");

    // Restore body scroll after the CSS transition finishes (300ms)
    setTimeout(() => {
        if (!projectModal.classList.contains("open")) {
            document.body.style.overflow = '';
        }
    }, 300);

    // Return focus to the card that opened the modal
    if (lastModalTrigger) {
        lastModalTrigger.focus();
        lastModalTrigger = null;
    }
}


// --- Event listeners for modal ---

// Close button listener
closeModalButton.addEventListener("click", hideModal);

// Click outside modal content to close
projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
        hideModal();
    }
});

// Keyboard escape key handler to close modal + simple focus trap
document.addEventListener("keydown", (event) => {
    if (!projectModal.classList.contains("open")) return;
    if (event.key === "Escape") {
        hideModal();
        return;
    }
    if (event.key === "Tab") {
        const focusable = projectModal.querySelectorAll("button, a[href]");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
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
        // Let real links inside a card (live demo) work normally
        if (event.target.closest("a")) return;
        // Check if the clicked element or its ancestor is a project card
        const cardElement = event.target.closest(".project-card");
        if (cardElement) {
            showModal(cardElement);
        }
    });

    // Cards are role="button" — activate with Enter / Space
    projectsGrid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const cardElement = event.target.closest(".project-card");
        if (cardElement && event.target === cardElement) {
            event.preventDefault();
            showModal(cardElement);
        }
    });
}

// Initialize listeners once all DOM elements are ready
document.addEventListener("DOMContentLoaded", initializeProjectCardListeners);

// ============================================================
// Toast Notification System
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  
  const iconUse = type === 'success' ? '#i-check' : (type === 'sparkles' ? '#i-sparkles' : '#i-terminal');
  toast.innerHTML = `
    <svg class="icon"><use href="${iconUse}"/></svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  playUiSound(580, 'sine', 0.05);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ============================================================
// Web Audio API Synthesizer (UI Sound FX)
// ============================================================
let audioCtx = null;
let soundEnabled = localStorage.getItem('soundEnabled') === 'true';

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playUiSound(freq = 520, type = 'sine', duration = 0.04) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
}

const soundToggle = document.getElementById('soundToggle');
if (soundToggle) {
  const updateSoundUI = () => {
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback');
    soundToggle.innerHTML = soundEnabled
      ? `<svg class="icon"><use href="#i-volume"/></svg>`
      : `<svg class="icon"><use href="#i-volume-x"/></svg>`;
  };
  updateSoundUI();

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', String(soundEnabled));
    updateSoundUI();
    if (soundEnabled) playUiSound(660, 'sine', 0.08);
    showToast(soundEnabled ? 'Audio FX enabled 🔊' : 'Audio FX muted 🔇');
  });
}

// Global click sound for interactive elements
document.addEventListener('click', (e) => {
  if (e.target.closest('button, a, .filter-pill, .term-btn, .project-card')) {
    playUiSound(440, 'sine', 0.03);
  }
});

// ============================================================
// Theme Palette Switcher
// ============================================================
const themes = ['default', 'cyan', 'amber', 'emerald'];
let currentTheme = localStorage.getItem('userTheme') || 'default';

function applyTheme(themeName) {
  if (themeName === 'default') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', themeName);
  }
  currentTheme = themeName;
  localStorage.setItem('userTheme', themeName);
}

applyTheme(currentTheme);

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    applyTheme(nextTheme);
    showToast(`Accent theme: ${nextTheme.toUpperCase()}`, 'sparkles');
  });
}

// ============================================================
// Animated Stats Counters
// ============================================================
const statNumbers = document.querySelectorAll('.stat-number[data-count]');
if (statNumbers.length) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.count === '5' ? '+' : (el.dataset.count === '100' ? '%' : '');
          let current = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = `${current}${suffix}`;
          }, 30);
          statsObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  statNumbers.forEach((el) => statsObserver.observe(el));
}

// ============================================================
// Terminal / Developer Console
// ============================================================
const terminalBody = document.getElementById('terminalBody');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');

function appendTermLine(text, className = '') {
  if (!terminalBody) return;
  const line = document.createElement('div');
  line.className = `term-line ${className}`;
  line.innerHTML = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function handleTermCommand(cmdText) {
  const cmd = cmdText.trim().toLowerCase();
  if (!cmd) return;

  appendTermLine(`artem@portfolio ~ % ${cmdText}`, 'cmd-echo');

  switch (cmd) {
    case 'help':
      appendTermLine(`Available commands:<br/>
        • <span class="term-highlight">skills</span> - View technical stack<br/>
        • <span class="term-highlight">projects</span> - List deployed showcase projects<br/>
        • <span class="term-highlight">about</span> - Read bio & background<br/>
        • <span class="term-highlight">cv</span> - Open interactive CV modal<br/>
        • <span class="term-highlight">contact</span> - Get email, phone & Telegram<br/>
        • <span class="term-highlight">whoami</span> - Visitor info<br/>
        • <span class="term-highlight">sudo hire</span> - Direct offer channel<br/>
        • <span class="term-highlight">clear</span> - Clear terminal window`);
      break;

    case 'skills':
      appendTermLine(`<strong>Frontend:</strong> Next.js, React, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3<br/>
        <strong>Web Dev:</strong> REST APIs, Node.js, Vercel, Performance &amp; Lighthouse 100<br/>
        <strong>Foundations:</strong> IT Maturita (2024), SQL, Databases, OS, Networks, Git`);
      break;

    case 'projects':
      appendTermLine(`1. <strong>Barbershop Iron &amp; Steel</strong> (Next.js, Tailwind, Lighthouse 100)<br/>
        2. <strong>Rehabilitation Center Almaty</strong> (Next.js, TypeScript, SEO 98)<br/>
        3. <strong>SecretTravel Concierge</strong> (Next.js, Multilingual, Crypto 99)<br/>
        4. <strong>BETZ Sportsbook</strong> (Next.js, Live Odds 95)<br/>
        5. <strong>Vakalova Dental Clinic</strong> (Next.js, TypeScript, UI/UX 97)`);
      break;

    case 'about':
      appendTermLine(`Artem Mikhailov — Junior Frontend &amp; Web Developer in Prague.<br/>
        Graduated with Czech IT Maturita (2024). Passionate about fast, responsive, and accessible Next.js/TypeScript web apps.`);
      break;

    case 'cv':
      showCvModal();
      appendTermLine(`Opening Curriculum Vitae modal...`);
      break;

    case 'contact':
      appendTermLine(`<strong>Email:</strong> artemmikhailov20031001@gmail.com<br/>
        <strong>Phone:</strong> +420 737 500 587<br/>
        <strong>Telegram:</strong> @liltrafficRUS<br/>
        <strong>GitHub:</strong> github.com/akira777777`);
      break;

    case 'whoami':
      appendTermLine(`You are a tech recruiter, engineering lead, or client exploring Artem's portfolio. Welcome!`);
      break;

    case 'sudo hire':
      appendTermLine(`<span class="term-highlight">ACCESS GRANTED! 🎉</span><br/>
        Artem has free access to the Czech labor market (no visa sponsorship needed).<br/>
        Email: artemmikhailov20031001@gmail.com`);
      showToast('Offer channel activated! 🎉', 'sparkles');
      break;

    case 'clear':
      if (terminalBody) terminalBody.innerHTML = '';
      break;

    default:
      appendTermLine(`command not found: '${cmdText}'. Type <span class="term-highlight">'help'</span> for available commands.`);
  }
}

if (terminalForm && terminalInput) {
  terminalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = terminalInput.value;
    terminalInput.value = '';
    handleTermCommand(val);
  });

  document.querySelectorAll('.term-btn[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleTermCommand(btn.dataset.cmd);
    });
  });
}

// ============================================================
// Projects Live Search & Category Filtering
// ============================================================
const projectSearchInput = document.getElementById('projectSearch');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const projectFilterPills = document.querySelectorAll('.projects-filter-pills .filter-pill');
const projectsCountLabel = document.getElementById('projectsCount');
const projectsEmptyState = document.getElementById('projectsEmpty');
const resetProjectsFilterBtn = document.getElementById('resetProjectsFilter');
const projectCards = document.querySelectorAll('.projects-grid .project-card');

let activeCategoryFilter = 'all';

function filterProjects() {
  const query = (projectSearchInput?.value || '').trim().toLowerCase();
  let visibleCount = 0;

  projectCards.forEach((card) => {
    const tags = (card.dataset.tags || '').toLowerCase();
    const name = (card.querySelector('.project-name')?.textContent || '').toLowerCase();
    const desc = (card.querySelector('.project-desc')?.textContent || '').toLowerCase();
    const cardTechs = Array.from(card.querySelectorAll('.tag-list li')).map(li => li.textContent.toLowerCase()).join(' ');

    const matchesCategory = activeCategoryFilter === 'all' || tags.includes(activeCategoryFilter);
    const matchesSearch = !query || name.includes(query) || desc.includes(query) || cardTechs.includes(query);

    if (matchesCategory && matchesSearch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (projectsCountLabel) {
    projectsCountLabel.textContent = `Showing ${visibleCount} of ${projectCards.length} projects`;
  }

  if (projectsEmptyState) {
    projectsEmptyState.classList.toggle('hidden', visibleCount > 0);
  }

  if (clearSearchBtn) {
    clearSearchBtn.hidden = !query;
  }
}

if (projectSearchInput) {
  projectSearchInput.addEventListener('input', filterProjects);
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (projectSearchInput) {
      projectSearchInput.value = '';
      filterProjects();
      projectSearchInput.focus();
    }
  });
}

projectFilterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    projectFilterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategoryFilter = pill.dataset.filter || 'all';
    filterProjects();
  });
});

if (resetProjectsFilterBtn) {
  resetProjectsFilterBtn.addEventListener('click', () => {
    activeCategoryFilter = 'all';
    if (projectSearchInput) projectSearchInput.value = '';
    projectFilterPills.forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));
    filterProjects();
  });
}

// ============================================================
// Interactive Tech Stack Cross-Highlighting
// ============================================================
document.querySelectorAll('.skills-grid .tag-list li[data-tech]').forEach((skillTag) => {
  skillTag.addEventListener('click', () => {
    const techName = skillTag.dataset.tech.toLowerCase();
    
    // Highlight matching cards
    let matched = 0;
    projectCards.forEach((card) => {
      const cardTechs = Array.from(card.querySelectorAll('.tag-list li')).map(li => li.textContent.toLowerCase());
      const isMatch = cardTechs.some(t => t.includes(techName) || techName.includes(t));
      if (isMatch) {
        card.classList.add('highlighted-by-tech');
        matched++;
        setTimeout(() => card.classList.remove('highlighted-by-tech'), 2500);
      }
    });

    if (matched > 0) {
      showToast(`Highlighted ${matched} project(s) matching '${skillTag.dataset.tech}'!`, 'sparkles');
      const projectsSec = document.getElementById('projects');
      if (projectsSec) projectsSec.scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast(`No projects tag matches '${skillTag.dataset.tech}' directly.`);
    }
  });
});

// ============================================================
// Contact Form & Quick Presets Validation
// ============================================================
const contactForm = document.getElementById('contactForm');
const contactSubjectInput = document.getElementById('contactSubject');
const presetBtns = document.querySelectorAll('.preset-btn');

presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (contactSubjectInput) {
      contactSubjectInput.value = btn.dataset.subject || '';
      contactSubjectInput.focus();
    }
    const messageInput = document.getElementById('contactMessage');
    if (messageInput) messageInput.focus();
    showToast(`Subject set to "${btn.dataset.subject}"`);
  });
});

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');

    const nameErr = document.getElementById('nameError');
    const emailErr = document.getElementById('emailError');
    const msgErr = document.getElementById('messageError');

    if (nameErr) nameErr.textContent = '';
    if (emailErr) emailErr.textContent = '';
    if (msgErr) msgErr.textContent = '';

    let valid = true;

    if (!nameInput?.value.trim()) {
      if (nameErr) nameErr.textContent = 'Please enter your name.';
      valid = false;
    }

    const emailVal = emailInput?.value.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      if (emailErr) emailErr.textContent = 'Please enter your email.';
      valid = false;
    } else if (!emailRegex.test(emailVal)) {
      if (emailErr) emailErr.textContent = 'Please enter a valid email address.';
      valid = false;
    }

    if (!messageInput?.value.trim() || messageInput.value.trim().length < 10) {
      if (msgErr) msgErr.textContent = 'Message must be at least 10 characters.';
      valid = false;
    }

    if (!valid) return;

    const submitBtn = document.getElementById('contactSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Sending...`;
    }

    setTimeout(() => {
      showToast('Thank you! Your message has been sent to Artem.', 'success');
      contactForm.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg class="icon"><use href="#i-send"/></svg><span>Send Message</span>`;
      }
    }, 1000);
  });
}

// Copy to clipboard actions
document.querySelectorAll('.copy-action-btn[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied "${text}" to clipboard!`, 'success');
      }).catch(() => {
        showToast(`Failed to copy to clipboard.`);
      });
    }
  });
});

// ============================================================
// CV Modal Handler
// ============================================================
const cvModal = document.getElementById('cvModal');
const closeCvModalButton = document.getElementById('closeCvModalButton');
const heroCvBtn = document.getElementById('heroCvBtn');
const navCvBtn = document.getElementById('navCvBtn');
const printCvBtn = document.getElementById('printCvBtn');

function showCvModal() {
  if (!cvModal) return;
  cvModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (closeCvModalButton) closeCvModalButton.focus();
}

function hideCvModal() {
  if (!cvModal) return;
  cvModal.classList.remove('open');
  setTimeout(() => {
    if (!cvModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }, 300);
}

if (heroCvBtn) heroCvBtn.addEventListener('click', showCvModal);
if (navCvBtn) navCvBtn.addEventListener('click', showCvModal);
if (closeCvModalButton) closeCvModalButton.addEventListener('click', hideCvModal);

if (cvModal) {
  cvModal.addEventListener('click', (e) => {
    if (e.target === cvModal) hideCvModal();
  });
}

if (printCvBtn) {
  printCvBtn.addEventListener('click', () => {
    window.print();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cvModal?.classList.contains('open')) {
    hideCvModal();
  }
});

