<#
    .SYNOPSIS
        Polls the production manifest.webmanifest until the deployed version
        matches the expected version, or times out.

    .PARAMETER ExpectedVersion
        The version string to wait for (e.g. "0.1.38").

    .PARAMETER SiteUrl
        The base URL of the production site.

    .PARAMETER TimeoutSeconds
        Maximum time to wait before giving up. Default: 240 (4 minutes).

    .PARAMETER IntervalSeconds
        Time between poll attempts. Default: 15.
#>

param(
    [Parameter(Mandatory = $true)]
    [String]$ExpectedVersion,

    [Parameter(Mandatory = $true)]
    [String]$SiteUrl,

    [int]$TimeoutSeconds = 240,

    [int]$IntervalSeconds = 15
)

$ErrorActionPreference = 'Stop'

$manifestUrl = "$SiteUrl/manifest.webmanifest"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

Write-Host "Waiting for $manifestUrl to report version $ExpectedVersion ..."

while ((Get-Date) -lt $deadline) {
    try {
        # Use a cache-busting query parameter to avoid CDN/browser caching
        $response = Invoke-RestMethod -Uri "${manifestUrl}?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -TimeoutSec 10
        $deployedVersion = $response.id

        if ($deployedVersion -eq $ExpectedVersion) {
            Write-Host "Version $ExpectedVersion is live."
            exit 0
        }

        Write-Host "Current version: $deployedVersion (waiting for $ExpectedVersion)"
    }
    catch {
        Write-Host "Request failed: $($_.Exception.Message). Retrying..."
    }

    Start-Sleep -Seconds $IntervalSeconds
}

Write-Error "Timed out after ${TimeoutSeconds}s waiting for version $ExpectedVersion"
exit 1
