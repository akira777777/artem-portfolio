// @ts-check

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNavQuery = window.matchMedia("(max-width: 760px)");
const finePointerQuery = window.matchMedia("(pointer: fine)");

/** @param {string} key */
function readPreference(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** @param {string} key @param {string} value */
function writePreference(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preferences are optional when storage is unavailable.
  }
}

/** @param {Element | null} parent @param {string} href */
function appendSpriteIcon(parent, href) {
  if (!parent) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", href);
  svg.appendChild(use);
  parent.appendChild(svg);
}

/** @param {string} message @param {"info" | "success" | "sparkles" | "error"} [type] */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!(container instanceof HTMLElement)) return;

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  const iconHref =
    type === "success"
      ? "#i-check"
      : type === "sparkles"
        ? "#i-sparkles"
        : "#i-terminal";
  appendSpriteIcon(toast, iconHref);

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 250);
  }, 3400);
}

// Navigation
const nav = document.querySelector(".nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

/** @param {boolean} open */
function setNavigationState(open) {
  if (!(navToggle instanceof HTMLButtonElement) || !(navLinks instanceof HTMLElement)) return;
  navLinks.classList.toggle("open", open);
  navLinks.inert = mobileNavQuery.matches && !open;
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

if (navToggle instanceof HTMLButtonElement && navLinks instanceof HTMLElement) {
  setNavigationState(false);
  navToggle.addEventListener("click", () => {
    setNavigationState(!navLinks.classList.contains("open"));
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavigationState(false));
  });
  mobileNavQuery.addEventListener("change", () => setNavigationState(false));
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    navLinks instanceof HTMLElement &&
    navLinks.classList.contains("open")
  ) {
    setNavigationState(false);
    if (navToggle instanceof HTMLButtonElement) navToggle.focus();
  }
});

// Hero, scroll and reveal choreography
requestAnimationFrame(() => document.querySelector(".hero")?.classList.add("lines-in"));

const heroBg = document.querySelector(".hero-bg");
const scrollProgress = document.querySelector(".scroll-progress");
let lastScrollY = window.scrollY;
let scrollFrame = 0;

function updateScrollChoreography() {
  const y = window.scrollY;
  nav?.classList.toggle("is-scrolled", y > 12);

  if (nav) {
    if (
      reducedMotionQuery.matches ||
      y < 120 ||
      navLinks?.classList.contains("open")
    ) {
      nav.classList.remove("hidden");
    } else if (y > lastScrollY + 6) {
      nav.classList.add("hidden");
    } else if (y < lastScrollY - 6) {
      nav.classList.remove("hidden");
    }
  }

  if (
    heroBg instanceof HTMLElement &&
    !reducedMotionQuery.matches &&
    y < window.innerHeight * 1.2
  ) {
    heroBg.style.transform = `translate3d(0, ${(y * 0.1).toFixed(1)}px, 0)`;
  }

  if (scrollProgress instanceof HTMLElement) {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${maximum > 0 ? (y / maximum).toFixed(4) : 0})`;
  }

  lastScrollY = y;
  scrollFrame = 0;
}

function queueScrollChoreography() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollChoreography);
}

window.addEventListener("scroll", queueScrollChoreography, { passive: true });
updateScrollChoreography();

/** @param {string} selector @param {string} visibleClass @param {IntersectionObserverInit} options */
function revealOnIntersection(selector, visibleClass, options) {
  const elements = document.querySelectorAll(selector);
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add(visibleClass));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(visibleClass);
      observer.unobserve(entry.target);
    });
  }, options);

  elements.forEach((element) => observer.observe(element));
}

revealOnIntersection(".reveal", "visible", {
  threshold: 0.12,
  rootMargin: "0px 0px -6%"
});
revealOnIntersection(".stagger", "in", { threshold: 0.1 });
revealOnIntersection(".progress-bar", "animate", { threshold: 0.5 });

const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((anchor) => {
          const isCurrent = anchor.getAttribute("href") === `#${entry.target.id}`;
          anchor.classList.toggle("active", isCurrent);
          if (isCurrent) anchor.setAttribute("aria-current", "location");
          else anchor.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

const typeTarget = document.getElementById("typeTarget");
if (typeTarget instanceof HTMLElement && !reducedMotionQuery.matches) {
  const fullText = typeTarget.dataset.text || typeTarget.textContent || "";
  typeTarget.textContent = "";
  window.setTimeout(() => {
    let index = 0;
    const tick = () => {
      typeTarget.textContent = fullText.slice(0, ++index);
      if (index < fullText.length) window.setTimeout(tick, 45);
    };
    tick();
  }, 450);
}

if (finePointerQuery.matches && !reducedMotionQuery.matches) {
  document.querySelectorAll(".project-card").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const updateTilt = () => {
      const rect = element.getBoundingClientRect();
      const horizontal = (pointerX - rect.left) / rect.width - 0.5;
      const vertical = (pointerY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--ry", `${(horizontal * 4).toFixed(2)}deg`);
      element.style.setProperty("--rx", `${(-vertical * 4).toFixed(2)}deg`);
      element.style.setProperty("--mx", `${(pointerX - rect.left).toFixed(0)}px`);
      element.style.setProperty("--my", `${(pointerY - rect.top).toFixed(0)}px`);
      pointerFrame = 0;
    };

    element.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(updateTilt);
    });
    element.addEventListener("pointerleave", () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    });
  });
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

