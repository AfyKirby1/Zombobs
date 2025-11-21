# Zombobs Server Launcher
# PowerShell wrapper with styled output and enhanced information

$Host.UI.RawUI.WindowTitle = "Zombobs Server"

# Server configuration
$SERVER_PORT = 3000
$SERVER_VERSION = "0.5.1"
$HF_SPACE_URL = "https://ottertondays-zombs.hf.space"
$HF_SPACE_PAGE = "https://huggingface.co/spaces/OttertonDays/zombs"

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
    Write-Colored "╔═══════════════════════════════════════════════════════════╗" "Cyan"
    Write-Colored "║                                                           ║" "Cyan"
    Write-Colored "║         Z O M B O B S   S E R V E R                      ║" "Cyan"
    Write-Colored "║                                                           ║" "Cyan"
    Write-Colored "║         Multiplayer Backend Server V$SERVER_VERSION                ║" "Cyan"
    Write-Colored "║                                                           ║" "Cyan"
    Write-Colored "╚═══════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Check-NodeJS {
    Write-Colored "[*] Checking for Node.js..." "Yellow"
    try {
        $nodeVersion = & node --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $nodeVersion -match 'v(\d+)\.(\d+)\.(\d+)') {
            $majorVersion = [int]$matches[1]
            $minorVersion = [int]$matches[2]
            Write-Colored "[+] Node.js found: $nodeVersion" "Green"
            
            # Check if version meets requirements (>= 18.0.0)
            if ($majorVersion -ge 18) {
                Write-Colored "    ✓ Version meets requirements (>= 18.0.0)" "DarkGray"
            } else {
                Write-Colored "    ⚠ Warning: Node.js 18+ recommended (current: $nodeVersion)" "Yellow"
            }
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

function Check-PortAvailable {
    param([int]$Port)
    Write-Colored "[*] Checking if port $Port is available..." "Yellow"
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            Write-Colored "[-] Port $Port is already in use!" "Red"
            Write-Colored "    Another server may be running, or another application is using this port." "Yellow"
            Write-Colored "    To use a different port, set environment variable: `$env:PORT=3001" "DarkGray"
            return $false
        } else {
            Write-Colored "[+] Port $Port is available" "Green"
            return $true
        }
    } catch {
        # If Test-NetConnection fails, assume port is available (older PowerShell versions)
        Write-Colored "[+] Port check skipped (assuming available)" "DarkGray"
        return $true
    }
}

function Get-LocalIP {
    try {
        $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*","Local Area Connection*" -ErrorAction SilentlyContinue | 
            Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "127.*" } | 
            Select-Object -First 1 -ExpandProperty IPAddress
        return $ipAddresses
    } catch {
        return $null
    }
}

function Show-ServerInfo {
    $localIP = Get-LocalIP
    
    Write-Host ""
    Write-Colored "╔═══════════════════════════════════════════════════════════╗" "DarkGray"
    Write-Colored "║                    SERVER INFORMATION                    ║" "White"
    Write-Colored "╠═══════════════════════════════════════════════════════════╣" "DarkGray"
    Write-Host ""
    
    Write-Colored "   LOCAL SERVER:" "White"
    Write-Colored "   ─────────────────────────────────────────────────────" "DarkGray"
    Write-Colored "   URL:        http://localhost:$SERVER_PORT" "Cyan"
    if ($localIP) {
        Write-Colored "   Network:    http://$localIP`:$SERVER_PORT" "Cyan"
        Write-Colored "              (Use this URL for other devices on your network)" "DarkGray"
    }
    Write-Colored "   Status:     Starting..." "Yellow"
    Write-Colored "   Port:       $SERVER_PORT" "DarkGray"
    Write-Host ""
    
    Write-Colored "   HUGGING FACE SERVER:" "White"
    Write-Colored "   ─────────────────────────────────────────────────────" "DarkGray"
    Write-Colored "   Space URL:  $HF_SPACE_PAGE" "Cyan"
    Write-Colored "   API URL:    $HF_SPACE_URL" "Cyan"
    
    Write-Host ""
    Write-Colored "╚═══════════════════════════════════════════════════════════╝" "DarkGray"
    Write-Host ""
}

