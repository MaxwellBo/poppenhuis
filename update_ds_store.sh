#!/bin/bash

# Copy the hidden .DS_Store file to the visible DS_Store file
# so that Netlify can serve it (since Netlify doesn't serve hidden files)

cp public/assets/goldens/.DS_Store public/assets/goldens/DS_Store

echo "✓ Copied .DS_Store to DS_Store"