// Optional audio and accent theme preferences
/** @type {AudioContext | null} */
let audioContext = null;
let soundEnabled = readPreference("soundEnabled") === "true";

function initializeAudio() {
  if (!audioContext) {
    const extendedWindow =
      /** @type {Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }} */ (
        window
      );
    const AudioContextConstructor = window.AudioContext || extendedWindow.webkitAudioContext;
    if (AudioContextConstructor) audioContext = new AudioContextConstructor();
  }
  if (audioContext?.state === "suspended") void audioContext.resume();
}

/** @param {number} [frequency] @param {OscillatorType} [type] @param {number} [duration] */
function playUiSound(frequency = 520, type = "sine", duration = 0.04) {
  if (!soundEnabled) return;
  try {
    initializeAudio();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + duration
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio feedback must never block the interface.
  }
}

const soundToggle = document.getElementById("soundToggle");
function updateSoundButton() {
  if (!(soundToggle instanceof HTMLButtonElement)) return;
  soundToggle.setAttribute(
    "aria-label",
    soundEnabled ? "Mute audio feedback" : "Enable audio feedback"
  );
  soundToggle.replaceChildren();
  appendSpriteIcon(soundToggle, soundEnabled ? "#i-volume" : "#i-volume-x");
}

if (soundToggle instanceof HTMLButtonElement) {
  updateSoundButton();
  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    writePreference("soundEnabled", String(soundEnabled));
    updateSoundButton();
    if (soundEnabled) playUiSound(660, "sine", 0.08);
    showToast(soundEnabled ? "Audio feedback enabled." : "Audio feedback muted.");
  });
}

const themes = ["default", "cyan", "amber", "emerald"];
const storedTheme = readPreference("userTheme");
let currentTheme = storedTheme && themes.includes(storedTheme) ? storedTheme : "default";

/** @param {string} themeName */
function applyTheme(themeName) {
  const safeTheme = themes.includes(themeName) ? themeName : "default";
  if (safeTheme === "default") document.body.removeAttribute("data-theme");
  else document.body.setAttribute("data-theme", safeTheme);
  currentTheme = safeTheme;
  writePreference("userTheme", safeTheme);
}

applyTheme(currentTheme);
const themeToggle = document.getElementById("themeToggle");
if (themeToggle instanceof HTMLButtonElement) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    applyTheme(nextTheme);
    showToast(`Accent theme: ${nextTheme}.`, "sparkles");
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("button, a, .filter-pill, .project-card")
  ) {
    playUiSound(440, "sine", 0.03);
  }
});

