// Step metadata is kept separate from the markup so the workflow cards stay readable.
const stepDetails = {
  1: {
    title: "Push source code", category: "CI", icon: "</>",
    description: "A developer opens a pull request or pushes an approved change. Branch protection and code review policies establish the first release control.",
    input: "Application code, tests, Dockerfile, and deployment configuration",
    output: "Versioned commit and repository event",
    tools: "GitHub · GitLab"
  },
  2: {
    title: "Start CI pipeline", category: "CI", icon: "⚡",
    description: "The repository event starts a repeatable pipeline. The same delivery controls can be implemented across hosted or self-managed CI systems.",
    input: "Push, pull request, tag, or manual dispatch event",
    output: "Isolated CI job with traceable execution ID",
    tools: "GitHub Actions · GitLab CI · Jenkins"
  },
  3: {
    title: "Checkout source", category: "CI", icon: "⇩",
    description: "The runner retrieves the exact commit and prepares a clean workspace so every downstream result can be reproduced.",
    input: "Repository URL and commit SHA",
    output: "Clean, version-pinned build workspace",
    tools: "Git · CI runner workspace"
  },
  4: {
    title: "Run unit tests", category: "CI", icon: "✓",
    description: "Fast, isolated tests validate application logic before expensive build and security stages consume resources.",
    input: "Source code and unit test suite",
    output: "Test results, coverage report, and pass/fail gate",
    tools: "Language test framework · JUnit reports"
  },
  5: {
    title: "Run integration tests", category: "CI", icon: "⇄",
    description: "The application is tested with its service dependencies to verify API contracts, persistence, and cross-component behavior.",
    input: "Built application and ephemeral dependencies",
    output: "Integration report and validated service behavior",
    tools: "Docker services · API test suite"
  },
  6: {
    title: "SonarQube quality gate", category: "Security", icon: "◎",
    description: "Static analysis checks reliability, maintainability, duplication, coverage, and security hotspots. A failed quality gate stops the release.",
    input: "Source code and coverage data",
    output: "Quality gate decision and analysis report",
    tools: "SonarQube · SonarScanner"
  },
  7: {
    title: "OWASP Dependency-Check", category: "Security", icon: "⌁",
    description: "Third-party packages are matched against known vulnerability databases to prevent unsafe dependencies from entering the artifact.",
    input: "Dependency manifests and lock files",
    output: "CVE report and severity policy decision",
    tools: "OWASP Dependency-Check · NVD data"
  },
  8: {
    title: "Trivy filesystem scan", category: "Security", icon: "⌕",
    description: "The repository is scanned for vulnerable packages, exposed secrets, and configuration issues before a container is built.",
    input: "Checked-out project filesystem",
    output: "Vulnerability, secret, and misconfiguration report",
    tools: "Trivy filesystem scanner"
  },
  9: {
    title: "Build Docker image", category: "Build", icon: "▣",
    description: "A deterministic, immutable application image is created and tagged with the commit SHA for end-to-end traceability.",
    input: "Dockerfile, application artifact, and build context",
    output: "Versioned OCI container image",
    tools: "Docker · BuildKit"
  },
  10: {
    title: "Trivy image scan", category: "Security", icon: "◆",
    description: "Every image layer is checked for operating-system and application-package vulnerabilities before registry publication.",
    input: "Locally built container image",
    output: "Image vulnerability report and release gate",
    tools: "Trivy image scanner"
  },
  11: {
    title: "Push image to AWS ECR", category: "Build", icon: "☁",
    description: "The approved image is authenticated, tagged, and published to a private registry. Immutable tags protect released artifacts from replacement.",
    input: "Scanned image and short-lived AWS credentials",
    output: "Immutable ECR image URI and digest",
    tools: "Amazon ECR · AWS IAM/OIDC"
  },
  12: {
    title: "Package Helm chart", category: "Build", icon: "◫",
    description: "Kubernetes templates and environment values are validated and packaged as a versioned deployment artifact.",
    input: "Helm templates, values, image tag, and chart metadata",
    output: "Linted, versioned Helm chart",
    tools: "Helm · JFrog Artifactory"
  },
  13: {
    title: "Production approval gate", category: "Deploy", icon: "◇",
    description: "Production promotion pauses for an authorized reviewer to inspect quality, security, artifact, and change-management evidence.",
    input: "Release evidence and deployment plan",
    output: "Audited approval or rejected release",
    tools: "CI environment approvals · Change control"
  },
  14: {
    title: "Deploy to AWS EKS", category: "Deploy", icon: "☸",
    description: "Helm applies the desired release to Amazon EKS with environment-specific configuration, health checks, and atomic behavior.",
    input: "Approved chart, ECR image digest, and environment values",
    output: "Versioned Kubernetes release",
    tools: "Amazon EKS · Kubernetes · Helm"
  },
  15: {
    title: "Select deployment strategy", category: "Deploy", icon: "⑂",
    description: "The release selects a rollout model based on service criticality, capacity, risk, and the required speed of rollback.",
    input: "Release policy and service risk profile",
    output: "Rolling, Blue/Green, or Canary rollout plan",
    tools: "Kubernetes Deployments · Helm values"
  },
  16: {
    title: "Automatic rollback", category: "Deploy", icon: "↶",
    description: "Failed readiness checks or an unsuccessful Helm upgrade return the workload to its last healthy release without manual recovery steps.",
    input: "Failed rollout or health status",
    output: "Restored healthy release and failure evidence",
    tools: "Helm atomic upgrade · Kubernetes probes"
  },
  17: {
    title: "Send notifications", category: "Monitor", icon: "✉",
    description: "Release status, approval results, failures, and rollback events are delivered to operational and engineering stakeholders.",
    input: "Pipeline and deployment events",
    output: "Real-time message and auditable summary",
    tools: "Slack · Email"
  },
  18: {
    title: "Monitor with Prometheus and Grafana", category: "Monitor", icon: "⌁",
    description: "Metrics and dashboards verify workload health after release. Alert rules provide continuous operational feedback to the delivery team.",
    input: "Cluster, pod, application, and deployment metrics",
    output: "Dashboards, SLO signals, and actionable alerts",
    tools: "Prometheus · Grafana · Alertmanager"
  }
};

