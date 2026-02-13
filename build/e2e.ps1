$ErrorActionPreference = 'Stop'

& "$PSScriptRoot/install-lib.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx playwright install chromium
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run e2e
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