const statNumbers = document.querySelectorAll(".stat-number[data-count]");
if (statNumbers.length && "IntersectionObserver" in window) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
        const target = Number.parseInt(entry.target.dataset.count || "0", 10);
        const suffix = entry.target.dataset.suffix || "";
        if (reducedMotionQuery.matches) {
          entry.target.textContent = `${target}${suffix}`;
          statsObserver.unobserve(entry.target);
          return;
        }

        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const timer = window.setInterval(() => {
          current = Math.min(target, current + step);
          entry.target.textContent = `${current}${suffix}`;
          if (current >= target) window.clearInterval(timer);
        }, 35);
        statsObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  statNumbers.forEach((element) => statsObserver.observe(element));
}

// Accessible native dialog handling
const projectModal = document.getElementById("projectModal");
const cvModal = document.getElementById("cvModal");
/** @type {WeakMap<HTMLDialogElement, HTMLElement>} */
const dialogTriggers = new WeakMap();

/** @param {HTMLDialogElement} dialog @param {HTMLElement | null} trigger */
function openDialog(dialog, trigger) {
  document.querySelectorAll("dialog[open]").forEach((openDialogElement) => {
    if (
      openDialogElement instanceof HTMLDialogElement &&
      openDialogElement !== dialog
    ) {
      openDialogElement.close();
    }
  });
  if (trigger) dialogTriggers.set(dialog, trigger);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("dialog-open");
  requestAnimationFrame(() => {
    const initialFocus = dialog.querySelector(
      "[data-autofocus], button, a[href], input, textarea, select"
    );
    if (initialFocus instanceof HTMLElement) initialFocus.focus();
  });
}

/** @param {HTMLDialogElement} dialog */
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

/** @param {HTMLDialogElement} dialog */
function registerDialog(dialog) {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) {
      document.body.classList.remove("dialog-open");
    }
    const trigger = dialogTriggers.get(dialog);
    dialogTriggers.delete(dialog);
    trigger?.focus({ preventScroll: true });
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), a[href]:not([hidden]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (element) =>
        element instanceof HTMLElement &&
        !element.hidden &&
        element.getAttribute("aria-hidden") !== "true"
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement)) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

if (projectModal instanceof HTMLDialogElement) registerDialog(projectModal);
if (cvModal instanceof HTMLDialogElement) registerDialog(cvModal);

// Project data, filters and case-study modal
const projectCards =
  /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll(".projects-grid .project-card")).filter(
      (element) => element instanceof HTMLElement
    )
  );

/** @param {HTMLElement} card @returns {Project} */
function readProject(card) {
  const title = card.querySelector(".project-name")?.textContent?.trim() || "";
  const description = card.querySelector(".project-desc")?.textContent?.trim() || "";
  const stack = Array.from(card.querySelectorAll(".tag-list li"))
    .map((item) => item.textContent?.trim() || "")
    .filter(Boolean);
  const liveLink = card.querySelector(".project-foot a[href]");
  const rawStatus = card.dataset.status || "public-demo";
  const validStatuses = ["public-demo", "personal", "concept", "client"];
  const status =
    /** @type {Project["status"]} */ (
      validStatuses.includes(rawStatus) ? rawStatus : "public-demo"
    );

  return {
    id: card.dataset.projectId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    description,
    role: card.dataset.role || "",
    outcome: card.dataset.outcome || undefined,
    stack,
    keywords: (card.dataset.keywords || "").split(/\s+/).filter(Boolean),
    image: card.dataset.img || "",
    liveUrl: liveLink instanceof HTMLAnchorElement ? liveLink.href : undefined,
    repositoryUrl: undefined,
    featured: card.classList.contains("featured"),
    status,
    challenge: card.dataset.challenge || undefined,
    solution: card.dataset.solution || undefined
  };
}

const projectEntries = projectCards.map((card) => ({
  card,
  project: readProject(card)
}));

