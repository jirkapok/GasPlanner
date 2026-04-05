$ErrorActionPreference = 'Stop'

function Get-CoverageSummary($lcovPath, $name) {
    if (-not (Test-Path $lcovPath)) {
        Write-Host "Coverage file not found: $lcovPath"
        return $null
    }

    Write-Host "Parsing coverage: $lcovPath"
    $content = Get-Content $lcovPath
    $linesFound = 0
    $linesHit = 0
    $functionsFound = 0
    $functionsHit = 0
    $branchesFound = 0
    $branchesHit = 0

    foreach ($line in $content) {
        if ($line -match '^LF:(\d+)') { $linesFound += [int]$Matches[1] }
        if ($line -match '^LH:(\d+)') { $linesHit += [int]$Matches[1] }
        if ($line -match '^FNF:(\d+)') { $functionsFound += [int]$Matches[1] }
        if ($line -match '^FNH:(\d+)') { $functionsHit += [int]$Matches[1] }
        if ($line -match '^BRF:(\d+)') { $branchesFound += [int]$Matches[1] }
        if ($line -match '^BRH:(\d+)') { $branchesHit += [int]$Matches[1] }
    }

    Write-Host "$name - Lines: $linesHit/$linesFound, Functions: $functionsHit/$functionsFound, Branches: $branchesHit/$branchesFound"

    $linePct = if ($linesFound -gt 0) { [math]::Round($linesHit / $linesFound * 100, 1) } else { 0 }
    $funcPct = if ($functionsFound -gt 0) { [math]::Round($functionsHit / $functionsFound * 100, 1) } else { 0 }
    $branchPct = if ($branchesFound -gt 0) { [math]::Round($branchesHit / $branchesFound * 100, 1) } else { 0 }

    return @{
        Name = $name
        Lines = "$linePct% ($linesHit/$linesFound)"
        Functions = "$funcPct% ($functionsHit/$functionsFound)"
        Branches = "$branchPct% ($branchesHit/$branchesFound)"
    }
}

$physics = Get-CoverageSummary 'coverage/scuba-physics/lcov.info' 'scuba-physics'
$planner = Get-CoverageSummary 'coverage/planner/lcov.info' 'planner'

$lines = @()
$lines += "## :bar_chart: Code Coverage Summary"
$lines += ""
$lines += "| Project | Lines | Functions | Branches |"
$lines += "|---------|-------|-----------|----------|"

if ($null -ne $physics) {
    $lines += "| **$($physics.Name)** | $($physics.Lines) | $($physics.Functions) | $($physics.Branches) |"
}
if ($null -ne $planner) {
    $lines += "| **$($planner.Name)** | $($planner.Lines) | $($planner.Functions) | $($planner.Branches) |"
}

$body = $lines -join "`n"

# Write to step summary
$body | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8 -Append
