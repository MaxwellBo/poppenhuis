#!/bin/bash

# Convert all GLB files in public/assets/goldens to USDZ format in public/assets/derived
# Example: public/assets/goldens/jackie_cakes_brat.glb -> public/assets/derived/jackie_cakes_brat.usdz

# Check if public/assets/goldens directory exists
if [[ ! -d "public/assets/goldens" ]]; then
  echo "Directory public/assets/goldens does not exist"
  exit 1
fi

# Create derived directory if it doesn't exist
mkdir -p "public/assets/derived"

# Counter for tracking conversions
converted=0
failed=0

# Process all GLB files in public/assets/goldens
for file in public/assets/goldens/*.glb; do
  # Skip if no GLB files found
  if [[ ! -f "$file" ]]; then
    continue
  fi
  
  # Get filename without extension and path
  filename=$(basename "$file" .glb)
  output_file="public/assets/derived/${filename}.usdz"
  temp_file="temp_${filename}.usdc"
  
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