const modalTitle = document.getElementById("modalTitle");
const modalStatus = document.getElementById("modalStatus");
const modalDescription = document.getElementById("modalDescription");
const modalTechnologies = document.getElementById("modalTechnologies");
const modalLink = document.getElementById("modalLink");
const modalMedia = document.getElementById("modalMedia");
const modalImage = document.getElementById("modalImage");
const modalRole = document.getElementById("modalRole");
const modalRoleRow = document.getElementById("modalRoleRow");
const modalOutcome = document.getElementById("modalOutcome");
const modalOutcomeRow = document.getElementById("modalOutcomeRow");
const modalChallenge = document.getElementById("modalChallenge");
const modalChallengeSection = document.getElementById("modalChallengeSection");
const modalSolution = document.getElementById("modalSolution");
const modalSolutionSection = document.getElementById("modalSolutionSection");
const closeModalButton = document.getElementById("closeModalButton");

const projectStatusLabels = {
  "public-demo": "Public demo",
  personal: "Personal project",
  concept: "Concept",
  client: "Client project"
};

/** @param {HTMLElement | null} row @param {HTMLElement | null} valueElement @param {string | undefined} value */
function setOptionalText(row, valueElement, value) {
  if (!row || !valueElement) return;
  const hasValue = Boolean(value?.trim());
  row.hidden = !hasValue;
  valueElement.textContent = value || "";
}

/** @param {Project} project @param {HTMLElement} trigger */
function showProject(project, trigger) {
  if (!(projectModal instanceof HTMLDialogElement)) return;
  if (modalTitle) modalTitle.textContent = project.title;
  if (modalStatus) modalStatus.textContent = projectStatusLabels[project.status];
  if (modalDescription) modalDescription.textContent = project.description;

  setOptionalText(modalRoleRow, modalRole, project.role);
  setOptionalText(modalOutcomeRow, modalOutcome, project.outcome);
  setOptionalText(modalChallengeSection, modalChallenge, project.challenge);
  setOptionalText(modalSolutionSection, modalSolution, project.solution);

  if (modalTechnologies) {
    modalTechnologies.replaceChildren();
    project.stack.forEach((technology) => {
      const badge = document.createElement("span");
      badge.textContent = technology;
      modalTechnologies.appendChild(badge);
    });
  }

  if (
    modalImage instanceof HTMLImageElement &&
    modalMedia instanceof HTMLElement &&
    project.image
  ) {
    modalImage.src = project.image;
    modalImage.alt = `Preview of ${project.title}`;
    modalMedia.hidden = false;
  } else if (modalMedia instanceof HTMLElement) {
    modalMedia.hidden = true;
  }

  if (modalLink instanceof HTMLAnchorElement) {
    modalLink.hidden = !project.liveUrl;
    if (project.liveUrl) modalLink.href = project.liveUrl;
    else modalLink.removeAttribute("href");
    modalLink.setAttribute(
      "aria-label",
      `Open ${project.title} live demo in a new tab`
    );
  }

  openDialog(projectModal, trigger);
}

projectEntries.forEach(({ card, project }) => {
  const detailsButton = card.querySelector(".project-details-button");
  if (detailsButton instanceof HTMLButtonElement) {
    detailsButton.addEventListener("click", () => showProject(project, detailsButton));
  }
});

if (closeModalButton instanceof HTMLButtonElement && projectModal instanceof HTMLDialogElement) {
  closeModalButton.dataset.autofocus = "true";
  closeModalButton.addEventListener("click", () => closeDialog(projectModal));
}

document.querySelectorAll(".project-media img").forEach((element) => {
  if (!(element instanceof HTMLImageElement)) return;
  element.addEventListener("error", () => {
    const media = element.closest(".project-media");
    if (!(media instanceof HTMLElement)) return;
    element.hidden = true;
    if (!media.querySelector(".project-image-fallback")) {
      const fallback = document.createElement("span");
      fallback.className = "project-image-fallback";
      fallback.textContent = "Preview temporarily unavailable";
      media.appendChild(fallback);
    }
  });
});

