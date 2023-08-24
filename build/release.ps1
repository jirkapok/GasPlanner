# use this script as automation for release at github
param([String]$tag)
Write-Host "Preparing version $($tag)"

git checkout master
git merge develop

./build.ps1

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
