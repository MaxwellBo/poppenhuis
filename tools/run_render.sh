#!/usr/bin/env bash
set -euo pipefail
cd "${BUILD_WORKSPACE_DIRECTORY:?Run this target with bazel run}"
if [[ ! -d node_modules ]]; then
  echo "node_modules missing; run npm install first" >&2
  exit 1
fi
exec npx tsx render.ts "$@"