const projectSearchInput = document.getElementById("projectSearch");
const clearSearchButton = document.getElementById("clearSearchBtn");
const filterButtons =
  /** @type {HTMLButtonElement[]} */ (
    Array.from(document.querySelectorAll(".projects-filter-pills .filter-pill")).filter(
      (element) => element instanceof HTMLButtonElement
    )
  );
const projectsCount = document.getElementById("projectsCount");
const projectsEmpty = document.getElementById("projectsEmpty");
const resetProjectsFilter = document.getElementById("resetProjectsFilter");
const projectsGrid = document.getElementById("projectsGrid");
let activeCategoryFilter = "all";

/** @param {string} value */
function normalizeSearchText(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** @param {boolean} [syncUrl] */
function filterProjects(syncUrl = true) {
  const query =
    projectSearchInput instanceof HTMLInputElement
      ? normalizeSearchText(projectSearchInput.value)
      : "";
  const queryTerms = query.split(" ").filter(Boolean);
  let visibleCount = 0;

  projectEntries.forEach(({ card, project }) => {
    const tags = (card.dataset.tags || "").split(/\s+/);
    const matchesCategory =
      activeCategoryFilter === "all" || tags.includes(activeCategoryFilter);
    const searchable = normalizeSearchText(
      [
        project.title,
        project.description,
        project.role,
        project.outcome || "",
        project.stack.join(" "),
        project.keywords.join(" ")
      ].join(" ")
    );
    const matchesSearch =
      queryTerms.length === 0 || queryTerms.every((term) => searchable.includes(term));
    const visible = matchesCategory && matchesSearch;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  if (projectsCount instanceof HTMLElement) {
    projectsCount.hidden = visibleCount === 0;
    projectsCount.textContent = `Showing ${visibleCount} of ${projectEntries.length} projects`;
  }
  if (projectsEmpty instanceof HTMLElement) projectsEmpty.hidden = visibleCount > 0;
  if (projectsGrid instanceof HTMLElement) projectsGrid.hidden = visibleCount === 0;
  if (clearSearchButton instanceof HTMLButtonElement) clearSearchButton.hidden = !query;

  filterButtons.forEach((button) => {
    const active = button.dataset.filter === activeCategoryFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (syncUrl) {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (activeCategoryFilter !== "all") {
      url.searchParams.set("filter", activeCategoryFilter);
    } else {
      url.searchParams.delete("filter");
    }
    window.history.replaceState(window.history.state, "", url);
  }

  return visibleCount;
}

function restoreProjectFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const requestedFilter = params.get("filter") || "all";
  const allowedFilters = filterButtons.map((button) => button.dataset.filter || "all");
  activeCategoryFilter = allowedFilters.includes(requestedFilter)
    ? requestedFilter
    : "all";
  if (projectSearchInput instanceof HTMLInputElement) projectSearchInput.value = query;
  filterProjects(false);
}

if (projectSearchInput instanceof HTMLInputElement) {
  projectSearchInput.addEventListener("input", () => filterProjects());
}
if (clearSearchButton instanceof HTMLButtonElement) {
  clearSearchButton.addEventListener("click", () => {
    if (!(projectSearchInput instanceof HTMLInputElement)) return;
    projectSearchInput.value = "";
    filterProjects();
    projectSearchInput.focus();
  });
}
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategoryFilter = button.dataset.filter || "all";
    filterProjects();
  });
});
if (resetProjectsFilter instanceof HTMLButtonElement) {
  resetProjectsFilter.addEventListener("click", () => {
    activeCategoryFilter = "all";
    if (projectSearchInput instanceof HTMLInputElement) {
      projectSearchInput.value = "";
    }
    filterProjects();
    projectSearchInput?.focus();
  });
}
window.addEventListener("popstate", restoreProjectFiltersFromUrl);
restoreProjectFiltersFromUrl();

