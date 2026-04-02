<#
    .SYNOPSIS
        Rolls back the gh-pages branch to a specified commit SHA
        by resetting and force-pushing.

    .PARAMETER CommitSha
        The commit SHA to roll back to.
#>

param(
    [Parameter(Mandatory = $true)]
    [String]$CommitSha
)

$ErrorActionPreference = 'Stop'

Write-Host "Rolling back gh-pages to $CommitSha ..."

git fetch origin gh-pages
git worktree add gh-pages-rollback gh-pages

Push-Location gh-pages-rollback

git reset --hard $CommitSha
git push origin gh-pages --force

Pop-Location

git worktree remove gh-pages-rollback --force

Write-Host "Rollback complete. gh-pages is now at $CommitSha"
