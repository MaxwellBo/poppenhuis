#!/bin/bash

# Exit on any error
set -e

# Check if deno script exists
DENO_SCRIPT="render.ts"
if [ ! -f "$DENO_SCRIPT" ]; then
    echo "Error: $DENO_SCRIPT not found in current directory"
    exit 1
fi

# Check if specific model argument is provided
SPECIFIC_MODEL=""
if [ "$1" = "--model" ] && [ -n "$2" ]; then
    SPECIFIC_MODEL="$2"
    echo "Will only process model: $SPECIFIC_MODEL"
fi

# Function to process a single model
process_single_model() {
    local glb_file="$1"
    local poster_path="${glb_file%.glb}.jpeg"
    
    echo "Processing single model: $glb_file -> $poster_path"
    deno run --allow-read --allow-write --allow-run --allow-env --allow-net "$DENO_SCRIPT" single "$glb_file" "$poster_path"
}

# Function to process all models by user (extract user prefix from filename)
process_by_user() {
    local user_prefix="$1"  # e.g., "mbo", "jackie", "leaonie"
    local poster_path="public/assets/${user_prefix}_og.jpeg"
    local models=()
    
    # Find all .glb files matching the user prefix
    while IFS= read -r -d '' glb_file; do
        models+=("$glb_file")
    done < <(find public/assets -maxdepth 1 -type f -name "${user_prefix}_*.glb" -print0)
    
    if [ ${#models[@]} -eq 0 ]; then
        echo "No GLB files found for user: $user_prefix"
        return
    fi
    
    echo "Processing user: $user_prefix -> $poster_path"
    echo "Found ${#models[@]} models"
    
    # Build the command with all models
    cmd="deno run --allow-read --allow-write --allow-run --allow-env --allow-net \"$DENO_SCRIPT\" multi \"$poster_path\""
    for model in "${models[@]}"; do
        cmd+=" \"$model\""
    done
    
    eval $cmd
}

# Check if we're processing a specific model or everything
if [ -n "$SPECIFIC_MODEL" ]; then
    # Process just the specific model
    if [ -f "$SPECIFIC_MODEL" ]; then
        process_single_model "$SPECIFIC_MODEL"
        
        # Also update the user's og.jpeg based on the model filename
        # Extract user prefix from filename (e.g., "jackie_cakes_brat.glb" -> "jackie")
        filename=$(basename "$SPECIFIC_MODEL")
        user_prefix="${filename%%_*}"
        
        if [ -n "$user_prefix" ]; then
            process_by_user "$user_prefix"
        fi
    else
        echo "Error: Specified model file not found at $SPECIFIC_MODEL"
        exit 1
    fi
else
    # Process all GLB files individually
    find public/assets -maxdepth 1 -type f -name "*.glb" | while read -r glb_file; do
        process_single_model "$glb_file"
    done
    
    # Process all user directories (by extracting unique user prefixes)
    for user_prefix in mbo jackie leaonie joey; do
        if [ -n "$(find public/assets -maxdepth 1 -type f -name "${user_prefix}_*.glb")" ]; then
            process_by_user "$user_prefix"
        fi
    done
fi

echo "All processing complete"
