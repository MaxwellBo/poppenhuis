#!/usr/bin/env bash
set -euo pipefail
cd "${BUILD_WORKSPACE_DIRECTORY:?Run this target with bazel run}"
exec python3 scripts/repair-ps2-icon-glbs.py "$@"
