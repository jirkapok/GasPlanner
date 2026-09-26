<#
    .SYNOPSIS
        Bumps the version in projects/scuba-physics/package.json and
        projects/planner/src/manifest*.webmanifest (default + all localized variants).
        Called by semantic-release via @semantic-release/exec during the prepare step.

    .PARAMETER Version
        The new version string (e.g. "0.1.38").
#>

param(
    [Parameter(Mandatory = $true)]
    [String]$Version
)

# Bump scuba-physics package.json
npm pkg set version=$Version --prefix projects/scuba-physics

# Bump id field in the default manifest and every localized variant
$manifestFiles = Get-ChildItem "projects/planner/src" -Filter "manifest*.webmanifest"

if ($manifestFiles.Count -eq 0) {
    Write-Error "No manifest files found!"
    exit 1
}

$failedFiles = @()
$updatedFiles = @()

foreach ($file in $manifestFiles) {
    try {
        # Parse JSON to validate and get current id
        $manifestContent = Get-Content $file.FullName -Raw | ConvertFrom-Json
        $oldId = $manifestContent.id

        # Update the id
        $manifestContent.id = $Version

        # Convert back to JSON with proper formatting (2-space indent for consistency)
        $jsonContent = $manifestContent | ConvertTo-Json -Depth 10

        # Write back without trailing newline
        Set-Content $file.FullName $jsonContent -NoNewline -Encoding UTF8

        Write-Host "✓ Updated $($file.Name): '$oldId' → '$Version'"
        $updatedFiles += $file.Name
    }
    catch {
        Write-Error "✗ Failed to update $($file.Name): $_"
        $failedFiles += $file.Name
    }
}

# CRITICAL: Verify that all manifest files have the same id (PWA requirement)
Write-Host "`nVerifying PWA manifest consistency..."
$allVersions = @()
foreach ($file in $manifestFiles) {
    $manifest = Get-Content $file.FullName | ConvertFrom-Json
    $allVersions += @{
        file = $file.Name
        id = $manifest.id
        lang = $manifest.lang
    }
}

$inconsistentFiles = $allVersions | Where-Object { $_.id -ne $Version }
if ($inconsistentFiles.Count -gt 0) {
    Write-Error "`n❌ Manifest files have inconsistent id values (BREAKS PWA spec):"
    $allVersions | ForEach-Object { Write-Error "  $($_.file): id=$($_.id), lang=$($_.lang)" }
    exit 1
}

Write-Host "✓ All $($manifestFiles.Count) manifest files have consistent id='$Version'"
Write-Host "  Languages: $($allVersions.lang -join ', ')"

if ($failedFiles.Count -gt 0) {
    Write-Error "`n❌ Failed to update the following files: $($failedFiles -join ', ')"
    exit 1
}
