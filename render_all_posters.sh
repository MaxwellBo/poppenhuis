#!/bin/bash
# render_all_posters.sh

# Exit on any error
set -e

# Check if deno script exists
DENO_SCRIPT="render.ts"
if [ ! -f "$DENO_SCRIPT" ]; then
    echo "Error: $DENO_SCRIPT not found in current directory"
    exit 1
fi

# Process everything
deno run --allow-read --allow-write --allow-run --allow-env --allow-net "$DENO_SCRIPT" .

echo "All processing complete"
