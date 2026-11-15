<#
    .SYNOPSIS
        Verifies the AI downloads published with the application: the MCP server bundle (ai/dugong.mcpb)
        and the Skill (ai/dugong-skill.zip) are zip archives, not the SPA fallback page,
        and the bundle manifest contains the expected version.

    .PARAMETER SiteUrl
        The base URL of the site, e.g. https://dugong.online or http://localhost:9090.

    .PARAMETER ExpectedVersion
        The version the MCP bundle manifest has to contain (e.g. "0.25.0").
#>

param(
    [Parameter(Mandatory = $true)]
    [String]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [String]$ExpectedVersion
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression

$downloads = Join-Path ([IO.Path]::GetTempPath()) "dugong-ai-downloads-$([Guid]::NewGuid())"
New-Item -ItemType Directory -Force $downloads | Out-Null

function Get-Download([String]$fileName) {
    # cache-busting query parameter to avoid CDN caching
    $url = "$SiteUrl/ai/${fileName}?t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    $target = Join-Path $downloads $fileName
    Invoke-WebRequest -Uri $url -OutFile $target -TimeoutSec 60

    # zip local file header signature "PK", the SPA fallback (404.html) is a text page
    $bytes = [IO.File]::ReadAllBytes($target)
    if ($bytes.Length -lt 4 -or $bytes[0] -ne 0x50 -or $bytes[1] -ne 0x4B) {
        throw "$url is not a zip archive (got $($bytes.Length) bytes), the site probably returned the application page instead of the file."
    }

    Write-Host "✓ $url is a zip archive ($($bytes.Length) bytes)"
    return $target
}

try {
    $bundle = Get-Download 'dugong.mcpb'
    Get-Download 'dugong-skill.zip' | Out-Null

    $archive = [IO.Compression.ZipFile]::OpenRead($bundle)
    try {
        $entry = $archive.GetEntry('manifest.json')
        if ($null -eq $entry) {
            throw 'dugong.mcpb does not contain manifest.json'
        }

        $reader = New-Object IO.StreamReader($entry.Open())
        try {
            $manifest = $reader.ReadToEnd() | ConvertFrom-Json
        }
        finally {
            $reader.Dispose()
        }
    }
    finally {
        $archive.Dispose()
    }

    if ($manifest.version -ne $ExpectedVersion) {
        throw "dugong.mcpb has version '$($manifest.version)', expected '$ExpectedVersion'"
    }

    Write-Host "✓ dugong.mcpb has version $ExpectedVersion"
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
finally {
    Remove-Item $downloads -Recurse -Force -ErrorAction SilentlyContinue
}
