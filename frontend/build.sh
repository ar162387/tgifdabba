#!/bin/bash

# Build the application
npm run build

# Copy nginx configuration to dist folder
cp nginx.conf dist/

# Ensure _redirects file exists and is correct
echo "/*    /index.html   200" > dist/_redirects

echo "Build completed successfully!"
