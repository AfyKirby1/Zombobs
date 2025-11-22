# Zombobs Server Launcher
# PowerShell wrapper with styled output and enhanced information

$Host.UI.RawUI.WindowTitle = "Zombobs Server"

# Server configuration
$script:SERVER_PORT = 3000
$SERVER_PORT = $script:SERVER_PORT  # For backward compatibility
$SERVER_VERSION = "0.7.1"
$HF_SPACE_URL = "https://ottertondays-zombs.hf.space"
$HF_SPACE_PAGE = "https://huggingface.co/spaces/OttertonDays/zombs"

# Taskbar configuration
$script:TaskbarEnabled = $true
$script:TaskbarUpdateInterval = 2  # Update every 2 seconds
$script:TaskbarTimer = $null

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

function Get-BackendRAM {
    try {
        # Get Node.js processes (server should be running as node.exe)
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            # Sum up memory usage of all Node.js processes (in MB)
            $totalBackendRAM = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
            return [math]::Round($totalBackendRAM, 2)
        }
        return 0
    } catch {
        return 0
    }
}

function Get-SystemStats {
    $stats = @{}
    try {
        # Get RAM usage
        $os = Get-CimInstance Win32_OperatingSystem
        $totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
        $ramPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
        
        $stats.TotalRAM = $totalRAM
        $stats.UsedRAM = $usedRAM
        $stats.FreeRAM = $freeRAM
        $stats.RAMPercent = $ramPercent
        
        # Get backend RAM usage
        $stats.BackendRAM = Get-BackendRAM
        
        # Get CPU usage (average over 1 second)
        $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
        if ($cpu) {
            $stats.CPUPercent = [math]::Round($cpu.CounterSamples[0].CookedValue, 1)
        } else {
            $stats.CPUPercent = 0
        }
        
        # Get uptime
        $uptime = (Get-Date) - $os.LastBootUpTime
        $stats.Uptime = "{0:D2}:{1:D2}:{2:D2}" -f $uptime.Hours, $uptime.Minutes, $uptime.Seconds
        
        # Get current time
        $stats.CurrentTime = Get-Date -Format "HH:mm:ss"
        
    } catch {
        $stats.Error = $_.Exception.Message
    }
    return $stats
}

function Show-Taskbar {
    $stats = Get-SystemStats
    
    # Save current cursor position
    $cursorTop = [Console]::CursorTop
    $cursorLeft = [Console]::CursorLeft
    
    # Move to top of screen
    [Console]::SetCursorPosition(0, 0)
    
    # Build taskbar line
    $ramColor = if ($stats.RAMPercent -gt 80) { "Red" } elseif ($stats.RAMPercent -gt 60) { "Yellow" } else { "Green" }
    $cpuColor = if ($stats.CPUPercent -gt 80) { "Red" } elseif ($stats.CPUPercent -gt 60) { "Yellow" } else { "Green" }
    $backendRAMColor = if ($stats.BackendRAM -gt 500) { "Yellow" } elseif ($stats.BackendRAM -gt 0) { "Cyan" } else { "DarkGray" }
    
    $taskbarLine = "RAM: $($stats.UsedRAM)GB/$($stats.TotalRAM)GB ($($stats.RAMPercent)%) | CPU: $($stats.CPUPercent)% | Backend: $($stats.BackendRAM)MB | Uptime: $($stats.Uptime) | Time: $($stats.CurrentTime) | Port: $SERVER_PORT"
    
    # Clear the line and write taskbar
    Write-Host (" " * ([Console]::WindowWidth - 1)) -NoNewline
    [Console]::SetCursorPosition(0, 0)
    
    # Write colored taskbar
    Write-Host "RAM: " -NoNewline
    Write-Host "$($stats.UsedRAM)GB/$($stats.TotalRAM)GB ($($stats.RAMPercent)%)" -ForegroundColor $ramColor -NoNewline
    Write-Host " | CPU: " -NoNewline
    Write-Host "$($stats.CPUPercent)%" -ForegroundColor $cpuColor -NoNewline
    Write-Host " | Backend: " -NoNewline
    Write-Host "$($stats.BackendRAM)MB" -ForegroundColor $backendRAMColor -NoNewline
    Write-Host " | Uptime: $($stats.Uptime) | Time: $($stats.CurrentTime) | Port: $($script:SERVER_PORT)" -NoNewline
    
    # Restore cursor position
    [Console]::SetCursorPosition($cursorLeft, $cursorTop)
}