function Install-Dependencies {
    Write-Host ""
    Write-Colored "[*] Checking dependencies..." "Yellow"
    
    if (-not (Test-Path "server\node_modules")) {
        Write-Colored "[!] Dependencies not found. Installing..." "Yellow"
        Write-Colored "    This may take a few moments..." "DarkGray"
        Write-Host ""
        
        Push-Location server
        $installStart = Get-Date
        & npm install
        $installSuccess = $LASTEXITCODE -eq 0
        $installTime = ((Get-Date) - $installStart).TotalSeconds
        Pop-Location
        
        if ($installSuccess) {
            Write-Host ""
            Write-Colored "[+] Dependencies installed successfully!" "Green"
            Write-Colored "    Installation time: $([math]::Round($installTime, 1)) seconds" "DarkGray"
        } else {
            Write-Host ""
            Write-Colored "[-] Failed to install dependencies!" "Red"
            Write-Colored "    Please check the error messages above" "Yellow"
            return $false
        }
    } else {
        Write-Colored "[+] Dependencies already installed" "Green"
        
        # Check package.json version
        if (Test-Path "server\package.json") {
            try {
                $packageJson = Get-Content "server\package.json" | ConvertFrom-Json
                if ($packageJson.version) {
                    Write-Colored "    Server version: $($packageJson.version)" "DarkGray"
                }
            } catch {
                # Ignore JSON parse errors
            }
        }
    }
    return $true
}

function Test-HuggingFaceServer {
    Write-Host ""
    Write-Colored "[*] Testing Hugging Face Space server connection..." "Yellow"
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri "$HF_SPACE_URL/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Colored "[+] Hugging Face server: CONNECTED" "Green"
            Write-Colored "    Status: $($healthData.status) | Players: $($healthData.players) | Response: $([math]::Round($responseTime))ms" "DarkGray"
            return $true
        } else {
            Write-Colored "[-] Hugging Face server: ERROR (Status: $($response.StatusCode))" "Red"
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*timeout*" -or $errorMsg -like "*timed out*") {
            Write-Colored "[-] Hugging Face server: TIMEOUT" "Yellow"
            Write-Colored "    Server may be sleeping. It will wake up automatically when accessed." "DarkGray"
        } else {
            Write-Colored "[-] Hugging Face server: NOT REACHABLE" "Red"
            Write-Colored "    Error: $errorMsg" "DarkGray"
        }
        return $false
    }
}

function Show-ConnectionInstructions {
    Write-Host ""
    Write-Colored "╔═══════════════════════════════════════════════════════════╗" "DarkGray"
    Write-Colored "║              CONNECTION INSTRUCTIONS                      ║" "White"
    Write-Colored "╠═══════════════════════════════════════════════════════════╣" "DarkGray"
    Write-Host ""
    Write-Colored "   TO CONNECT FROM BROWSER:" "White"
    Write-Colored "   1. Open your web browser" "DarkGray"
    Write-Colored "   2. Navigate to: http://localhost:$SERVER_PORT" "Cyan"
    Write-Colored "   3. The game will automatically connect to this server" "DarkGray"
    Write-Host ""
    Write-Colored "   TO CONNECT FROM OTHER DEVICES:" "White"
    $localIP = Get-LocalIP
    if ($localIP) {
        Write-Colored "   1. Make sure your device is on the same network" "DarkGray"
        Write-Colored "   2. Navigate to: http://$localIP`:$SERVER_PORT" "Cyan"
        Write-Colored "   3. Or use the network URL shown in server info above" "DarkGray"
    } else {
        Write-Colored "   (Network IP detection failed - use localhost only)" "Yellow"
    }
    Write-Host ""
    Write-Colored "   MULTIPLAYER:" "White"
    Write-Colored "   - Multiple players can connect to the same server" "DarkGray"
    Write-Colored "   - First player becomes the leader (handles game logic)" "DarkGray"
    Write-Colored "   - All players see synchronized game state" "DarkGray"
    Write-Host ""
    Write-Colored "╚═══════════════════════════════════════════════════════════╝" "DarkGray"
    Write-Host ""
}

