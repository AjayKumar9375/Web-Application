// Component metadata is centralized so every workflow node opens consistent details.
const components = {
  "Developer / CI Pipeline": ["CI", "Runs reviewed Terraform plans and applies from a controlled automation identity.", "Keeps infrastructure changes repeatable, reviewed, and traceable instead of relying on console changes.", "A pull request runs fmt, validate, security checks, and plan before an approved production apply."],
  "Terraform": ["TF", "Declares and provisions the AWS network, IAM, EKS, add-ons, and supporting services.", "Provides version-controlled and reusable infrastructure with predictable environment creation.", "The same modules create smaller development capacity and resilient production capacity through variables."],
  "S3 Remote State": ["S3", "Stores the shared Terraform state file in a versioned S3 bucket.", "Allows CI and engineers to work against one durable state source with recovery history.", "State versioning restores a previous state object after an accidental or failed update."],
  "DynamoDB Locking": ["DDB", "Coordinates state locking so only one Terraform writer updates an environment at a time.", "Prevents concurrent applies from corrupting shared infrastructure state.", "A production apply holds the lock while another pipeline waits or exits safely."],
  "KMS Encryption": ["KMS", "Encrypts state and selected AWS data using managed cryptographic keys.", "Protects sensitive infrastructure metadata and supports explicit key-access policy.", "Only the deployment role can decrypt the Terraform state object through the configured KMS key."],
  "VPC": ["VPC", "Provides the isolated three-Availability-Zone network boundary for the EKS platform.", "Controls addressing, routing, connectivity, and security for public and private resources.", "Production uses non-overlapping CIDR ranges that can later connect to shared services through transit routing."],
  "Public Subnets": ["PUB", "Host internet-facing load balancers and NAT gateways across Availability Zones.", "Expose only platform entry and egress components while worker nodes remain private.", "An internet-facing ALB receives HTTPS traffic and forwards it to Kubernetes targets."],
  "Internet Gateway": ["IGW", "Connects public VPC routes to the public internet.", "Enables reachable public load balancers and other explicitly public resources.", "The public route table sends 0.0.0.0/0 traffic to the attached internet gateway."],
  "NAT Gateway": ["NAT", "Provides outbound internet access for resources in private subnets.", "Lets worker nodes download updates or reach external APIs without accepting inbound internet connections.", "A private node pulls a public Helm dependency through the NAT gateway while remaining unreachable from outside."],
  "Private Subnets": ["PRV", "Host EKS managed node groups and internal platform resources without public IP addresses.", "Reduces direct network exposure for application workloads.", "Pods and nodes use private addresses while an ALB provides the controlled application entry point."],
  "Route Tables": ["RT", "Direct subnet traffic to internet, NAT, local, or private connectivity targets.", "Makes public and private traffic paths explicit and independently controllable.", "Private subnet default routes use the NAT gateway; public subnet routes use the internet gateway."],
  "Security Groups": ["SG", "Apply stateful network access rules to the EKS control plane, nodes, and load balancers.", "Limits communication to the ports and sources required by the platform.", "Worker nodes accept application traffic only from the ALB security group and cluster traffic from approved peers."],
  "IAM Roles": ["IAM", "Grant scoped AWS permissions to Terraform, EKS, nodes, and platform controllers.", "Separates deployment, control-plane, node, and workload permissions under least privilege.", "The managed node role can join the cluster and pull ECR images without receiving administrator access."],
  "EKS Control Plane": ["EKS", "Provides the managed Kubernetes API and cluster control-plane services.", "Removes control-plane host maintenance while integrating Kubernetes with AWS identity and networking.", "Private and public endpoint restrictions allow approved CI access while limiting general exposure."],
  "Managed Node Groups": ["MNG", "Run Kubernetes worker capacity using EKS-managed EC2 lifecycle operations.", "Provide controlled AMI updates, scaling configuration, and workload capacity across Availability Zones.", "Separate node groups isolate system workloads from application workloads and use different instance families."],
  "Kubernetes Workloads": ["PODS", "Run containerized applications as Deployments, StatefulSets, Jobs, and supporting resources.", "Represent the business workloads served by the infrastructure platform.", "A Helm release creates replicas with probes, requests, limits, disruption budgets, and service exposure."],
  "IRSA": ["IRSA", "Maps a Kubernetes service account to a scoped IAM role through OIDC federation.", "Avoids sharing node-level AWS permissions with every pod.", "ExternalDNS can update only the approved Route 53 hosted zones through its service-account role."],
  "AWS Load Balancer Controller": ["ALB", "Reconciles Kubernetes Ingress and Service resources into AWS load balancers.", "Provides AWS-native application traffic entry with Kubernetes-driven configuration.", "An Ingress annotation creates an HTTPS ALB with target groups and health checks."],
  "ExternalDNS": ["DNS", "Synchronizes Kubernetes service and ingress hostnames with Route 53 records.", "Automates DNS lifecycle alongside application deployments.", "Deploying an ingress creates or updates the application CNAME without a manual DNS ticket."],
  "EBS CSI Driver": ["EBS", "Provisions and attaches Amazon EBS volumes for Kubernetes persistent volume claims.", "Provides durable block storage through the Kubernetes storage interface.", "A gp3 StorageClass dynamically provisions encrypted storage for a stateful workload."],
  "Metrics Server": ["MS", "Collects recent CPU and memory usage for the Kubernetes resource metrics API.", "Supplies the data used by kubectl top and Horizontal Pod Autoscaler.", "HPA increases API replicas when average CPU utilization exceeds its target."],
  "Cluster Autoscaler": ["CA", "Adjusts managed node group size when pods cannot schedule or nodes are underused.", "Aligns cluster capacity with workload demand while controlling infrastructure cost.", "A release that adds unschedulable pods causes the matching node group to scale out."],
  "Secrets Manager": ["SM", "Stores, encrypts, and rotates application and platform secrets outside Git.", "Centralizes secret access under AWS IAM and audit controls.", "A database password is rotated in Secrets Manager without storing plaintext in a Helm values file."],
  "Secrets Store CSI Provider": ["CSI", "Mounts external secrets into Kubernetes pods through a CSI volume.", "Lets workloads consume AWS-managed secrets without embedding them in manifests.", "A pod service account retrieves only its application secret and mounts it as an in-memory file."],
  "CloudWatch Logs": ["CW", "Stores EKS control-plane and selected workload logs with retention controls.", "Provides AWS-native audit and diagnostic history for the platform.", "An engineer queries API audit logs to investigate a denied or unexpected cluster operation."],
  "Fluent Bit": ["FB", "Collects, enriches, and forwards container logs from every worker node.", "Creates a lightweight node-level path from Kubernetes stdout logs to centralized storage.", "Log records receive cluster, namespace, pod, and container metadata before reaching CloudWatch."],
  "Prometheus": ["PROM", "Scrapes and evaluates cluster, node, controller, and application time-series metrics.", "Provides detailed Kubernetes monitoring and alert-rule evaluation.", "An alert fires when unavailable deployment replicas remain above zero for a sustained interval."],
  "Grafana": ["GRAF", "Visualizes Prometheus data through platform and workload dashboards.", "Gives engineers a shared operational view of capacity, health, and performance.", "A cluster overview dashboard correlates node pressure, pod restarts, and application latency."],
  "dev Workspace": ["DEV", "Represents the development environment state and lower-cost infrastructure configuration.", "Separates experimental changes from staging and production resources.", "Developers validate a module change using smaller node instances and reduced replica counts."],
  "staging Workspace": ["STG", "Hosts a production-like environment for integration and release validation.", "Provides a controlled promotion checkpoint before production apply.", "The release pipeline validates add-on upgrades and workload compatibility against staging."],
  "production Workspace": ["PROD", "Tracks the production infrastructure state and resilient capacity configuration.", "Creates a strict boundary for the highest-impact infrastructure changes.", "Only protected-branch pipelines with approval can plan and apply the production workspace."],
  "Environment-specific tfvars": ["VARS", "Define environment-specific CIDRs, capacity, versions, retention, and feature settings.", "Reuse the same modules without copying infrastructure code between environments.", "Production enables multi-AZ NAT and longer log retention while development uses cost-optimized values."]
};

