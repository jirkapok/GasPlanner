#!/usr/bin/env bash
set -euo pipefail

npm run test-lib-ci --configuration=ci
npm run build-lib
npm install ./dist/scuba-physics --no-package-lock --legacy-peer-deps
npm run test-ci --configuration=ci
