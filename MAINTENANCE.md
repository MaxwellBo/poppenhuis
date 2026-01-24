# Maintenance Guide

This document describes the maintenance tasks for the Poppenhuis project. These scripts generate derived assets (USDZ files and OG images) from source GLB files, which then need to be referenced in `src/manifest.ts`.

## Maintenance Scripts

### 1. `convert_all_to_usdz.sh`

**Purpose**: Converts all GLB files from `public/assets/goldens/` to USDZ format in `public/assets/derived/`.

**What it does**:
- Scans `public/assets/goldens/` for all `.glb` files
- Converts each GLB file to USDZ format using `usdcat` and `usdzip`
- Outputs files to `public/assets/derived/` with the same base filename but `.usdz` extension
- Example: `public/assets/goldens/jackie_cakes_brat.glb` → `public/assets/derived/jackie_cakes_brat.usdz`

**Requirements**:
- `usdcat` and `usdzip` command-line tools (part of USD tools)

**Usage**:
```bash
bash convert_all_to_usdz.sh
```

**After running**: Update `src/manifest.ts` to add `usdzModel` properties pointing to the new USDZ files for any items that don't already have them.

### 2. `render.ts`

**Purpose**: Generates poster images (OG images) for individual items and user collections using Blender's Python API.

**What it does**:
- **Individual item posters**: Creates a PNG with transparent background for each GLB file at `public/assets/derived/${filename}.png`
  - Example: `public/assets/goldens/jackie_cakes_brat.glb` → `public/assets/derived/jackie_cakes_brat.png`
- **User OG images**: Creates composite OG images showing multiple models in a grid at `public/assets/derived/${user_prefix}_og.png`
  - Example: All items for a user → `public/assets/derived/mbo_og.png`
- **Collection OG images**: Creates composite OG images for collections at `public/assets/derived/${user}_${collection}_og.png`

**Requirements**:
- Node.js (for running TypeScript)
- Blender (must be installed and accessible in PATH or at standard location)
  - macOS: `/Applications/Blender.app/Contents/MacOS/Blender`
  - Linux: `/usr/bin/blender` or in PATH
  - Windows: `C:\Program Files\Blender Foundation\Blender\blender.exe`

**Installing Blender**:
Download and install Blender from [blender.org](https://www.blender.org/download/). The script will automatically detect Blender if it's:
- In your system PATH (as `blender` command), or
- At one of the standard installation locations listed above

**Usage**:
```bash
# Render all posters from manifest
npm run render all

# Test mode: render first item only
npm run render test

# Test mode with custom output path
npm run render test test-render.png
```

The script works directly with items from `src/manifest.ts` - no URL parsing or web server required. It:
1. Reads items from the manifest
2. Loads GLB files directly into Blender
3. Renders them with proper lighting and camera setup
4. Outputs PNG images with transparent backgrounds at 1200x630 (OG image size)

**After running**: Update `src/manifest.ts` to add `og` properties pointing to the new PNG files:
- Individual item `og` properties for each item
- User-level `og` properties for each user
- Collection-level `og` properties for each collection (if applicable)

### 3. `update_ds_store.sh`

**Purpose**: Copies the hidden `.DS_Store` file to a visible `DS_Store` file so Netlify can serve it.

**What it does**:
- Copies `public/assets/goldens/.DS_Store` to `public/assets/goldens/DS_Store`

**Usage**:
```bash
bash update_ds_store.sh
```

**Note**: This script does not produce files that need to be added to `manifest.ts`.

## Maintenance Workflow

When new GLB files are added to `public/assets/goldens/`, follow this process:

1. **Run `convert_all_to_usdz.sh`**
   - This generates USDZ files for all GLB files
   - Check the output for any failures

2. **Run `npm run render all`**
   - This generates individual item poster images
   - This also generates/updates user OG images and collection OG images
   - Note: Blender must be installed and accessible (see requirements above)

3. **Update `src/manifest.ts`**
   - For each new item, add:
     - `usdzModel: "/assets/derived/${filename}.usdz"` (if the item should support AR viewing)
     - `og: "/assets/derived/${filename}.png"` (for social media previews)
   - For new users, add:
     - `og: "/assets/derived/${user_prefix}_og.png"` (for user page previews)
   - For new collections, add:
     - `og: "/assets/derived/${collection_prefix}_og.png"` (if collection OG images are generated)

4. **Verify**
   - Check that all new files are properly referenced in the manifest
   - Test that the files are accessible at their paths
   - Ensure no broken references exist

## File Naming Conventions

- **GLB source files**: `public/assets/goldens/${user}_${collection}_${item}.glb`
- **USDZ derived files**: `public/assets/derived/${user}_${collection}_${item}.usdz`
- **Item poster images**: `public/assets/derived/${user}_${collection}_${item}.png`
- **User OG images**: `public/assets/derived/${user}_og.png`
- **Collection OG images**: `public/assets/derived/${user}_${collection}_og.png`

## Troubleshooting

### `npm run render all` fails with "Blender not found"
If you see an error that Blender is not found:
1. Ensure Blender is installed on your system
2. If Blender is installed but not in PATH, you can:
   - Add Blender to your system PATH, or
   - Create a symlink: `ln -s /Applications/Blender.app/Contents/MacOS/Blender /usr/local/bin/blender` (macOS)
3. Verify Blender is accessible by running `blender --version` in your terminal

### Rendering is slow
The script launches Blender separately for each model, which can be slow but ensures clean renders. Each render typically takes 10-20 seconds due to Blender startup time. This is expected behavior.

### Model file not found errors
If you see "Model file not found" errors:
1. Verify the GLB file exists at the path specified in the manifest
2. Check that the path in `item.model` matches the actual file location
3. Ensure paths use forward slashes and start with `/` (e.g., `/assets/goldens/model.glb`)

### Blender Python script errors
If Blender runs but fails to render:
1. Check that the GLB files are valid and can be opened in Blender manually
2. Verify the Python script `render_blender.py` exists in the project root
3. Check Blender's output for specific error messages

### USDZ conversion fails
- Ensure `usdcat` and `usdzip` are installed and in your PATH
- Check that the GLB files are valid
- Some GLB files may not convert successfully - check the error output

### Missing files in manifest
After running the scripts, check which new files were created:
```bash
# List all USDZ files
ls public/assets/derived/*.usdz

# List all PNG files
ls public/assets/derived/*.png
```

Then verify each file is referenced in `src/manifest.ts` with the appropriate property (`usdzModel` or `og`).
