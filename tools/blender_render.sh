#!/usr/bin/env bash
# Invoke Blender in background mode with render_blender.py.
set -euo pipefail

find_blender() {
  if command -v blender >/dev/null 2>&1; then
    command -v blender
    return
  fi
  local candidates=(
    /Applications/Blender.app/Contents/MacOS/Blender
    /usr/bin/blender
    "/c/Program Files/Blender Foundation/Blender/blender.exe"
  )
  local c
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      printf '%s\n' "$c"
      return
    fi
  done
  echo "Blender not found. Install Blender and ensure it is on PATH." >&2
  echo "See MAINTENANCE.md for standard locations." >&2
  exit 1
}

if [[ $# -lt 5 ]]; then
  echo "Usage: blender_render.sh <render_blender.py> <single|multi> <output.png> <width> <height> [model.glb ...]" >&2
  exit 1
fi

script="$1"
mode="$2"
output="$3"
width="$4"
height="$5"
shift 5

if [[ ! -f "$script" ]]; then
  echo "Blender Python script not found: $script" >&2
  exit 1
fi
if [[ "$mode" != "single" && "$mode" != "multi" ]]; then
  echo "Mode must be 'single' or 'multi', got: $mode" >&2
  exit 1
fi
if [[ $# -lt 1 ]]; then
  echo "At least one GLB model is required" >&2
  exit 1
fi

blender=$(find_blender)
mkdir -p "$(dirname "$output")"
exec "$blender" --background --python "$script" -- \
  --mode "$mode" --output "$output" --width "$width" --height "$height" \
  "$@"
