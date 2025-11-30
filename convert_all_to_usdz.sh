#!/bin/bash

# Convert all GLB files in public/assets to USDZ format
# This script works with the flattened directory structure where all files are in public/assets
# Example: public/assets/jackie_cakes_brat.glb -> public/assets/jackie_cakes_brat.usdz

# Check if public/assets directory exists
if [[ ! -d "public/assets" ]]; then
  echo "Directory public/assets does not exist"
  exit 1
fi

# Counter for tracking conversions
converted=0
failed=0

# Process all GLB files in public/assets (no subdirectories since it's flattened)
for file in public/assets/*.glb; do
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
      ((converted++))
    else
      echo "Failed to create USDZ for $file"
      ((failed++))
    fi
    # Clean up temp file
    rm -f "$temp_file"
  else
    echo "Failed to convert $file (unsupported format or error)"
    ((failed++))
  fi
done

echo ""
echo "✓ Conversion complete! Converted: $converted, Failed: $failed"