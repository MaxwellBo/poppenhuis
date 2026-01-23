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

### 2. `render_poster.sh`

**Purpose**: Generates poster images (OG images) for individual items and user collections using the `render.ts` Deno script.

**What it does**:
- **Individual item posters**: Creates a JPEG for each GLB file at `public/assets/derived/${filename}.jpeg`
  - Example: `public/assets/goldens/jackie_cakes_brat.glb` → `public/assets/derived/jackie_cakes_brat.jpeg`
- **User OG images**: Creates composite OG images showing multiple models in a grid at `public/assets/derived/${user_prefix}_og.jpeg`
  - Example: All `mbo_*.glb` files → `public/assets/derived/mbo_og.jpeg`
  - Example: All `jackie_*.glb` files → `public/assets/derived/jackie_og.jpeg`

**Requirements**:
- Deno runtime (tested with Deno 2.5.6)
- Puppeteer browser binary (see installation instructions below)
- Network access (for downloading dependencies and running local server)

**Installing Puppeteer Browser**:
The script requires a Chrome/Chromium browser for Puppeteer. To install it:

```bash
# For Deno 2.x (current)
PUPPETEER_PRODUCT=chrome deno run -A https://deno.land/x/puppeteer@16.2.0/install.ts

# If that fails, try with a newer Puppeteer version or check Deno compatibility
```

Note: The browser binary will be downloaded to `~/.deno/puppeteer/` on first use if not already installed.

**Usage**:
```bash
# Process all models
bash render_poster.sh

# Process a specific model (also updates user OG image)
bash render_poster.sh --model public/assets/goldens/jackie_cakes_brat.glb
```

**After running**: Update `src/manifest.ts` to add `og` properties pointing to the new JPEG files:
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

2. **Run `render_poster.sh`**
   - This generates individual item poster images
   - This also generates/updates user OG images
   - Note: If Puppeteer browser is not installed, you may need to install it first (see requirements above)

3. **Update `src/manifest.ts`**
   - For each new item, add:
     - `usdzModel: "/assets/derived/${filename}.usdz"` (if the item should support AR viewing)
     - `og: "/assets/derived/${filename}.jpeg"` (for social media previews)
   - For new users, add:
     - `og: "/assets/derived/${user_prefix}_og.jpeg"` (for user page previews)
   - For new collections, add:
     - `og: "/assets/derived/${collection_prefix}_og.jpeg"` (if collection OG images are generated)

4. **Verify**
   - Check that all new files are properly referenced in the manifest
   - Test that the files are accessible at their paths
   - Ensure no broken references exist

## File Naming Conventions

- **GLB source files**: `public/assets/goldens/${user}_${collection}_${item}.glb`
- **USDZ derived files**: `public/assets/derived/${user}_${collection}_${item}.usdz`
- **Item poster images**: `public/assets/derived/${user}_${collection}_${item}.jpeg`
- **User OG images**: `public/assets/derived/${user}_og.jpeg`
- **Collection OG images**: `public/assets/derived/${user}_${collection}_og.jpeg`

## Troubleshooting

### `render_poster.sh` fails with browser error
If you see an error about missing browser revision, install the Puppeteer browser:
```bash
# For Deno 2.x
PUPPETEER_PRODUCT=chrome deno run -A https://deno.land/x/puppeteer@16.2.0/install.ts
```

If the install script fails with `Deno.writeAll is not a function`, this is a Deno 2.x compatibility issue. The browser may still work - try running the render script anyway. If it still fails, you may need to:
1. Use an older Deno version (1.x), or
2. Wait for a Puppeteer update that supports Deno 2.x, or
3. Manually download and place the Chrome binary in `~/.deno/puppeteer/`

### Script doesn't terminate properly
The render script has been updated to properly shut down the server after rendering. If you still see the script hanging:
1. Check that all browser processes are closed
2. Check that the server on port 8000 is not still running
3. The script should now cleanly exit after each render completes

### USDZ conversion fails
- Ensure `usdcat` and `usdzip` are installed and in your PATH
- Check that the GLB files are valid
- Some GLB files may not convert successfully - check the error output

### Missing files in manifest
After running the scripts, check which new files were created:
```bash
# List all USDZ files
ls public/assets/derived/*.usdz

# List all JPEG files
ls public/assets/derived/*.jpeg
```

Then verify each file is referenced in `src/manifest.ts` with the appropriate property (`usdzModel` or `og`).
