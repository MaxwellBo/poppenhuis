# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poppenhuis is a "digital dollhouse" web application that displays 3D models in collections organized by users. It's built with React, TypeScript, and Vite, and uses the React Router library for navigation. The application allows users to view 3D models (primarily in GLB format) with associated metadata.

## Commands

### Development

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production (runs TypeScript compiler + Vite build)
- `npm run lint` - Runs ESLint to check for code quality issues
- `npm run preview` - Previews the production build locally

### Testing

- `npm test` - Run tests using Vitest
- `npm test -- --watch` - Run tests in watch mode
- `npm test src/routes/ItemPage.test.tsx` - Run tests for a specific file

## Architecture

### Data Model

The application is structured around three primary data types:

1. **User** - Has collections of items
2. **Collection** - Belongs to a user and contains items
3. **Item** - The 3D models with associated metadata

The data model is defined in `src/manifest.tsx` which provides both the TypeScript interfaces and a large constant `FIRST_PARTY_MANIFEST` that contains the application's data.

### Routing

The application uses React Router for navigation with the following routes:

- `/` - Home page showing all users (UsersPage)
- `/:userId` - User page showing a user's collections (UserPage)
- `/:userId/:collectionId` - Collection page showing items (CollectionPage)
- `/:userId/:collectionId/:itemId` - Item page showing a 3D model (ItemPage)
- `/:userId/:collectionId/:itemId/label` - Wall label page for printing (WallLabelPage)

Routes are defined in `src/main.tsx` and each route component has a corresponding loader function to fetch the necessary data.

### External Integration

The application can also load models from [Are.na](https://are.na), providing integration with external content. This is handled through the `loadArenaUser` function in the manifest.

## Key Files

- `src/manifest.ts` - Contains the data model and application data
- `src/main.tsx` - Entry point, sets up routing
- `src/routes/*.tsx` - Route components for different pages
- `src/utils.tsx` - Common utilities and shared components

## Best Practices

1. When adding new items or collections, follow the existing data structure in `manifest.ts`
2. When modifying UI components, check how they're used across multiple pages
3. Always run linting before submitting changes: `npm run lint`
4. When working with 3D models, only use GLB format as specified in the manifest
5. Run tests when modifying components: `npm test`