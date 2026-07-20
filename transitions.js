/**
 * Shared portfolio motion system.
 * Adds progressive enhancement only; all content remains usable without JavaScript.
 */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Add a thin, compositor-friendly reading progress indicator.
  const progress = document.createElement("div");
  progress.className = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  let scrollFrame = null;
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const value = available > 0 ? Math.min(window.scrollY / available, 1) : 0;
    progress.style.transform = `scaleX(${value})`;
    scrollFrame = null;
  };

  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  // Stagger suitable cards and workflow lanes as they enter the viewport.
  const entranceSelector = [
    ".project-card", ".skill-card", ".experience-item", ".strategy-card",
    ".step-card", ".feature-grid article", ".guardrail-grid article",
    ".evidence-grid article", ".role li", ".gate-list article", ".operations-grid article"
  ].join(",");
  const entranceItems = [...document.querySelectorAll(entranceSelector)];

  entranceItems.forEach((item, index) => {
    item.dataset.motion = "";
    item.style.setProperty("--motion-delay", `${(index % 5) * 55}ms`);
  });

  document.documentElement.classList.add("motion-ready");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    entranceItems.forEach((item) => item.classList.add("motion-in"));
  } else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-in");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5%" });
    entranceItems.forEach((item) => {
      // Reveal the initial viewport synchronously so delayed observer delivery
      // never leaves above-the-fold workflow lanes temporarily blank.
      if (item.getBoundingClientRect().top < window.innerHeight * 1.1) {
        item.classList.add("motion-in");
      } else {
        observer.observe(item);
      }
    });
  }

  // Give interactive technical surfaces a restrained pointer-following highlight.
  const surfaceSelector = [
    ".project-card", ".skill-card", ".experience-item", ".workflow-step",
    ".stage-card", ".step-card", ".node", ".strategy-card",
    ".feature-grid article", ".guardrail-grid article", ".evidence-grid article"
  ].join(",");

  document.querySelectorAll(surfaceSelector).forEach((surface) => {
    surface.classList.add("motion-surface");
    if (reduceMotion) return;
    surface.addEventListener("pointermove", (event) => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
      surface.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
    });
  });

  // Make the whole portfolio project card open its workflow while preserving
  // native behavior for links, disclosure controls, and text selection.
  document.querySelectorAll(".project-card").forEach((card) => {
    const workflowLink = card.querySelector('a[href*="workflow"]');
    if (!workflowLink) return;

    card.classList.add("linked-project-card");
    card.tabIndex = 0;
    card.setAttribute("aria-label", `Open ${card.querySelector("h3")?.textContent || "project"} workflow`);

    const openWorkflow = () => window.location.assign(workflowLink.href);
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button, summary, details, input, label")) return;
      if (window.getSelection()?.toString()) return;
      openWorkflow();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openWorkflow();
    });
  });
})();
