# Bundles the Dugong MCP server and the Skill command line into self-contained Node scripts
# and packs them into dist/dugong-mcp/dugong.mcpb and dist/dugong-mcp/dugong-skill.zip.
# Parameter -SkipLibrary uses already built dist/scuba-physics (e.g. after install-lib.ps1).
param(
    [switch]$SkipLibrary
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path "$PSScriptRoot/.."
$project = Join-Path $root 'projects/dugong-mcp'
$output = Join-Path $root 'dist/dugong-mcp'
$bundle = Join-Path $output 'bundle'
$skill = Join-Path $output 'skill'
$skillName = 'dugong-dive-planner'

Push-Location $root
try {
    if (-not $SkipLibrary) {
        npm run build-lib
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    $version = (Get-Content (Join-Path $project 'manifest.json') -Raw | ConvertFrom-Json).version
    Write-Host "Bundling Dugong MCP server and Skill version $version"

    if (Test-Path $output) { Remove-Item $output -Recurse -Force }
    New-Item -ItemType Directory -Force (Join-Path $bundle 'server') | Out-Null
    New-Item -ItemType Directory -Force (Join-Path $skill 'scripts') | Out-Null

    # Some bundled dependencies are CommonJS, the banner provides require in the ES module output
    $esbuildArgs = @(
        '--bundle', '--platform=node', '--format=esm', '--target=node20', '--log-level=warning',
        "--define:__DUGONG_VERSION__=`"$version`"",
        '--alias:scuba-physics=./dist/scuba-physics',
        "--banner:js=import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"
    )

    npx esbuild (Join-Path $project 'src/stdio.ts') @esbuildArgs "--outfile=$(Join-Path $bundle 'server/dugong-mcp.mjs')"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npx esbuild (Join-Path $project 'src/cli.ts') @esbuildArgs "--outfile=$(Join-Path $skill 'scripts/dugong.mjs')"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    # MCP bundle (.mcpb) for Claude Desktop and other MCP clients
    Copy-Item (Join-Path $project 'manifest.json') $bundle
    Copy-Item (Join-Path $root 'LICENSE') $bundle
    npx mcpb pack $bundle (Join-Path $output 'dugong.mcpb')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    # Skill zip with the skill folder as its root
    Copy-Item (Join-Path $project 'skill/*') $skill -Recurse
    $staging = Join-Path $output 'skill-zip'
    $skillFolder = Join-Path $staging $skillName
    New-Item -ItemType Directory -Force $skillFolder | Out-Null
    Copy-Item (Join-Path $skill '*') $skillFolder -Recurse
    Compress-Archive -Path $skillFolder -DestinationPath (Join-Path $output 'dugong-skill.zip') -Force
    Remove-Item $staging -Recurse -Force

    # Smoke test of the bundled command line, it has to run without the repository node_modules
    $example = Join-Path $project 'skill/examples/air-30m.json'
    $result = Get-Content $example -Raw | node (Join-Path $skill 'scripts/dugong.mjs') plan_dive
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Skill smoke test failed with exit code $LASTEXITCODE`n$result"
    }
    if (-not ($result -join "`n").Contains('"runtime"')) {
        Write-Error "Skill smoke test output doesn't contain the runtime:`n$result"
    }

    Write-Host "Created $(Join-Path $output 'dugong.mcpb') and $(Join-Path $output 'dugong-skill.zip')"
}
finally {
    Pop-Location
}
