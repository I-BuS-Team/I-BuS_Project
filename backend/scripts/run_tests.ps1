# Ejecuta la suite de pruebas dinámicas del backend I-BuS
param(
    [string]$Target = "tests",
    [switch]$Coverage,
    [string]$Filter = "",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $BackendRoot

if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
}

& ".\venv\Scripts\Activate.ps1"
pip install -q -r requirements-dev.txt

$pytestArgs = @($Target)
if ($Coverage) { $pytestArgs += "--cov=app", "--cov-report=term-missing" }
if ($Verbose) { $pytestArgs += "-vv" }
if ($Filter) { $pytestArgs += "-k", $Filter }

Write-Host "Ejecutando: pytest $($pytestArgs -join ' ')" -ForegroundColor Cyan
pytest @pytestArgs
exit $LASTEXITCODE
