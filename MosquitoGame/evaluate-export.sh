#!/bin/bash
set -e

# File names
HTML_FILE="dist/index.html"
CSS_FILE="dist/assets/index*.css"

# Expected elements based on the previous conversation
EXPECTED_TITLE="Mosquito Game"

echo "Evaluating the web export..."

# 1. Check if the index.html file exists
if [ -f "$HTML_FILE" ]; then
    echo "✅ index.html found."
else
    echo "❌ index.html NOT found! The export may have failed or output to a different directory."
fi
