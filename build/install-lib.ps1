$ErrorActionPreference = 'Stop'

# Build the scuba-physics library and install it locally
# so the planner project can resolve the dependency
npm run build-lib
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm install ./dist/scuba-physics --no-package-lock --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