document.querySelectorAll(".skill-chip[data-tech]").forEach((element) => {
  if (!(element instanceof HTMLButtonElement)) return;
  element.addEventListener("click", () => {
    if (!(projectSearchInput instanceof HTMLInputElement)) return;
    activeCategoryFilter = "all";
    projectSearchInput.value = element.dataset.tech || "";
    const matches = filterProjects();
    document.getElementById("projects")?.scrollIntoView({
      behavior: reducedMotionQuery.matches ? "auto" : "smooth"
    });
    showToast(
      matches
        ? `${matches} matching project${matches === 1 ? "" : "s"} shown.`
        : `No project currently uses “${element.dataset.tech || "this skill"}”.`,
      matches ? "sparkles" : "info"
    );
  });
});

// Interactive terminal
const terminalBody = document.getElementById("terminalBody");
const terminalForm = document.getElementById("terminalForm");
const terminalInput = document.getElementById("terminalInput");
const commandHistory = [];
const maximumTerminalLines = 60;
let commandHistoryIndex = 0;

/** @param {string} text @param {string} [className] */
function appendTerminalLine(text, className = "") {
  if (!(terminalBody instanceof HTMLElement)) return;
  const line = document.createElement("div");
  line.className = `term-line ${className}`.trim();
  line.textContent = text;
  terminalBody.appendChild(line);
  while (terminalBody.children.length > maximumTerminalLines) {
    terminalBody.firstElementChild?.remove();
  }
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

/** @param {string} commandText */
function handleTerminalCommand(commandText) {
  const command = commandText.trim().toLowerCase();
  if (!command) return;
  appendTerminalLine(`artem@portfolio ~ % ${commandText}`, "cmd-echo");

  const responses = {
    help:
      "Available commands:\n• skills — technical stack\n• projects — deployed demos\n• about — short profile\n• cv — open CV\n• contact — contact details\n• whoami — visitor context\n• sudo hire — recruitment channel\n• clear — clear the terminal",
    skills:
      "Frontend: Next.js, React, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3\nWeb: REST APIs, Node.js fundamentals, Vercel deployment\nFoundations: Czech IT Maturita (2024), SQL, databases, operating systems, networks and Git",
    projects:
      "1. Barbershop Iron & Steel — booking-focused landing page\n2. Rehabilitation Center — multi-page healthcare interface\n3. SecretTravel — multilingual concierge interface\n4. BETZ Sportsbook — data-dense responsive UI\n5. Vakalova Dental — clinic and appointment interface",
    about:
      "Artem Mikhailov is a Prague-based junior frontend developer with a Czech IT Maturita (2024) and five deployed public demos.",
    contact:
      "Email: artemmikhailov20031001@gmail.com\nPhone: +420 737 500 587\nTelegram: @liltrafficRUS\nGitHub: github.com/akira777777",
    whoami:
      "You are viewing a developer portfolio built for recruiters, engineering teams and potential project collaborators.",
    "sudo hire":
      "Recruitment channel ready.\nFree access to the Czech labour market as a Czech secondary-school graduate; valid residence status required.\nEmail: artemmikhailov20031001@gmail.com"
  };

  if (command === "clear") {
    terminalBody?.replaceChildren();
    return;
  }
  if (command === "cv") {
    openCvModal(terminalInput instanceof HTMLElement ? terminalInput : null);
    appendTerminalLine("Opening the CV dialog…");
    return;
  }

  const response = responses[/** @type {keyof typeof responses} */ (command)];
  if (response) {
    appendTerminalLine(response);
    if (command === "sudo hire") {
      showToast("Recruitment contact ready.", "sparkles");
    }
  } else {
    appendTerminalLine(
      `Command not found: “${commandText}”. Type “help” for available commands.`
    );
  }
}

if (
  terminalForm instanceof HTMLFormElement &&
  terminalInput instanceof HTMLInputElement
) {
  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = terminalInput.value;
    if (!value.trim()) return;
    commandHistory.push(value);
    if (commandHistory.length > 30) commandHistory.shift();
    commandHistoryIndex = commandHistory.length;
    terminalInput.value = "";
    handleTerminalCommand(value);
  });

  terminalInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && commandHistory.length) {
      event.preventDefault();
      commandHistoryIndex = Math.max(0, commandHistoryIndex - 1);
      terminalInput.value = commandHistory[commandHistoryIndex] || "";
      terminalInput.setSelectionRange(
        terminalInput.value.length,
        terminalInput.value.length
      );
    } else if (event.key === "ArrowDown" && commandHistory.length) {
      event.preventDefault();
      commandHistoryIndex = Math.min(
        commandHistory.length,
        commandHistoryIndex + 1
      );
      terminalInput.value =
        commandHistoryIndex === commandHistory.length
          ? ""
          : commandHistory[commandHistoryIndex] || "";
    }
  });

  document.querySelectorAll(".term-btn[data-cmd]").forEach((element) => {
    if (!(element instanceof HTMLButtonElement)) return;
    element.addEventListener("click", () => {
      handleTerminalCommand(element.dataset.cmd || "");
      terminalInput.focus({ preventScroll: true });
    });
  });
}

