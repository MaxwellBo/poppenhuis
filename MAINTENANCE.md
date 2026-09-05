# Maintenance Guide

Derived assets (USDZ files and OG images) are produced from source GLBs in
`public/assets/goldens/`. **Bazel owns that graph**: each GLB is its own
conversion target, so only changed models are rebuilt.

The Vite app is unchanged. Netlify still runs `npm run build`. After generating
assets, copy them into `public/assets/derived/` (checked in so deploys stay
static) and reference them from `src/manifest.ts`.

Install [Bazelisk](https://github.com/bazelbuild/bazelisk) (`brew install bazelisk` or
put `bazel` on your PATH). Host tools are still required for the conversions
themselves: **USD** (`usdcat`, `usdzip`) and **Blender**.

## Commands

| Task | Bazel | Fallback (no Bazel) |
| --- | --- | --- |
| GLB → USDZ (incremental) | `bazel run //public/assets:install_usdz` | `bash convert_all_to_usdz.sh` |
| Item poster PNGs | `bazel run //public/assets:install_posters` | `npm run render all` |
| User OG grids | `bazel run //public/assets:install_user_ogs` | `npm run render users` |
| Collection OG grids | `bazel run //public/assets:install_collection_ogs` | `npm run render collections` |
| All derived assets | `bazel run //:derived` | USDZ script + `npm run render all` |
| Visible `DS_Store` | `bazel run //:ds_store` | `bash update_ds_store.sh` |
| PS2 icon → GLB | `bazel run //:ps2_icon -- --batch <dir>` | `npm run ps2-icon -- --batch <dir>` |
| Repair PS2 GLBs | `bazel run //tools:repair_ps2_icons` | `python3 scripts/repair-ps2-icon-glbs.py` |
| Refresh OG groups | `bazel run //tools:emit_og_groups` | `python3 tools/emit_og_groups.py` |
| Run pipeline tests | `bazel test //tools/...` | — |

`install_*` targets build into `bazel-bin/` then copy results into
`public/assets/derived/` (or `public/assets/goldens/DS_Store`). Commit those
files afterwards.

USDZ and Blender targets are tagged `manual`, so `bazel build //...` does not
require those tools. Ask for them by name (`bazel build //public/assets:usdz`).

## How the graph is wired

- **1:1 conversions** (`foo.glb` → `foo.usdz` / `foo.png`) glob every file in
  `public/assets/goldens/`.
- **User / collection OG grids** cannot be inferred from filenames
  (`ps2_save-icons_*.glb` belongs to user `mbo`; `max2_friends_zoe.glb` is in
  `mbo/friends`). `tools/emit_og_groups.py` reads `src/manifest.ts` and
  `src/ps2-archive.ts` and writes `tools/og_groups.bzl`. `bazel test //tools:emit_og_groups_test`
  fails if that file is stale.

Rules live in `tools/usdz.bzl` and `tools/poster.bzl`; the expansion macro is
`tools/assets.bzl`. Wrappers `tools/usdconvert.sh` and `tools/blender_render.sh`
locate host binaries the same way the old scripts did.

## After generating files

Update `src/manifest.ts` for any new item/user/collection:

- `usdzModel: "/assets/derived/${filename}.usdz"`
- `og: "/assets/derived/${filename}.png"`
- user `og: "/assets/derived/${user}_og.png"`
- collection `og: "/assets/derived/${user}_${collection}_og.png"`

If you changed the first-party manifest structure, regenerate OG groups:

```bash
bazel run //tools:emit_og_groups
```

## File naming

- **GLB source files**: `public/assets/goldens/${user}_${collection}_${item}.glb`
- **USDZ derived files**: `public/assets/derived/${user}_${collection}_${item}.usdz`
- **Item poster images**: `public/assets/derived/${user}_${collection}_${item}.png`
- **User OG images**: `public/assets/derived/${user}_og.png`
- **Collection OG images**: `public/assets/derived/${user}_${collection}_og.png`

Filenames are a convention for *items*. User/collection membership always comes
from the manifest.

## Troubleshooting

### `bazel run //public/assets:install_usdz` fails with usdcat not found
Install USD command-line tools so `usdcat` and `usdzip` are on `PATH`.

### `bazel run //public/assets:install_posters` fails with Blender not found
Install Blender from [blender.org](https://www.blender.org/download/). The wrapper
looks for `blender` on `PATH`, then:

- macOS: `/Applications/Blender.app/Contents/MacOS/Blender`
- Linux: `/usr/bin/blender`
- Windows: `C:\Program Files\Blender Foundation\Blender\blender.exe`

### Rendering is slow
Each poster is a separate Bazel action (one Blender process). Unchanged GLBs
are skipped on the next run.

### Model file not found
Paths in `src/manifest.ts` (`item.model`) must match files under
`public/assets/goldens/`. After editing the manifest, regenerate
`tools/og_groups.bzl`.

### `tools/og_groups.bzl is stale`
```bash
bazel run //tools:emit_og_groups
```

### Site / tests (not Bazel)
```bash
npm install
npm run dev
npm run build    # what Netlify runs
npm test
npm run lint
```

Convenience wrappers: `bazel run //:dev`, `bazel run //:site`, `bazel run //:lint`,
`bazel run //tools:vitest` (they `cd` to the workspace and call npm; they still
need `node_modules`).
