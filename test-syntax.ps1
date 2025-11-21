# Test script to find syntax error
function Start-Server {
    Write-Host "Test"
    Push-Location server
    try {
        & npm start
        $serverExitCode = $LASTEXITCODE
        if ($serverExitCode -ne 0) {
            return $false
        }
        return $true
    }
    catch {
        return $false
    }
    finally {
        Pop-Location
    }
}

