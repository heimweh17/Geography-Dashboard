# Local Platform Environment

This directory holds infrastructure that is separate from the public Vercel, Render, and Neon deployment. It provides a reproducible local platform environment for Kubernetes, observability, CI validation, and infrastructure-as-code practice.

## Local Kubernetes

`kind` runs a single-node cluster on Docker Desktop. The deployment script builds the frontend and backend images, creates a local PostgreSQL secret on the cluster, runs the Alembic migration job, deploys the application, and installs Prometheus and Grafana.

```powershell
.\infra\scripts\deploy-local.ps1
```

- Dashboard: `http://localhost:8080`
- Grafana: `http://localhost:3000`
- Namespace: `geo-dashboard`

The frontend is built with `VITE_API_BASE_URL=/api`. Its Nginx container proxies `/api` to the in-cluster `core-api` service, so local browser requests do not depend on CORS configuration.

The AI service is deliberately excluded from the default local deployment. It requires a separate Gemini secret and is not necessary for the deterministic GIS workflow. To deploy it only when a key is available:

```powershell
$env:GEMINI_API_KEY = "your-key"
.\infra\scripts\deploy-local.ps1 -EnableAI
```

Remove the local cluster and its data with:

```powershell
.\infra\scripts\delete-local.ps1
```

## Terraform

`terraform/aws-bootstrap` defines optional ECR repositories with immutable tags, image scanning, lifecycle policies, and standard ownership tags. It is intentionally limited to registry infrastructure: it does not provision EKS, a database, or paid compute.

```powershell
cd .\infra\terraform\aws-bootstrap
terraform init -backend=false
terraform plan
```

`terraform apply` is intentionally a manual decision because it creates AWS resources. Do not place database URLs, JWT secrets, or Gemini keys in Terraform variables or state.
