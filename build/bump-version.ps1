<#
    .SYNOPSIS
        Bumps the version in projects/scuba-physics/package.json and
        projects/planner/src/manifest.webmanifest.
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

# Bump manifest.webmanifest id field
$manifestPath = "projects/planner/src/manifest.webmanifest"
$manifest = Get-Content $manifestPath -Raw
$manifest = $manifest -replace '"id": ".*"', "`"id`": `"$Version`""
Set-Content $manifestPath $manifest -NoNewline
