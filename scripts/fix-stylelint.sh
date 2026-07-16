#!/bin/bash
# Fix stylelint-taro-rn compatibility: stylelint@15 has .js but taro-rn requires .cjs
# This script creates .cjs shims for stylelint utils that only exist as .js in stylelint@15

set -e

echo "🔧 Running postinstall: fixing stylelint compatibility..."

# Find all stylelint installations in pnpm store
find node_modules/.pnpm -path "*/stylelint@15*/node_modules/stylelint/lib/utils/declarationValueIndex.js" 2>/dev/null | while read -r js_file; do
  cjs_file="${js_file%.js}.cjs"
  if [ ! -f "$cjs_file" ]; then
    cp "$js_file" "$cjs_file"
    echo "  ✅ Created $(basename "$cjs_file") in $(dirname "$cjs_file" | grep -o 'stylelint@[^/]*')"
  fi
done

echo "🔧 Postinstall fix complete."
