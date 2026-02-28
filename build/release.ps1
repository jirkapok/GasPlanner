<#
    .SYNOPSIS
        DEPRECATED: Releases are now automated via CI. See .github/workflows/ci.yml
        This script is kept for reference only.

    .EXAMPLE
        ./release.ps1 v1.0

        Publishes new version to github pages with tag "v1.0".
#>

Write-Warning "DEPRECATED: Releases are now automated via CI. See .github/workflows/ci.yml"

param(
    [Parameter(Mandatory = $true)]
    [String]$tag
)

Write-Host "Preparing version $($tag)"
Set-Location $PSScriptRoot
Set-Location ..

git checkout master
git merge develop

./build/build.ps1

git checkout .  # prevent failed gh-pages checkout because of any file changed during the build
git checkout gh-pages

# merge files
$filesToReplace = @(
    "*.js",
    "*.txt",
    "*.html",
    "*.css",
    "favicon.ico",
    "manifest.webmanifest",
    "ngsw.json"
)

Remove-Item $filesToReplace -Force
Remove-Item "assets" -Recurse -Force
Copy-Item "dist\planner\*" . -Recurse
Copy-Item "index.html" "404.html" -Recurse

# Release commit
git add .
git commit -m "Release $($tag)"

# this kick of the pages deployment on github pages
git push

git checkout master
git push
git tag $tag
git push --tags