function Start-Server {
    Write-Host ""
    Write-Colored "[*] Starting local server..." "Yellow"
    Write-Host ""
    
    # Check port availability
    if (-not (Check-PortAvailable -Port $SERVER_PORT)) {
        Write-Host ""
        Write-Colored "Cannot start server - port is in use." "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Test Hugging Face connection
    $hfConnected = Test-HuggingFaceServer
    
    # Show server information
    Show-ServerInfo
    
    # Show connection instructions
    Show-ConnectionInstructions
    
    Write-Colored "╔═══════════════════════════════════════════════════════════╗" "DarkGray"
    Write-Colored "║                    SERVER STATUS                         ║" "White"
    Write-Colored "╠═══════════════════════════════════════════════════════════╣" "DarkGray"
    Write-Host ""
    Write-Colored "   LOCAL SERVER:" "White"
    Write-Colored "   Status: Starting..." "Yellow"
    Write-Host ""
    Write-Colored "   HUGGING FACE SERVER:" "White"
    if ($hfConnected) {
        Write-Colored "   Status: CONNECTED [✓]" "Green"
        Write-Colored "   Note: Game can use either local or Hugging Face server" "DarkGray"
    } else {
        Write-Colored "   Status: NOT REACHABLE [✗]" "Red"
        Write-Colored "   Note: Game will use local server (recommended for development)" "DarkGray"
    }
    Write-Host ""
    Write-Colored "╚═══════════════════════════════════════════════════════════╝" "DarkGray"
    Write-Host ""
    Write-Colored "Press Ctrl+C to stop the server" "DarkGray"
    Write-Host ""
    Write-Colored "[*] Starting server process..." "Yellow"
    Write-Colored "    Watch for 'Server running on port $SERVER_PORT' message below" "DarkGray"
    Write-Host ""
    Write-Colored "───────────────────────────────────────────────────────────────" "DarkGray"
    Write-Host ""
    
    Push-Location server
    try {
        & npm start
    } finally {
        Pop-Location
    }
}

# Main execution
try {
    Write-Banner
    
    # System information
    Write-Colored "[*] System Information" "Yellow"
    Write-Colored "    OS: $($PSVersionTable.OS)" "DarkGray"
    Write-Colored "    PowerShell: $($PSVersionTable.PSVersion)" "DarkGray"
    Write-Colored "    Server Version: $SERVER_VERSION" "DarkGray"
    Write-Host ""
    
    if (-not (Check-NodeJS)) {
        Write-Host ""
        Write-Colored "╔═══════════════════════════════════════════════════════════╗" "Red"
        Write-Colored "║                    ERROR                                  ║" "Red"
        Write-Colored "╠═══════════════════════════════════════════════════════════╣" "Red"
        Write-Colored "║  Node.js is required to run the server.                   ║" "White"
        Write-Colored "║                                                           ║" "White"
        Write-Colored "║  Please install Node.js 18+ from:                         ║" "White"
        Write-Colored "║  https://nodejs.org/                                      ║" "Cyan"
        Write-Colored "╚═══════════════════════════════════════════════════════════╝" "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    if (-not (Install-Dependencies)) {
        Write-Host ""
        Write-Colored "╔═══════════════════════════════════════════════════════════╗" "Red"
        Write-Colored "║                    ERROR                                  ║" "Red"
        Write-Colored "╠═══════════════════════════════════════════════════════════╣" "Red"
        Write-Colored "║  Failed to install server dependencies.                  ║" "White"
        Write-Colored "║  Please check the error messages above and try again.    ║" "White"
        Write-Colored "╚═══════════════════════════════════════════════════════════╝" "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Start-Server
    
} catch {
    Write-Host ""
    Write-Colored "╔═══════════════════════════════════════════════════════════╗" "Red"
    Write-Colored "║                    FATAL ERROR                            ║" "Red"
    Write-Colored "╠═══════════════════════════════════════════════════════════╣" "Red"
    Write-Colored "║  An unexpected error occurred:                             ║" "White"
    Write-Colored "║  $_" "White"
    Write-Colored "╚═══════════════════════════════════════════════════════════╝" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