function Start-TaskbarMonitor {
    if (-not $script:TaskbarEnabled) { return }
    
    # Stop existing timer if any
    if ($script:TaskbarTimer) {
        $script:TaskbarTimer.Stop()
        $script:TaskbarTimer.Dispose()
    }
    
    # Use script-scoped variables
    $interval = $script:TaskbarUpdateInterval
    
    # Create a timer to update taskbar periodically
    $script:TaskbarTimer = New-Object System.Timers.Timer
    $script:TaskbarTimer.Interval = $interval * 1000
    $script:TaskbarTimer.AutoReset = $true
    
    # Register event to update taskbar
    $null = Register-ObjectEvent -InputObject $script:TaskbarTimer -EventName Elapsed -Action {
        try {
            # Get stats
            $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
            if (-not $os) { return }
            
            $totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
            $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
            $usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
            $ramPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
            
            $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
            $cpuPercent = if ($cpu) { [math]::Round($cpu.CounterSamples[0].CookedValue, 1) } else { 0 }
            
            $uptime = (Get-Date) - $os.LastBootUpTime
            $uptimeStr = "{0:D2}:{1:D2}:{2:D2}" -f $uptime.Hours, $uptime.Minutes, $uptime.Seconds
            $currentTime = Get-Date -Format "HH:mm:ss"
            
            # Save cursor position
            $cursorTop = [Console]::CursorTop
            $cursorLeft = [Console]::CursorLeft
            
            # Update taskbar at top
            [Console]::SetCursorPosition(0, 0)
            Write-Host (" " * ([Console]::WindowWidth - 1)) -NoNewline
            [Console]::SetCursorPosition(0, 0)
            
            $ramColor = if ($ramPercent -gt 80) { "Red" } elseif ($ramPercent -gt 60) { "Yellow" } else { "Green" }
            $cpuColor = if ($cpuPercent -gt 80) { "Red" } elseif ($cpuPercent -gt 60) { "Yellow" } else { "Green" }
            
            # Get backend RAM usage
            $backendRAM = 0
            try {
                $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
                if ($nodeProcesses) {
                    $backendRAM = [math]::Round(($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
                }
            } catch {
                # Silently fail
            }
            $backendRAMColor = if ($backendRAM -gt 500) { "Yellow" } elseif ($backendRAM -gt 0) { "Cyan" } else { "DarkGray" }
            
            Write-Host "RAM: " -NoNewline
            Write-Host "$usedRAM GB/$totalRAM GB ($ramPercent%)" -ForegroundColor $ramColor -NoNewline
            Write-Host " | CPU: " -NoNewline
            Write-Host "$cpuPercent%" -ForegroundColor $cpuColor -NoNewline
            Write-Host " | Backend: " -NoNewline
            Write-Host "$backendRAM MB" -ForegroundColor $backendRAMColor -NoNewline
            Write-Host " | Uptime: $uptimeStr | Time: $currentTime | Port: $($script:SERVER_PORT)" -NoNewline
            
            # Restore cursor
            [Console]::SetCursorPosition($cursorLeft, $cursorTop)
        } catch {
            # Silently fail
        }
    }
    
    $script:TaskbarTimer.Start()
}

function Stop-TaskbarMonitor {
    if ($script:TaskbarTimer) {
        $script:TaskbarTimer.Stop()
        $script:TaskbarTimer.Dispose()
        $script:TaskbarTimer = $null
    }
    # Clean up registered events
    Get-EventSubscriber | Where-Object { $_.SourceObject -eq $script:TaskbarTimer } | Unregister-Event -ErrorAction SilentlyContinue
}

function Write-Banner {
    Clear-Host
    # Show taskbar at top
    if ($script:TaskbarEnabled) {
        Show-Taskbar
        Write-Host ""
    }
    Write-Host ""
    Write-Colored "===============================================================" "Cyan"
    Write-Colored "                                                               " "Cyan"
    Write-Colored "         Z O M B O B S   S E R V E R                          " "Cyan"
    Write-Colored "                                                               " "Cyan"
    $bannerVersion = "         Multiplayer Backend Server V" + $SERVER_VERSION + "                "
    Write-Colored $bannerVersion "Cyan"
    Write-Colored "                                                               " "Cyan"
    Write-Colored "===============================================================" "Cyan"
    Write-Host ""
}

function Check-NodeJS {
    Write-Colored "[*] Checking for Node.js..." "Yellow"
    try {
        # Check if node command exists
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCmd) {
            Write-Colored "[-] Node.js not found!" "Red"
            return $false
        }
        
        # Get node version using Start-Process to avoid any redirection issues
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo.FileName = "node"
        $process.StartInfo.Arguments = "--version"
        $process.StartInfo.RedirectStandardOutput = $true
        $process.StartInfo.RedirectStandardError = $true
        $process.StartInfo.UseShellExecute = $false
        $process.StartInfo.CreateNoWindow = $true
        $process.Start() | Out-Null
        $nodeVersion = $process.StandardOutput.ReadToEnd().Trim()
        $process.WaitForExit()
        $exitCode = $process.ExitCode
        
        if ($exitCode -eq 0 -and $nodeVersion) {
            if ($nodeVersion -match 'v(\d+)\.(\d+)\.(\d+)') {
                $majorVersion = [int]$matches[1]
                $minorVersion = [int]$matches[2]
                Write-Colored "[+] Node.js found: $nodeVersion" "Green"
                
                # Check if version meets requirements
                if ($majorVersion -ge 18) {
                    $msg1 = '    Version meets requirements (18.0.0+)'
                    Write-Colored $msg1 "DarkGray"
                } else {
                    $warningMsg = '    Warning: Node.js 18+ recommended (found ' + $nodeVersion + ')'
                    Write-Colored $warningMsg "Yellow"
                }
                return $true
            } else {
                Write-Colored "[+] Node.js found: $nodeVersion" "Green"
                $msg2 = '    (Version format check skipped)'
                Write-Colored $msg2 "DarkGray"
                return $true
            }
        } else {
            Write-Colored "[-] Node.js not found!" "Red"
            return $false
        }
    }
    catch {
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
        $portMsg = '[+] Port check skipped (assuming available)'
        Write-Colored $portMsg "DarkGray"
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
    Write-Colored "===============================================================" "DarkGray"
    Write-Colored "                    SERVER INFORMATION                        " "White"
    Write-Colored "---------------------------------------------------------------" "DarkGray"
    Write-Host ""
    
    Write-Colored "   LOCAL SERVER:" "White"
    Write-Colored "   -------------------------------------------------------------" "DarkGray"
    Write-Colored "   URL:        http://localhost:$SERVER_PORT" "Cyan"
    if ($localIP) {
        $networkUrl = "http://${localIP}:$SERVER_PORT"
        Write-Colored "   Network:    $networkUrl" "Cyan"
        $networkMsg = '(Use this URL for other devices on your network)'
        Write-Colored $networkMsg "DarkGray"
    }
    Write-Colored "   Status:     Starting..." "Yellow"
    Write-Colored "   Port:       $SERVER_PORT" "DarkGray"
    Write-Host ""
    
    Write-Colored "   HUGGING FACE SERVER:" "White"
    Write-Colored "   -------------------------------------------------------------" "DarkGray"
    Write-Colored "   Space URL:  $HF_SPACE_PAGE" "Cyan"
    Write-Colored "   API URL:    $HF_SPACE_URL" "Cyan"
    
    Write-Host ""
    Write-Colored "===============================================================" "DarkGray"
    Write-Host ""
}

function Install-Dependencies {
    Write-Host ""
    Write-Colored "[*] Checking dependencies..." "Yellow"
    
    if (-not (Test-Path "LOCAL_SERVER\node_modules")) {
        Write-Colored "[!] Dependencies not found. Installing..." "Yellow"
        Write-Colored "    This may take a few moments..." "DarkGray"
        Write-Host ""
        
        Push-Location LOCAL_SERVER
        $installStart = Get-Date
        & npm install
        $installSuccess = $?
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
        if (Test-Path "LOCAL_SERVER\package.json") {
            try {
                $packageJson = Get-Content "LOCAL_SERVER\package.json" | ConvertFrom-Json
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
    Write-Colored "===============================================================" "DarkGray"
    Write-Colored "              CONNECTION INSTRUCTIONS                        " "White"
    Write-Colored "---------------------------------------------------------------" "DarkGray"
    Write-Host ""
    Write-Colored "   TO CONNECT FROM BROWSER:" "White"
    Write-Colored "   1. Open your web browser" "DarkGray"
    Write-Colored "   2. Navigate to: http://localhost:$SERVER_PORT" "Cyan"
    Write-Colored "   3. The game will automatically connect to this server" "DarkGray"
    Write-Host ""
    Write-Colored "   TO CONNECT FROM OTHER DEVICES:" "White"
    $localIP = Get-LocalIP
    if ($localIP) {
        $networkUrl = "http://${localIP}:$SERVER_PORT"
        Write-Colored "   1. Make sure your device is on the same network" "DarkGray"
        Write-Colored "   2. Navigate to: $networkUrl" "Cyan"
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
    Write-Colored "===============================================================" "DarkGray"
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
        return $false
    }
    
    # Test Hugging Face connection
    $hfConnected = Test-HuggingFaceServer
    
    # Show server information
    Show-ServerInfo
    
    # Show connection instructions
    Show-ConnectionInstructions
    
    Write-Colored "===============================================================" "DarkGray"
    Write-Colored "                    SERVER STATUS                            " "White"
    Write-Colored "---------------------------------------------------------------" "DarkGray"
    Write-Host ""
    Write-Colored "   LOCAL SERVER:" "White"
    Write-Colored "   Status: Starting..." "Yellow"
    Write-Host ""
    Write-Colored "   HUGGING FACE SERVER:" "White"
    if ($hfConnected) {
        Write-Colored "   Status: CONNECTED [OK]" "Green"
        Write-Colored "   Note: Game can use either local or Hugging Face server" "DarkGray"
    } else {
        Write-Colored "   Status: NOT REACHABLE [X]" "Red"
        Write-Colored "   Note: Game will use local server (recommended for development)" "DarkGray"
    }
    Write-Host ""
    Write-Colored "===============================================================" "DarkGray"
    Write-Host ""
    Write-Colored "Press Ctrl+C to stop the server" "DarkGray"
    Write-Host ""
    Write-Colored "[*] Starting server process..." "Yellow"
    Write-Host ""
    
    # Clear screen and show taskbar
    Clear-Host
    if ($script:TaskbarEnabled) {
        Show-Taskbar
        Start-TaskbarMonitor
    }
    
    # Clear screen and show taskbar
    Clear-Host
    if ($script:TaskbarEnabled) {
        Show-Taskbar
        Start-TaskbarMonitor
    }
    
    Push-Location LOCAL_SERVER
    try {
        $confirmationShown = $false
        $localIP = Get-LocalIP
        
        # Start npm and filter output in real-time
        & npm start 2>&1 | ForEach-Object {
            $line = $_
            
            # Update taskbar periodically
            if ($script:TaskbarEnabled) {
                Show-Taskbar
            }
            
            # Check for server startup
            if ($line -match "Server running on port|Local server running on port|server running on port") {
                if (-not $confirmationShown) {
                    $confirmationShown = $true
                    Write-Host ""
                    Write-Colored "===============================================================" "Green"
                    Write-Colored "                    SERVER STARTED SUCCESSFULLY!" "Green"
                    Write-Colored "===============================================================" "Green"
                    Write-Colored "  Local Server: http://localhost:$SERVER_PORT" "Cyan"
                    if ($localIP) {
                        Write-Colored "  Network:      http://${localIP}:$SERVER_PORT" "Cyan"
                    }
                    Write-Colored "  Status:       Running and ready for connections" "Green"
                    Write-Colored "===============================================================" "Green"
                    Write-Host ""
                    Write-Colored "Server logs below. Press Ctrl+C to stop." "DarkGray"
                    Write-Host ""
                }
            }
            
            # Highlight connection/disconnection messages
            if ($line -match "CLIENT CONNECTED|CLIENT CONNECTED!") {
                Write-Host $line -ForegroundColor Green
            }
            elseif ($line -match "CLIENT DISCONNECTED|CLIENT DISCONNECTED") {
                Write-Host $line -ForegroundColor Red
            }
            elseif ($line -match "Player:|Total Players Online:|Active Players:") {
                Write-Host $line -ForegroundColor Cyan
            }
            elseif ($line -match "set name to|READY|NOT READY") {
                Write-Host $line -ForegroundColor Yellow
            }
            elseif ($line -match "^={60}$|^={60}") {
                # Highlight separator lines for connections
                Write-Host $line -ForegroundColor DarkGray
            }
            # Filter out npm noise but show everything else
            elseif ($line -notmatch "^npm WARN|^npm notice|^> zombobs-server@|^\s*$") {
                Write-Host $line
            }
        }
        
        $serverSuccess = $confirmationShown
        
        # If server exits with failure, it crashed
        if (-not $serverSuccess) {
            Write-Host ""
            Write-Colored "===============================================================" "Red"
            Write-Colored "                    SERVER CRASHED" "Red"
            Write-Colored "===============================================================" "Red"
            Write-Colored "  The server process exited with an error" "White"
            Write-Colored "  Check the error messages above for details." "White"
            Write-Colored "  Common issues:" "White"
            Write-Colored "    - Port already in use" "White"
            Write-Colored "    - Missing dependencies (run: npm install)" "White"
            Write-Colored "    - Node.js version incompatible" "White"
            Write-Colored "    - Syntax error in server.js" "White"
            Write-Colored "===============================================================" "Red"
            Write-Host ""
            return $false
        }
        
        # If exit code is 0, server stopped normally (user pressed Ctrl+C)
        return $true
    }
    catch {
        Write-Host ""
        Write-Colored "===============================================================" "Red"
        Write-Colored "                    SERVER STARTUP ERROR" "Red"
        Write-Colored "===============================================================" "Red"
        Write-Colored "  Failed to start the server:" "White"
        Write-Colored "  $($_.Exception.Message)" "White"
        Write-Colored "===============================================================" "Red"
        Write-Host ""
        return $false
    }
    finally {
        Stop-TaskbarMonitor
        Pop-Location
    }
}

# Main execution
try {
    Write-Banner
    
    # System information
    Write-Colored "[*] System Information" "Yellow"
    $osInfo = if ($PSVersionTable.OS) { $PSVersionTable.OS.ToString() } else { "Unknown" }
    $psVersion = if ($PSVersionTable.PSVersion) { $PSVersionTable.PSVersion.ToString() } else { "Unknown" }
    Write-Colored "    OS: $osInfo" "DarkGray"
    Write-Colored "    PowerShell: $psVersion" "DarkGray"
    Write-Colored "    Server Version: $SERVER_VERSION" "DarkGray"
    Write-Host ""
    
    if (-not (Check-NodeJS)) {
        Write-Host ""
        Write-Colored "===============================================================" "Red"
        Write-Colored "                    ERROR                                  " "Red"
        Write-Colored "---------------------------------------------------------------" "Red"
        Write-Colored "  Node.js is required to run the server.                   " "White"
        Write-Colored "                                                           " "White"
        Write-Colored "  Please install Node.js 18+ from:                         " "White"
        Write-Colored "  https://nodejs.org/                                      " "Cyan"
        Write-Colored "===============================================================" "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    if (-not (Install-Dependencies)) {
        Write-Host ""
        Write-Colored "===============================================================" "Red"
        Write-Colored "                    ERROR                                  " "Red"
        Write-Colored "---------------------------------------------------------------" "Red"
        Write-Colored "  Failed to install server dependencies.                  " "White"
        Write-Colored "  Please check the error messages above and try again.    " "White"
        Write-Colored "===============================================================" "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host ""
    Write-Colored "[*] All checks passed. Starting server..." "Green"
    Write-Host ""
    
    # Call Start-Server - this will run until server is stopped
    $serverStarted = Start-Server
    
    # Check if server started successfully
    if (-not $serverStarted) {
        Write-Host ""
        Write-Colored "[*] Server failed to start or crashed." "Red"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # If we get here, the server has stopped normally
    Stop-TaskbarMonitor
    Write-Host ""
    Write-Colored "[*] Server has stopped." "Yellow"
    
} catch {
    Stop-TaskbarMonitor
    Write-Host ""
    Write-Colored "===============================================================" "Red"
    Write-Colored "                    FATAL ERROR" "Red"
    Write-Colored "===============================================================" "Red"
    Write-Colored "  An unexpected error occurred:" "White"
    $errorMsg = $_.Exception.Message
    Write-Colored "  $errorMsg" "White"
    if ($_.InvocationInfo) {
        Write-Colored "  Line: $($_.InvocationInfo.ScriptLineNumber)" "White"
        Write-Colored "  Command: $($_.InvocationInfo.Line)" "White"
    }
    Write-Colored "===============================================================" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
