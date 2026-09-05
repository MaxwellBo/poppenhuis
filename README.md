# poppenhuis

[![Netlify Status](https://api.netlify.com/api/v1/badges/aafedefd-013e-4588-b415-1ad1c86831b1/deploy-status)](https://app.netlify.com/sites/poppenhuis/deploys)

a digital dollhouse - [poppenhu.is](https://poppenhu.is/).

## Development

```bash
npm install
npm run dev
```

Production site build (also what Netlify runs):

```bash
npm run build
```

## Asset pipeline (Bazel)

GLB → USDZ / poster / OG-image conversions are a Bazel graph so each model
rebuilds independently. See [MAINTENANCE.md](MAINTENANCE.md).

```bash
bazel test //tools/...
bazel run //:derived          # USDZ + posters + OG grids → public/assets/derived/
bazel run //:ds_store         # copy goldens/.DS_Store → goldens/DS_Store
```
