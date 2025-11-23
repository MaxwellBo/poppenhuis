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

# Function to process a collection
process_collection() {
    local collection_dir="$1"
    local poster_path="$collection_dir/og.jpeg"
    local models=()
    
    # Find all .glb files in the collection directory
    while IFS= read -r -d '' glb_file; do
        models+=("$glb_file")
    done < <(\find "$collection_dir" -maxdepth 1 -type f -name "*.glb" -print0)
    
    if [ ${#models[@]} -eq 0 ]; then
        echo "No GLB files found in collection: $collection_dir"
        return
    fi
    
    echo "Processing collection: $collection_dir -> $poster_path"
    echo "Found ${#models[@]} models"
    
    # Build the command with all models
    cmd="deno run --allow-read --allow-write --allow-run --allow-env --allow-net \"$DENO_SCRIPT\" multi \"$poster_path\""
    for model in "${models[@]}"; do
        cmd+=" \"$model\""
    done
    
    eval $cmd
}

# Function to process a user
process_user() {
    local user_dir="$1"
    local poster_path="$user_dir/og.jpeg"
    local models=()
    
    # Find all .glb files in all collection directories
    while IFS= read -r -d '' glb_file; do
        models+=("$glb_file")
    done < <(\find "$user_dir" -type f -name "*.glb" -print0)
    
    if [ ${#models[@]} -eq 0 ]; then
        echo "No GLB files found for user: $user_dir"
        return
    fi
    
    echo "Processing user: $user_dir -> $poster_path"
    echo "Found ${#models[@]} models across all collections"
    
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
        
        # Also update the collection's og.jpeg if needed
        MODEL_DIR=$(dirname "$SPECIFIC_MODEL")
        if [ -n "$(\find "$MODEL_DIR" -maxdepth 1 -type f -name "*.glb")" ]; then
            process_collection "$MODEL_DIR"
        fi
        
        # Also update the user's og.jpeg if needed
        USER_DIR=$(dirname "$(dirname "$MODEL_DIR")")
        if [[ "$USER_DIR" == *"/public/models/"* ]]; then
            process_user "$USER_DIR"
        fi
    else
        echo "Error: Specified model file not found at $SPECIFIC_MODEL"
        exit 1
    fi
else
    # Process all GLB files individually
    \find . -type f -name "*.glb" | while read -r glb_file; do
        process_single_model "$glb_file"
    done
    
    # Process all collections (directories containing GLB files)
    \find . -type d | while read -r dir; do
        if [ -n "$(\find "$dir" -maxdepth 1 -type f -name "*.glb")" ]; then
            process_collection "$dir"
        fi
    done
    
    # Process all user directories
    for user_dir in ./public/models/*/; do
        if [ -d "$user_dir" ]; then
            process_user "$user_dir"
        fi
    done
fi

echo "All processing complete"
