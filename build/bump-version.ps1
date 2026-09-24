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
Get-ChildItem "projects/planner/src" -Filter "manifest*.webmanifest" | ForEach-Object {
    $manifest = Get-Content $_.FullName -Raw
    $manifest = $manifest -replace '"id": ".*"', "`"id`": `"$Version`""
    Set-Content $_.FullName $manifest -NoNewline
}