const lanes = [
  { id: "state", title: "Terraform & Remote State", color: "#36bfd7", groups: [["Developer / CI Pipeline"], ["Terraform"], ["S3 Remote State"], ["DynamoDB Locking"], ["KMS Encryption"]] },
  { id: "network", title: "AWS Network Foundation", color: "#4d8ff7", groups: [["VPC"], ["Public Subnets"], ["Internet Gateway", "NAT Gateway"], ["Private Subnets"], ["Route Tables", "Security Groups"]] },
  { id: "cluster", title: "EKS Cluster Platform", color: "#3bd18a", groups: [["IAM Roles"], ["EKS Control Plane"], ["Managed Node Groups"], ["Kubernetes Workloads"]] },
  { id: "addons", title: "Kubernetes Add-ons", color: "#f3b74d", groups: [["IRSA"], ["AWS Load Balancer Controller"], ["ExternalDNS"], ["EBS CSI Driver"], ["Metrics Server"], ["Cluster Autoscaler"]] },
  { id: "operations", title: "Secrets & Observability", color: "#36bfd7", groups: [["Secrets Manager"], ["Secrets Store CSI Provider"], ["CloudWatch Logs"], ["Fluent Bit"], ["Prometheus"], ["Grafana"]] },
  { id: "environments", title: "Multi-Environment Delivery", color: "#3bd18a", groups: [["dev Workspace"], ["staging Workspace"], ["production Workspace"], ["Environment-specific tfvars"]] }
];