// CV dialog and print mode
const closeCvModalButton = document.getElementById("closeCvModalButton");
const heroCvButton = document.getElementById("heroCvBtn");
const navCvButton = document.getElementById("navCvBtn");
const printCvButton = document.getElementById("printCvBtn");

/** @param {HTMLElement | null} trigger */
function openCvModal(trigger) {
  if (cvModal instanceof HTMLDialogElement) openDialog(cvModal, trigger);
}

[heroCvButton, navCvButton].forEach((element) => {
  if (!(element instanceof HTMLButtonElement)) return;
  element.addEventListener("click", () => openCvModal(element));
});
if (closeCvModalButton instanceof HTMLButtonElement && cvModal instanceof HTMLDialogElement) {
  closeCvModalButton.dataset.autofocus = "true";
  closeCvModalButton.addEventListener("click", () => closeDialog(cvModal));
}
if (printCvButton instanceof HTMLButtonElement) {
  printCvButton.addEventListener("click", () => {
    document.body.classList.add("printing-cv");
    window.print();
  });
}
window.addEventListener("afterprint", () => {
  document.body.classList.remove("printing-cv");
});

// Contact form validation and real delivery endpoint
const contactForm = document.getElementById("contactForm");
const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactSubject = document.getElementById("contactSubject");
const contactMessage = document.getElementById("contactMessage");
const contactWebsite = document.getElementById("contactWebsite");
const contactSubmitButton = document.getElementById("contactSubmitBtn");
const contactFormStatus = document.getElementById("contactFormStatus");
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const messageError = document.getElementById("messageError");
let contactSubmitting = false;

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} input
 * @param {HTMLElement | null} errorElement
 * @param {string} message
 */
function setFieldError(input, errorElement, message) {
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (errorElement) errorElement.textContent = message;
}

