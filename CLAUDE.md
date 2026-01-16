# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poppenhuis is a "digital dollhouse" web application that displays 3D models in collections organized by users. It's built with React, TypeScript, and Next.js (Pages Router). The application allows users to view 3D models (primarily in GLB format) with associated metadata and generates server-side OpenGraph meta tags for social sharing.

## Commands

### Development

- `npm run dev` - Starts the Next.js development server
- `npm run build` - Builds the application for production with Next.js
- `npm run start` - Starts the Next.js production server
- `npm run lint` - Runs ESLint to check for code quality issues

### Testing

- `npm test` - Run tests using Vitest
- `npm test -- --watch` - Run tests in watch mode

## Architecture

### Data Model

The application is structured around three primary data types:

1. **User** - Has collections of items
2. **Collection** - Belongs to a user and contains items
3. **Item** - The 3D models with associated metadata

The data model is defined in `src/manifest.tsx` which provides both the TypeScript interfaces and a large constant `FIRST_PARTY_MANIFEST` that contains the application's data.

### Routing

The application uses Next.js Pages Router for navigation with the following routes:

- `/` - Home page showing all users (pages/index.tsx)
- `/[userId]` - User page showing a user's collections (pages/[userId]/index.tsx)
- `/[userId]/[collectionId]` - Collection page showing items (pages/[userId]/[collectionId]/index.tsx)
- `/[userId]/[collectionId]/[itemId]` - Item page showing a 3D model (pages/[userId]/[collectionId]/[itemId]/index.tsx)
- `/[userId]/[collectionId]/[itemId]/label` - Wall label page for printing
- `/[userId]/[collectionId]/[itemId]/embed` - Embed page for the 3D model
- `/map` - Map page
- `/auth` - Authentication page
- `/debug` - Debug page

Routes are defined in the `pages/` directory. Each page uses Next.js's `getServerSideProps` to fetch data server-side for better SEO and social sharing.

### External Integration

The application can also load models from [Are.na](https://are.na), providing integration with external content. This is handled through the `loadArenaUser` function in the manifest.

## Key Files

- `src/manifest.ts` - Contains the data model and application data
- `pages/*.tsx` - Next.js page components for different routes
- `pages/_app.tsx` - Next.js custom App component for global setup
- `pages/_document.tsx` - Next.js custom Document for HTML structure
- `src/utils.tsx` - Common utilities and shared components
- `src/firebase.ts` - Firebase configuration and integration
- `src/hooks/useNextFirebaseSubmit.ts` - Firebase submission hook for Next.js

## Best Practices

1. When adding new items or collections, follow the existing data structure in `manifest.ts`
2. When modifying UI components, check how they're used across multiple pages
3. Always run linting before submitting changes: `npm run lint`
4. When working with 3D models, only use GLB format as specified in the manifest
5. Run tests when modifying components: `npm test`