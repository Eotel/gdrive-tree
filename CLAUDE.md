# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Drive Tree Browser - A SolidJS web application that displays Google Drive files in a tree-like hierarchical structure with keyboard navigation support.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 9000)
npm start
# or
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create a `.env` file with:
```
VITE_CLIENT_ID=your_google_oauth_client_id
```

## Architecture Overview

The application uses **SolidJS** (not React) with a component-based architecture:

### Core Flow
1. `index.html` → `src/index.jsx` → `src/App.jsx` (router setup)
2. Authentication check via Google Identity Services
3. Tree component renders hierarchical file structure

### Key Components
- `src/main/tree/`: Tree rendering logic with recursive node structure
- `src/main/tree/node.js`: Node data model and state management
- `src/globalConstant.js`: Global state store for authentication and root node ID
- `src/main/triggerFilesRequest.js`: Google Drive API integration

### State Management
Uses SolidJS stores for:
- Authentication status (`hasCredential`)
- Root folder ID (`rootId`)
- Node hierarchy and loading states

### API Integration
- Google Drive API v3 for file listing (read-only access)
- OAuth2 authentication flow
- Caching of API responses to minimize requests

## Key Implementation Details

### Tree Navigation
- Arrow keys: Navigate between nodes
- Tab: Jump to next/previous tabbable node
- Enter/Space: Expand/collapse folders
- Implementation in `src/main/tree/index.jsx`

### Node Structure
Each node has:
- `id`: Google Drive file ID
- `name`: File/folder name
- `mimeType`: Determines if folder or file
- `children`: Lazy-loaded for folders
- `_meta`: Loading state and UI properties
- `kind`: For shared drives, set to "drive#teamDrive"

### Shared Drives Support
- New tab "Shared Drives" shows all available shared drives
- Special handling in `getNodesFromDirectory()` for shared drive IDs
- Uses `corpora: 'drive'` and `driveId` parameters for API calls
- Shared drives displayed with special icon

### Build Configuration
- Vite with SolidJS plugin
- TailwindCSS with DaisyUI components
- ESNext build target
- Development port: 9000