/** @returns {{name: string, email: string, subject: string, message: string, website: string} | null} */
function validateContactForm() {
  if (
    !(contactName instanceof HTMLInputElement) ||
    !(contactEmail instanceof HTMLInputElement) ||
    !(contactSubject instanceof HTMLInputElement) ||
    !(contactMessage instanceof HTMLTextAreaElement) ||
    !(contactWebsite instanceof HTMLInputElement)
  ) {
    return null;
  }

  const values = {
    name: contactName.value.trim(),
    email: contactEmail.value.trim(),
    subject: contactSubject.value.trim(),
    message: contactMessage.value.trim(),
    website: contactWebsite.value.trim()
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const nameMessage =
    values.name.length < 2 || values.name.length > 80
      ? "Enter a name between 2 and 80 characters."
      : "";
  const emailMessage =
    !values.email || values.email.length > 254 || !emailPattern.test(values.email)
      ? "Enter a valid email address."
      : "";
  const bodyMessage =
    values.message.length < 10 || values.message.length > 3000
      ? "Enter a message between 10 and 3,000 characters."
      : "";

  setFieldError(contactName, nameError, nameMessage);
  setFieldError(contactEmail, emailError, emailMessage);
  setFieldError(contactMessage, messageError, bodyMessage);

  const firstInvalid = [contactName, contactEmail, contactMessage].find(
    (input) => input.getAttribute("aria-invalid") === "true"
  );
  firstInvalid?.focus();
  return nameMessage || emailMessage || bodyMessage ? null : values;
}

/** @param {boolean} loading */
function setContactLoading(loading) {
  if (!(contactSubmitButton instanceof HTMLButtonElement)) return;
  contactSubmitButton.disabled = loading;
  contactSubmitButton.setAttribute("aria-busy", String(loading));
  contactSubmitButton.replaceChildren();
  if (loading) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    contactSubmitButton.appendChild(spinner);
  } else {
    appendSpriteIcon(contactSubmitButton, "#i-send");
  }
  const label = document.createElement("span");
  label.textContent = loading ? "Sending…" : "Send Message";
  contactSubmitButton.appendChild(label);
}

if (contactForm instanceof HTMLFormElement) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (contactSubmitting) return;
    if (contactFormStatus) contactFormStatus.textContent = "";
    const payload = validateContactForm();
    if (!payload) return;

    contactSubmitting = true;
    setContactLoading(true);
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result =
        /** @type {{message?: string, code?: string}} */ (
          await response.json().catch(() => ({}))
        );
      if (!response.ok) {
        throw new Error(
          result.message || "The message could not be delivered."
        );
      }

      contactForm.reset();
      [contactName, contactEmail, contactMessage].forEach((input) => {
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.setAttribute("aria-invalid", "false");
        }
      });
      if (contactFormStatus) {
        contactFormStatus.textContent =
          "Message delivered. Thank you — Artem will reply by email.";
      }
      showToast("Message delivered successfully.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The message could not be delivered.";
      if (contactFormStatus) {
        contactFormStatus.textContent = `${message} Please use the email link below.`;
      }
      showToast("Message not delivered. Please use email instead.", "error");
    } finally {
      contactSubmitting = false;
      setContactLoading(false);
    }
  });

  [contactName, contactEmail, contactMessage].forEach((input) => {
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      return;
    }
    input.addEventListener("input", () => {
      const errorElement =
        input === contactName
          ? nameError
          : input === contactEmail
            ? emailError
            : messageError;
      setFieldError(input, errorElement, "");
    });
  });
}

const presetMessages = Array.from(
  document.querySelectorAll(".preset-btn[data-message]")
).map((element) =>
  element instanceof HTMLButtonElement ? element.dataset.message || "" : ""
);

document.querySelectorAll(".preset-btn").forEach((element) => {
  if (!(element instanceof HTMLButtonElement)) return;
  element.addEventListener("click", () => {
    if (
      !(contactSubject instanceof HTMLInputElement) ||
      !(contactMessage instanceof HTMLTextAreaElement)
    ) {
      return;
    }
    contactSubject.value = element.dataset.subject || "";
    const currentMessage = contactMessage.value.trim();
    if (!currentMessage || presetMessages.includes(contactMessage.value)) {
      contactMessage.value = element.dataset.message || "";
    }
    contactMessage.focus();
    contactMessage.setSelectionRange(
      contactMessage.value.length,
      contactMessage.value.length
    );
    showToast("Message topic prepared.");
  });
});

document.querySelectorAll(".copy-action-btn[data-copy]").forEach((element) => {
  if (!(element instanceof HTMLButtonElement)) return;
  element.addEventListener("click", async () => {
    const text = element.dataset.copy || "";
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard.", "success");
    } catch {
      showToast(`Copy unavailable. Select manually: ${text}`, "error");
    }
  });
});
