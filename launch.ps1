#Requires -Version 5.1
<#
.SYNOPSIS
  One-click local multiplayer + static file server for Zombobs.

.DESCRIPTION
  Checks Node.js, frees/validates port, installs LOCAL_SERVER deps if needed,
  opens the landing page once /health is ready, then runs npm start in the foreground.

.PARAMETER Port
  Override listen port (default 3000, or $env:PORT / $env:ZOMBOBS_PORT).

.PARAMETER NoBrowser
  Skip auto-opening the browser.

.PARAMETER KillPort
  If the port is already in use, attempt to stop the listening process (with confirmation).

.EXAMPLE
  .\launch.ps1
  .\launch.ps1 -Port 3001 -NoBrowser
  .\launch.ps1 -KillPort
#>
[CmdletBinding()]
param(
    [int]$Port = 0,
    [switch]$NoBrowser,
    [switch]$KillPort
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Always run from repo root (this script's directory)
$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $RepoRoot

$ServerDir = Join-Path $RepoRoot 'LOCAL_SERVER'
$PackageJson = Join-Path $ServerDir 'package.json'

function Write-Step {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host $Message -ForegroundColor $Color
}

function Write-Ok { param([string]$Message) Write-Step "[+] $Message" 'Green' }
function Write-Warn { param([string]$Message) Write-Step "[!] $Message" 'Yellow' }
function Write-Err { param([string]$Message) Write-Step "[-] $Message" 'Red' }
function Write-Info { param([string]$Message) Write-Step "[*] $Message" 'Yellow' }

function Get-ServerVersion {
    if (Test-Path $PackageJson) {
        try {
            $pkg = Get-Content $PackageJson -Raw | ConvertFrom-Json
            if ($pkg.version) { return [string]$pkg.version }
        }
        catch { }
    }
    return 'unknown'
}

function Resolve-ListenPort {
    if ($Port -gt 0) { return $Port }
    if ($env:ZOMBOBS_PORT -and $env:ZOMBOBS_PORT -match '^\d+$') { return [int]$env:ZOMBOBS_PORT }
    if ($env:PORT -and $env:PORT -match '^\d+$') { return [int]$env:PORT }
    return 3000
}

function Test-NodeAvailable {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    try {
        $ver = & node --version 2>$null
        if ($LASTEXITCODE -ne 0 -and -not $ver) { return $null }
        return $ver
    }
    catch { return $null }
}

function Get-ListenersOnPort {
    param([int]$ListenPort)
    try {
        return @(Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction SilentlyContinue)
    }
    catch {
        # Fallback when Get-NetTCPConnection unavailable (older Windows / no admin)
        $lines = netstat -ano 2>$null | Select-String ":$ListenPort\s+.*LISTENING"
        $pids = @()
        foreach ($line in $lines) {
            if ($line -match '\s+(\d+)\s*$') { $pids += [int]$Matches[1] }
        }
        return $pids | Select-Object -Unique | ForEach-Object { [pscustomobject]@{ OwningProcess = $_ } }
    }
}

function Stop-PortListeners {
    param([int]$ListenPort)
    # PowerShell unrolls an empty array returned from a function to $null.
    # Keep the collection shape explicit so StrictMode never reads .Count on $null.
    $listeners = @(Get-ListenersOnPort -ListenPort $ListenPort)
    if ($listeners.Count -eq 0) { return $true }

    $uniquePids = $listeners | ForEach-Object { $_.OwningProcess } | Where-Object { $_ -gt 0 } | Select-Object -Unique
    foreach ($procId in $uniquePids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
            Write-Warn "Stopping PID $procId ($name) on port $ListenPort..."
            Stop-Process -Id $procId -Force -ErrorAction Stop
        }
        catch {
            Write-Err "Could not stop PID $procId : $($_.Exception.Message)"
            return $false
        }
    }
    Start-Sleep -Milliseconds 600
    $still = @(Get-ListenersOnPort -ListenPort $ListenPort)
    return ($still.Count -eq 0)
}

function Get-LanIPv4 {
    $candidates = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.PrefixOrigin -ne 'WellKnown'
        })

    if ($candidates.Count -gt 0) {
        $preferred = $candidates | Where-Object { $_.InterfaceAlias -match 'Wi-?Fi|Ethernet|Local Area' } | Select-Object -First 1
        if ($preferred) { return $preferred.IPAddress }
        return ($candidates | Select-Object -First 1).IPAddress
    }

    # Fallback: parse ipconfig
    $ipconfig = ipconfig 2>$null | Out-String
    if ($ipconfig -match 'IPv4 Address[.\s]+:\s*(\d+\.\d+\.\d+\.\d+)') {
        $ip = $Matches[1]
        if ($ip -notlike '127.*' -and $ip -notlike '169.254.*') { return $ip }
    }
    return $null
}

