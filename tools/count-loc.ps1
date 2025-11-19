# Lines of Code Counter
# Counts actual lines of code excluding comments and documentation files

param(
    [string]$RootPath = ".."
)

$ErrorActionPreference = "Stop"

# Directories and files to exclude
$ExcludeDirs = @("DOCS", "node_modules", "sample_assets", "assets", "debugs", ".git")
$ExcludeFiles = @("README.md", "*.md")

# File extensions to count
$CodeExtensions = @("*.js", "*.css", "*.html")

Write-Host "`n=== Lines of Code Counter ===" -ForegroundColor Cyan
Write-Host "Scanning codebase..." -ForegroundColor Yellow
Write-Host ""

$totalLines = 0
$fileCount = 0
$fileDetails = @()

function Remove-JSComments {
    param([string]$content)
    
    $result = ""
    $inMultiLineComment = $false
    $inString = $false
    $stringChar = ""
    $i = 0
    
    while ($i -lt $content.Length) {
        $char = $content[$i]
        $nextChar = if ($i + 1 -lt $content.Length) { $content[$i + 1] } else { "" }
        
        if (-not $inMultiLineComment -and -not $inString) {
            # Check for string start
            if ($char -eq '"' -or $char -eq "'" -or $char -eq '`') {
                $inString = $true
                $stringChar = $char
                $result += $char
                $i++
                continue
            }
            
            # Check for single-line comment
            if ($char -eq '/' -and $nextChar -eq '/') {
                # Skip to end of line
                while ($i -lt $content.Length -and $content[$i] -ne "`n" -and $content[$i] -ne "`r") {
                    $i++
                }
                continue
            }
            
            # Check for multi-line comment start
            if ($char -eq '/' -and $nextChar -eq '*') {
                $inMultiLineComment = $true
                $i += 2
                continue
            }
        }
        
        if ($inMultiLineComment) {
            # Check for multi-line comment end
            if ($char -eq '*' -and $nextChar -eq '/') {
                $inMultiLineComment = $false
                $i += 2
                continue
            }
            $i++
            continue
        }
        
        if ($inString) {
            $result += $char
            # Check for string end (handle escaped quotes)
            if ($char -eq $stringChar -and ($i -eq 0 -or $content[$i - 1] -ne '\')) {
                $inString = $false
                $stringChar = ""
            }
        } else {
            $result += $char
        }
        
        $i++
    }
    
    return $result
}

function Remove-CSSComments {
    param([string]$content)
    
    $result = ""
    $inComment = $false
    $i = 0
    
    while ($i -lt $content.Length) {
        $char = $content[$i]
        $nextChar = if ($i + 1 -lt $content.Length) { $content[$i + 1] } else { "" }
        
        if (-not $inComment) {
            if ($char -eq '/' -and $nextChar -eq '*') {
                $inComment = $true
                $i += 2
                continue
            }
            $result += $char
        } else {
            if ($char -eq '*' -and $nextChar -eq '/') {
                $inComment = $false
                $i += 2
                continue
            }
        }
        
        $i++
    }
    
    return $result
}

function Remove-HTMLComments {
    param([string]$content)
    
    $result = $content
    # Remove HTML comments <!-- ... -->
    $result = $result -replace '(?s)<!--.*?-->', ''
    
    # Extract and process script tags (JavaScript)
    $scriptPattern = '(?s)<script[^>]*>(.*?)</script>'
    $result = $result -replace $scriptPattern, {
        param($match)
        $scriptContent = $match.Groups[1].Value
        $processedScript = Remove-JSComments -content $scriptContent
        return "<script>$processedScript</script>"
    }
    
    # Extract and process style tags (CSS)
    $stylePattern = '(?s)<style[^>]*>(.*?)</style>'
    $result = $result -replace $stylePattern, {
        param($match)
        $styleContent = $match.Groups[1].Value
        $processedStyle = Remove-CSSComments -content $styleContent
        return "<style>$processedStyle</style>"
    }
    
    return $result
}

function Count-LinesOfCode {
    param(
        [string]$filePath,
        [string]$extension
    )
    
    try {
        $content = Get-Content -Path $filePath -Raw -ErrorAction Stop
        
        # Remove comments based on file type
        switch ($extension) {
            ".js" {
                $processed = Remove-JSComments -content $content
            }
            ".css" {
                $processed = Remove-CSSComments -content $content
            }
            ".html" {
                $processed = Remove-HTMLComments -content $content
            }
            default {
                $processed = $content
            }
        }
        
        # Split into lines and count non-empty lines
        $lines = $processed -split "`r?`n"
        $codeLines = ($lines | Where-Object { $_.Trim() -ne "" }).Count
        
        return $codeLines
    }
    catch {
        Write-Warning "Error processing $filePath : $_"
        return 0
    }
}

# Get all code files
$allFiles = Get-ChildItem -Path $RootPath -Recurse -Include $CodeExtensions -File | 
    Where-Object {
        $shouldInclude = $true
        
        # Check if file is in excluded directory
        foreach ($excludeDir in $ExcludeDirs) {
            if ($_.FullName -like "*\$excludeDir\*" -or $_.FullName -like "*\$excludeDir") {
                $shouldInclude = $false
                break
            }
        }
        
        # Check if file matches exclude pattern
        foreach ($excludeFile in $ExcludeFiles) {
            if ($_.Name -like $excludeFile) {
                $shouldInclude = $false
                break
            }
        }
        
        return $shouldInclude
    }

# Process each file
foreach ($file in $allFiles) {
    $extension = $file.Extension
    $lineCount = Count-LinesOfCode -filePath $file.FullName -extension $extension
    
    if ($lineCount -gt 0) {
        $relativePath = $file.FullName.Replace((Resolve-Path $RootPath).Path + "\", "")
        $fileDetails += [PSCustomObject]@{
            File = $relativePath
            Lines = $lineCount
            Extension = $extension
        }
        
        $totalLines += $lineCount
        $fileCount++
    }
}

# Display results
Write-Host "Results:" -ForegroundColor Green
Write-Host "--------"
Write-Host "Total Files: $fileCount" -ForegroundColor White
Write-Host "Total Lines of Code: $totalLines" -ForegroundColor White
Write-Host ""

# Group by extension
$byExtension = $fileDetails | Group-Object -Property Extension | 
    Sort-Object Count -Descending

Write-Host "Breakdown by File Type:" -ForegroundColor Cyan
foreach ($group in $byExtension) {
    $extLines = ($group.Group | Measure-Object -Property Lines -Sum).Sum
    $extCount = $group.Count
    Write-Host "  $($group.Name): $extLines lines ($extCount files)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Top 10 Largest Files:" -ForegroundColor Cyan
$fileDetails | Sort-Object Lines -Descending | Select-Object -First 10 | 
    ForEach-Object {
        Write-Host "  $($_.Lines.ToString().PadLeft(6)) lines - $($_.File)" -ForegroundColor Gray
    }

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan
Write-Host ""