const laneRoot = document.querySelector("#workflowLanes");
const panel = document.querySelector("#detailPanel");
const backdrop = document.querySelector("#backdrop");
const closeButton = document.querySelector("#closePanel");
let lastFocusedNode = null;

function renderNode(name, laneTitle) {
  const code = components[name][0];
  return `<button class="node" type="button" data-component="${name}" data-lane="${laneTitle}"><span class="node-code">${code}</span><strong>${name}</strong><small>Inspect component</small></button>`;
}

lanes.forEach((lane) => {
  const element = document.createElement("section");
  element.className = "lane";
  element.dataset.lane = lane.id;
  element.style.setProperty("--lane-color", lane.color);
  const flow = lane.groups.map((group) => {
    const nodes = group.map((name) => renderNode(name, lane.title)).join("");
    return group.length > 1 ? `<div class="node-group">${nodes}</div>` : nodes;
  }).join("");
  element.innerHTML = `<div class="lane-heading"><span>${lane.id}</span><h3>${lane.title}</h3></div><div class="node-flow">${flow}</div>`;
  laneRoot.append(element);
});

document.querySelectorAll(".node").forEach((node) => node.addEventListener("click", () => openDetails(node)));

function openDetails(node) {
  const [icon, purpose, reason, example] = components[node.dataset.component];
  lastFocusedNode = node;
  document.querySelectorAll(".node").forEach((item) => item.classList.toggle("selected", item === node));
  document.querySelector("#detailLane").textContent = node.dataset.lane.toUpperCase();
  document.querySelector("#detailIcon").textContent = icon;
  document.querySelector("#detailTitle").textContent = node.dataset.component;
  document.querySelector("#detailPurpose").textContent = purpose;
  document.querySelector("#detailReason").textContent = reason;
  document.querySelector("#detailExample").textContent = example;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeDetails() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.style.overflow = "";
  document.querySelectorAll(".node").forEach((node) => node.classList.remove("selected"));
  lastFocusedNode?.focus();
}

document.querySelectorAll(".lane-filters button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".lane-filters button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".lane").forEach((lane) => {
      lane.classList.toggle("filtered", button.dataset.filter !== "all" && lane.dataset.lane !== button.dataset.filter);
    });
  });
});

closeButton.addEventListener("click", closeDetails);
backdrop.addEventListener("click", closeDetails);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panel.classList.contains("open")) closeDetails();
});
