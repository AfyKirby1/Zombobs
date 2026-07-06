# Test script to find syntax errors - Windows PowerShell version.
# Uses node --check so ES module files are parsed without executing browser-only code.

$allJsFiles = Get-ChildItem -Path ".\js" -Recurse -Filter "*.js" | Select-Object -ExpandProperty FullName
$errors = @()

Write-Host "Testing JavaScript syntax..." -ForegroundColor Yellow

foreach ($file in $allJsFiles) {
    node --check $file
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $file" -ForegroundColor Green
    } else {
        $errors += $file
        Write-Host "[FAIL] $file" -ForegroundColor Red
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Syntax errors found in: $($errors -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "All JavaScript files have valid syntax!" -ForegroundColor Green
exit 0
