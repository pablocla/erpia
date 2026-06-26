# Ejecutar en la PC con VPN (192.168.100.3)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "config.json")) {
  Copy-Item "config.example.json" "config.json"
  Write-Host "Se creó config.json — editá SQL/REST y apiKey antes de producción."
}

if (-not (Test-Path "node_modules")) {
  npm install
}

npm start