#!/usr/bin/env bash
set -euo pipefail

npm run format:check
npm run lint -- --project scuba-physics
npm run lint -- --project planner
