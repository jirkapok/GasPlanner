$ErrorActionPreference = 'Stop'

# Build the scuba-physics library and install it locally
# so the planner project can resolve the dependency
npm run build-lib
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --no-save keeps all other packages at the versions from package-lock.json
npm install ./dist/scuba-physics --no-save --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
