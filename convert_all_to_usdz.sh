#!/bin/bash

# Convert all GLB files in public/models to USDZ format (recursive)
# Existing USDZ files will be replaced

# Check if public/models directory exists
if [[ ! -d "public/models" ]]; then
  echo "Directory public/models does not exist"
  exit 1
fi

# Function to convert GLB files in a directory
convert_glb_files() {
  local current_dir="$1"
  
  # Process GLB files in current directory
  for file in "$current_dir"/*.glb; do
    # Skip if no GLB files found
    if [[ ! -f "$file" ]]; then
      continue
    fi
    
    # Get filename without extension
    basename="${file%.*}"
    output_file="${basename}.usdz"
    temp_file="temp_$(basename "$basename").usdc"
    
    # Convert to USDC then zip to USDZ
    if usdcat "$file" -o "$temp_file" 2>/dev/null; then
      if usdzip "$output_file" "$temp_file" 2>/dev/null; then
        echo "Successfully converted $file to $output_file"
      else
        echo "Failed to create USDZ for $file"
      fi
      # Clean up temp file
      rm -f "$temp_file"
    else
      echo "Failed to convert $file (unsupported format or error)"
    fi
  done
}

# Use find to recursively process all directories
find public/models -type d | while read -r dir; do
  if ls "$dir"/*.glb 1> /dev/null 2>&1; then
    echo "Processing directory: $dir"
    convert_glb_files "$dir"
  fi
done

echo "Conversion complete!"