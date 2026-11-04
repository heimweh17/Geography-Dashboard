param([string]$ClusterName = "geo-dashboard")

$ErrorActionPreference = "Stop"
kind delete cluster --name $ClusterName
