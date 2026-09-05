#!/usr/bin/env bash
# Convert one GLB to USDZ via usdcat + usdzip.
set -euo pipefail

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required tool '$1' not found on PATH (install USD tools)." >&2
    exit 1
  fi
}

if [[ $# -ne 2 ]]; then
  echo "Usage: usdconvert.sh <input.glb> <output.usdz>" >&2
  exit 1
fi

src="$1"
out="$2"

if [[ ! -f "$src" ]]; then
  echo "Input GLB not found: $src" >&2
  exit 1
fi

need usdcat
need usdzip

mkdir -p "$(dirname "$out")"
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
usdc="$tmpdir/$(basename "${src%.glb}").usdc"
usdcat "$src" -o "$usdc"
usdzip "$out" "$usdc"