const steps = [...document.querySelectorAll(".workflow-step")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const runButton = document.getElementById("runPipeline");
const resetButton = document.getElementById("resetPipeline");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const panel = document.getElementById("detailPanel");
const backdrop = document.getElementById("panelBackdrop");
const closeButton = document.getElementById("closePanel");
let animationTimer = null;
let activeStep = null;
let lastFocusedStep = null;

// Apply stagger order and connect each card to its detail drawer.
steps.forEach((step, index) => {
  step.style.setProperty("--order", index);
  step.addEventListener("click", () => openDetails(Number(step.dataset.step), step));
});

function openDetails(stepNumber, trigger) {
  const detail = stepDetails[stepNumber];
  if (!detail) return;

  lastFocusedStep = trigger;
  activeStep?.classList.remove("selected");
  activeStep = trigger;
  activeStep.classList.add("selected");

  document.getElementById("detailStep").textContent = `STEP ${String(stepNumber).padStart(2, "0")}`;
  document.getElementById("detailIcon").textContent = detail.icon;
  document.getElementById("detailCategory").textContent = detail.category;
  document.getElementById("detailTitle").textContent = detail.title;
  document.getElementById("detailDescription").textContent = detail.description;
  document.getElementById("detailInput").textContent = detail.input;
  document.getElementById("detailOutput").textContent = detail.output;
  document.getElementById("detailTools").textContent = detail.tools;

  panel.classList.add("open");
  panel.scrollTop = 0;
  panel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  closeButton.focus({ preventScroll: true });
}

function closeDetails() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.style.overflow = "";
  activeStep?.classList.remove("selected");
  lastFocusedStep?.focus();
}

closeButton.addEventListener("click", closeDetails);
backdrop.addEventListener("click", closeDetails);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panel.classList.contains("open")) closeDetails();
});

// Filters preserve the pipeline layout while emphasizing one responsibility group.
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    steps.forEach((step) => {
      step.classList.toggle("filtered", filter !== "all" && step.dataset.category !== filter);
    });
  });
});

// Plays the delivery path in sequence and updates an accessible progress label.
function runPipeline() {
  resetPipeline(false);
  runButton.disabled = true;
  runButton.lastChild.textContent = " Running";
  let currentIndex = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interval = reducedMotion ? 120 : 620;

  function advance() {
    steps.forEach((step) => step.classList.remove("current"));
    const current = steps[currentIndex];
    current.classList.add("current", "complete");
    const completed = currentIndex + 1;
    progressFill.style.width = `${(completed / steps.length) * 100}%`;
    progressLabel.textContent = `Running step ${completed} of ${steps.length} · ${stepDetails[completed].title}`;

    currentIndex += 1;
    if (currentIndex >= steps.length) {
      window.clearInterval(animationTimer);
      animationTimer = null;
      window.setTimeout(() => current.classList.remove("current"), reducedMotion ? 0 : 500);
      runButton.disabled = false;
      runButton.lastChild.textContent = " Run pipeline";
      progressLabel.textContent = "Pipeline complete · 18 of 18 steps";
    }
  }

  advance();
  if (currentIndex < steps.length) animationTimer = window.setInterval(advance, interval);
}

function resetPipeline(updateLabel = true) {
  if (animationTimer) window.clearInterval(animationTimer);
  animationTimer = null;
  steps.forEach((step) => step.classList.remove("current", "complete"));
  progressFill.style.width = "0";
  runButton.disabled = false;
  runButton.lastChild.textContent = " Run pipeline";
  if (updateLabel) progressLabel.textContent = "Ready to run · 0 of 18 steps";
}

runButton.addEventListener("click", runPipeline);
resetButton.addEventListener("click", () => resetPipeline());
