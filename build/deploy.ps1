$ErrorActionPreference = 'Stop'

# Build library and application
& "$PSScriptRoot/install-lib.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Configure git for CI
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Use git worktree to checkout gh-pages without switching branches
$ghPagesDir = "gh-pages-deploy"
if (Test-Path $ghPagesDir) { Remove-Item $ghPagesDir -Recurse -Force }

git fetch origin gh-pages
git worktree add $ghPagesDir gh-pages

Push-Location $ghPagesDir

# Clean old files (same set as release.ps1)
$filesToReplace = @("*.js", "*.txt", "*.html", "*.css", "favicon.ico", "manifest.webmanifest", "ngsw.json")
Remove-Item $filesToReplace -Force -ErrorAction SilentlyContinue
if (Test-Path "assets") { Remove-Item "assets" -Recurse -Force }

# Copy new build output
Copy-Item "../dist/planner/*" . -Recurse -Force
Copy-Item "index.html" "404.html" -Force

# Commit and push
git add .
$changes = git diff --cached --quiet 2>&1; $hasChanges = $LASTEXITCODE -ne 0

if ($hasChanges) {
    $version = if ($env:DEPLOY_VERSION) { $env:DEPLOY_VERSION } else { git rev-parse --short HEAD }
    git commit -m "Deploy $version"
    git push origin gh-pages
} else {
    Write-Host "No changes to deploy"
}

Pop-Location

# Cleanup worktree
git worktree remove $ghPagesDir --force
