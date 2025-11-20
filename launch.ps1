# Zombobs Server Launcher
# PowerShell wrapper with styled output

$Host.UI.RawUI.WindowTitle = "Zombobs Server"

function Write-Colored {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    if ([string]::IsNullOrEmpty($Message)) {
        Write-Host ""
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Colored "=====================================================" "Cyan"
    Write-Colored "                                                    " "Cyan"
    Write-Colored "       Z O M B O B S   S E R V E R                  " "Cyan"
    Write-Colored "                                                    " "Cyan"
    Write-Colored "       Multiplayer Backend Server V0.3.0 ALPHA      " "Cyan"
    Write-Colored "                                                    " "Cyan"
    Write-Colored "=====================================================" "Cyan"
    Write-Host ""
}

function Check-NodeJS {
    Write-Colored "[*] Checking for Node.js..." "Yellow"
    try {
        $nodeVersion = & node --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $nodeVersion -match 'v\d+\.\d+\.\d+') {
            Write-Colored "[+] Node.js found: $nodeVersion" "Green"
            return $true
        } else {
            Write-Colored "[-] Node.js not found!" "Red"
            return $false
        }
    } catch {
        Write-Colored "[-] Node.js not found!" "Red"
        return $false
    }
}

function Install-Dependencies {
    Write-Host ""
    Write-Colored "[*] Checking dependencies..." "Yellow"
    
    if (-not (Test-Path "server\node_modules")) {
        Write-Colored "[!] Dependencies not found. Installing..." "Yellow"
        Write-Host ""
        
        Push-Location server
        & npm install
        $installSuccess = $LASTEXITCODE -eq 0
        Pop-Location
        
        if ($installSuccess) {
            Write-Host ""
            Write-Colored "[+] Dependencies installed successfully!" "Green"
        } else {
            Write-Host ""
            Write-Colored "[-] Failed to install dependencies!" "Red"
            return $false
        }
    } else {
        Write-Colored "[+] Dependencies already installed" "Green"
    }
    return $true
}

function Start-Server {
    Write-Host ""
    Write-Colored "[*] Starting server..." "Yellow"
    Write-Host ""
    Write-Colored "=====================================================" "DarkGray"
    Write-Colored "   Server will be available at:" "White"
    Write-Colored "   http://localhost:3000" "Cyan"
    Write-Colored "=====================================================" "DarkGray"
    Write-Host ""
    Write-Colored "Press Ctrl+C to stop the server" "DarkGray"
    Write-Host ""
    
    Push-Location server
    & npm start
    Pop-Location
}

# Main execution
try {
    Write-Banner
    
    if (-not (Check-NodeJS)) {
        Write-Host ""
        Write-Colored "Please install Node.js from: https://nodejs.org/" "Yellow"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    if (-not (Install-Dependencies)) {
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Start-Server
    
} catch {
    Write-Host ""
    Write-Colored "[-] Error: $_" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
