param(
    [string]$ClusterName = "geo-dashboard",
    [switch]$Recreate,
    [switch]$EnableAI
)

$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendRoot = (Resolve-Path (Join-Path $repositoryRoot "..\gdashboardbackend")).Path
$kubernetesRoot = Join-Path $repositoryRoot "infra\kubernetes"
$kindWingetDirectory = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Kubernetes.kind_Microsoft.Winget.Source_8wekyb3d8bbwe"

# winget updates PATH for new logins; make the first local run work immediately too.
if (-not (Get-Command kind -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $kindWingetDirectory "kind.exe"))) {
    $env:Path = "$kindWingetDirectory;$env:Path"
}

foreach ($tool in @("docker", "kind", "kubectl")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool is required. Install it and retry."
    }
}

docker info | Out-Null

if ($Recreate -and ((kind get clusters) -contains $ClusterName)) {
    kind delete cluster --name $ClusterName
}

if (-not ((kind get clusters) -contains $ClusterName)) {
    kind create cluster --name $ClusterName --config (Join-Path $kubernetesRoot "kind-config.yaml")
}

docker build --tag geo-dashboard-api:local $backendRoot
docker build --build-arg VITE_API_BASE_URL=/api --tag geo-dashboard-web:local $repositoryRoot
kind load docker-image geo-dashboard-api:local --name $ClusterName
kind load docker-image geo-dashboard-web:local --name $ClusterName

$namespace = "geo-dashboard"
kubectl apply -f (Join-Path $kubernetesRoot "base\namespace.yaml")

$existingSecret = kubectl get secret geodashboard-secrets --namespace $namespace --ignore-not-found -o name
if ([string]::IsNullOrWhiteSpace($existingSecret)) {
    $alphabet = (48..57) + (65..90) + (97..122)
    $databasePassword = -join ($alphabet | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    $jwtSecret = -join ($alphabet | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    kubectl create secret generic geodashboard-secrets --namespace $namespace --from-literal="POSTGRES_PASSWORD=$databasePassword" --from-literal="DATABASE_URL=postgresql+psycopg2://geodashboard:$databasePassword@postgres:5432/geodashboard" --from-literal="SECRET_KEY=$jwtSecret"
	if ($LASTEXITCODE -ne 0) {
		throw "Unable to create the local Geography Dashboard secret."
	}
}

kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "base\configmap.yaml")
kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "base\services.yaml")
kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "base\postgres.yaml")
kubectl rollout status statefulset/postgres --namespace $namespace --timeout=180s

kubectl delete job geodashboard-migrate --namespace $namespace --ignore-not-found
kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "jobs\migration.yaml")
kubectl wait --for=condition=complete job/geodashboard-migrate --namespace $namespace --timeout=180s

kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "base\core-api.yaml")
kubectl apply --namespace $namespace -f (Join-Path $kubernetesRoot "base\frontend.yaml")
kubectl rollout status deployment/core-api --namespace $namespace --timeout=180s
kubectl rollout status deployment/frontend --namespace $namespace --timeout=180s

kubectl apply -k (Join-Path $kubernetesRoot "monitoring")
kubectl rollout status deployment/prometheus --namespace $namespace --timeout=180s
kubectl rollout status deployment/grafana --namespace $namespace --timeout=180s

if ($EnableAI) {
    if (-not $env:NAVIGATOR_TOOLKIT_API_KEY) {
        throw "Set NAVIGATOR_TOOLKIT_API_KEY before using -EnableAI."
    }
    kubectl create secret generic geodashboard-ai-secrets --namespace $namespace --from-literal="NAVIGATOR_TOOLKIT_API_KEY=$env:NAVIGATOR_TOOLKIT_API_KEY" --dry-run=client -o yaml | kubectl apply -f -
    kubectl rollout restart deployment/core-api --namespace $namespace
    kubectl rollout status deployment/core-api --namespace $namespace --timeout=180s
}

Write-Host "Geography Dashboard is available at http://localhost:8080"
Write-Host "Grafana is available at http://localhost:3000"
