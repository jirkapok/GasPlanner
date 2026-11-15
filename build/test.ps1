$ErrorActionPreference = 'Stop'

# unit tests run in Vitest browser mode
npx playwright install chromium
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test-lib-ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot/install-lib.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# the MCP server consumes the built library the same way as the planner
npm run test-mcp-ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test-ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
