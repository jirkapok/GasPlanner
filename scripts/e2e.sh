#!/usr/bin/env bash
set -euo pipefail

npm run build-lib
npm install ./dist/scuba-physics --no-package-lock --legacy-peer-deps
npm run e2e
