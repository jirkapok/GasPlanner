$ErrorActionPreference = 'Stop'

npm run test-lib-ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot/install-lib.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test-ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
