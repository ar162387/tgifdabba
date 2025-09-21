# Render Deployment Guide - SPA Routing Fix

## Problem
When deploying a React SPA (Single Page Application) to Render, direct URL access (e.g., `https://tgifdabba.onrender.com/contact`) or page refreshes on non-home routes result in 404 errors.

## Solution
This repository includes multiple configuration files to handle SPA routing on Render:

### Files Created:
1. **`_redirects`** - Tells Render to serve `index.html` for all routes
2. **`nginx.conf`** - Custom nginx configuration for proper SPA handling
3. **`render.yaml`** - Render deployment configuration
4. **`build.sh`** - Custom build script that ensures all files are included
5. **`App-HashRouter.jsx`** - Alternative using HashRouter (fallback solution)

## Deployment Options

### Option 1: Using render.yaml (Recommended)
1. Use the custom build script: `npm run build:render`
2. Deploy using the `render.yaml` configuration
3. The nginx configuration will handle SPA routing

### Option 2: Using _redirects file
1. Use the regular build: `npm run build`
2. Ensure `_redirects` file is in your build output
3. Deploy the `dist` folder to Render

### Option 3: HashRouter Fallback (If server config fails)
1. Rename `App.jsx` to `App-BrowserRouter.jsx`
2. Rename `App-HashRouter.jsx` to `App.jsx`
3. Deploy normally

## Render Configuration
In your Render dashboard, set:
- **Build Command**: `npm run build:render`
- **Publish Directory**: `dist`
- **Environment**: Static Site

## Testing
After deployment, test these URLs:
- `https://tgifdabba.onrender.com/contact`
- `https://tgifdabba.onrender.com/menu`
- `https://tgifdabba.onrender.com/about`
- `https://tgifdabba.onrender.com/basket`

All should load without 404 errors.
