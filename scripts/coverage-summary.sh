#!/usr/bin/env bash
set -euo pipefail

echo "## Code Coverage Summary" >> "$GITHUB_STEP_SUMMARY"
echo "" >> "$GITHUB_STEP_SUMMARY"

if [ -f coverage/scuba-physics/lcov.info ]; then
  echo "### scuba-physics library" >> "$GITHUB_STEP_SUMMARY"
  echo '```' >> "$GITHUB_STEP_SUMMARY"
  grep -E "^(SF|LF|LH)" coverage/scuba-physics/lcov.info | head -20 >> "$GITHUB_STEP_SUMMARY" || true
  echo '```' >> "$GITHUB_STEP_SUMMARY"
fi

if [ -f coverage/planner/lcov.info ]; then
  echo "### planner application" >> "$GITHUB_STEP_SUMMARY"
  echo '```' >> "$GITHUB_STEP_SUMMARY"
  grep -E "^(SF|LF|LH)" coverage/planner/lcov.info | head -20 >> "$GITHUB_STEP_SUMMARY" || true
  echo '```' >> "$GITHUB_STEP_SUMMARY"
fi
