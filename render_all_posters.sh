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

# Find all .glb files recursively and process each one
find . -type f -name "*.glb" | while read -r glb_file; do
    # Get the path without the .glb extension
    poster_path="${glb_file%.glb}.jpeg"
    
    echo "Processing: $glb_file -> $poster_path"
    deno run --allow-read --allow-write --allow-run --allow-env --allow-net "$DENO_SCRIPT" "$glb_file" "$poster_path"
done

echo "All GLB files processed"