function Ensure-Dependencies {
    if (-not (Test-Path $ServerDir)) {
        Write-Err "LOCAL_SERVER folder not found at: $ServerDir"
        return $false
    }
    if (-not (Test-Path $PackageJson)) {
        Write-Err "Missing package.json in LOCAL_SERVER"
        return $false
    }

    $nodeModules = Join-Path $ServerDir 'node_modules'
    $expressMod = Join-Path $nodeModules 'express'
    $needsInstall = (-not (Test-Path $nodeModules)) -or (-not (Test-Path $expressMod))

    if ($needsInstall) {
        Write-Info "Installing dependencies..."
        Push-Location $ServerDir
        try {
            $prevEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            & npm install --no-fund --no-audit
            $installExit = $LASTEXITCODE
            $ErrorActionPreference = $prevEap
            if ($installExit -ne 0) {
                Write-Err "npm install failed (exit $installExit)"
                return $false
            }
        }
        finally {
            Pop-Location
        }
        Write-Ok "Dependencies installed"
    }
    else {
        Write-Ok "Dependencies ready"
    }
    return $true
}

# --- Main ---
$SERVER_VERSION = Get-ServerVersion
$SERVER_PORT = Resolve-ListenPort
$Host.UI.RawUI.WindowTitle = "Zombobs Server v$SERVER_VERSION :$SERVER_PORT"

Clear-Host
Write-Host ""
Write-Step "  ZOMBOBS LOCAL SERVER" 'Magenta'
Write-Step "  v$SERVER_VERSION  |  port $SERVER_PORT" 'DarkGray'
Write-Host ""

# Node.js
Write-Info "Checking Node.js..."
$nodeVersion = Test-NodeAvailable
if (-not $nodeVersion) {
    Write-Err "Node.js not found. Install LTS from https://nodejs.org/ then re-run."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Ok "Node.js $nodeVersion"

# Engines hint (package wants >=18)
if ($nodeVersion -match 'v(\d+)') {
    $major = [int]$Matches[1]
    if ($major -lt 18) {
        Write-Err "Node $nodeVersion is too old (need >= 18). Upgrade from https://nodejs.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Port
Write-Info "Checking port $SERVER_PORT..."
$inUse = @(Get-ListenersOnPort -ListenPort $SERVER_PORT)
if ($inUse.Count -gt 0) {
    $ownerPids = ($inUse | ForEach-Object { $_.OwningProcess } | Select-Object -Unique) -join ', '
    Write-Warn "Port $SERVER_PORT is in use (PID: $ownerPids)"

    $shouldKill = $KillPort.IsPresent
    if (-not $shouldKill) {
        $answer = Read-Host "Kill process(es) and continue? [Y/N]"
        $shouldKill = ($answer -match '^[Yy]')
    }

    if ($shouldKill) {
        if (-not (Stop-PortListeners -ListenPort $SERVER_PORT)) {
            Write-Err "Could not free port $SERVER_PORT"
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Ok "Port $SERVER_PORT freed"
    }
    else {
        Write-Err "Aborting. Re-run with -KillPort or choose another port: .\launch.ps1 -Port 3001"
        Read-Host "Press Enter to exit"
        exit 1
    }
}
else {
    Write-Ok "Port $SERVER_PORT available"
}

# Deps
Write-Info "Checking dependencies..."
if (-not (Ensure-Dependencies)) {
    Read-Host "Press Enter to exit"
    exit 1
}

# URLs
$localUrl = "http://localhost:$SERVER_PORT"
$landingUrl = "$localUrl/landing.html"
$gameUrl = "$localUrl/index.html"
$dashUrl = "$localUrl/dashboard/html"
$lanIP = Get-LanIPv4

Write-Host ""
Write-Step "  Local:     $localUrl" 'Cyan'
Write-Step "  Landing:   $landingUrl" 'Cyan'
Write-Step "  Game:      $gameUrl" 'Cyan'
Write-Step "  Dashboard: $dashUrl" 'DarkGray'
if ($lanIP) {
    Write-Step "  Network:   http://${lanIP}:$SERVER_PORT" 'Cyan'
}
Write-Host ""
Write-Info "Starting server... (Ctrl+C to stop)"
Write-Host ""

# Open browser after /health responds (detached watcher — keeps npm start in foreground)
$browserJob = $null
if (-not $NoBrowser) {
    $portForJob = $SERVER_PORT
    $urlForJob = $landingUrl
    $browserJob = Start-Job -Name 'ZombobsOpenBrowser' -ScriptBlock {
        param($P, $U)
        $deadline = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $deadline) {
            try {
                $r = Invoke-WebRequest -Uri "http://127.0.0.1:$P/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
                    Start-Process $U
                    return
                }
            }
            catch { Start-Sleep -Milliseconds 400 }
        }
        try { Start-Process $U } catch { }
    } -ArgumentList $portForJob, $urlForJob
}

# Pass port to Node (server.js reads process.env.PORT)
$env:PORT = "$SERVER_PORT"

Push-Location $ServerDir
$exitCode = 0
$prevEap = $ErrorActionPreference
try {
    # npm writes warnings to stderr; Stop mode would treat them as terminating errors
    $ErrorActionPreference = 'Continue'
    & npm start
    if ($null -ne $LASTEXITCODE) { $exitCode = $LASTEXITCODE }
}
catch {
    Write-Err "Server error: $($_.Exception.Message)"
    $exitCode = 1
}
finally {
    $ErrorActionPreference = $prevEap
    Pop-Location
    if ($browserJob) {
        Stop-Job $browserJob -ErrorAction SilentlyContinue
        Remove-Job $browserJob -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
if ($exitCode -ne 0) {
    Write-Err "Server exited with code $exitCode"
}
else {
    Write-Info "Server stopped."
}
Read-Host "Press Enter to exit"
exit $exitCode
