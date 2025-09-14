#!/usr/bin/env bash
set -euo pipefail

# Default to backend
SCOPE="${1:-backend}"
FIX="${2:-}"

ROOT="$(pwd)"
SEARCH_DIR="$ROOT"

echo "====================================="
echo "CLiP BOOsT Import Checker"
echo "====================================="

# Determine directory based on scope
if [[ "$SCOPE" == "backend" ]]; then
  if [[ -d "$ROOT/backend" ]]; then
    SEARCH_DIR="$ROOT/backend"
    echo "✅ Mode: Backend ESM Check (requires .js extensions)"
  else
    echo "❌ Backend directory not found!"
    exit 1
  fi
elif [[ "$SCOPE" == "frontend" ]]; then
  SEARCH_DIR="$ROOT/src"
  echo "✅ Mode: Frontend Check (should NOT have .js extensions)"
else
  echo "⚠️  WARNING: Unknown scope '$SCOPE', defaulting to backend"
  SEARCH_DIR="$ROOT/backend"
  SCOPE="backend"
fi

echo "📂 Scanning: $SEARCH_DIR"
echo ""

# Regex patterns
STATIC='from\s+["'\''](\.{1,2}/[^"'\''?]+?)(?<!\.js|\.json|\.css|\.scss)["'\'']'
DYNAMIC='import\(\s*["'\''](\.{1,2}/[^"'\''?]+?)(?<!\.js|\.json)["'\'']\s*\)'

if [[ "$SCOPE" == "backend" ]]; then
  echo "Checking Backend imports..."
  
  # Find missing .js extensions
  if command -v rg >/dev/null 2>&1; then
    OFFENDERS=$(rg -n -e "$STATIC" -e "$DYNAMIC" "$SEARCH_DIR" \
      --glob '!**/{node_modules,dist,build}/**' \
      --glob '**/*.{ts,js,mjs}' || true)
  else
    OFFENDERS=$(grep -R -n -E "$STATIC|$DYNAMIC" "$SEARCH_DIR" \
      --include='*.ts' --include='*.js' --include='*.mjs' \
      --exclude-dir=node_modules --exclude-dir=dist || true)
  fi
  
  if [[ -n "$OFFENDERS" ]]; then
    echo "⚠️  Backend imports missing .js extension:"
    echo "$OFFENDERS" | sed 's/^/  📍 /'
    
    if [[ "$FIX" == "fix" ]]; then
      echo ""
      echo "🔧 Fix mode enabled - Adding .js extensions..."
      
      fix_backend_file() {
        local file="$1"
        # Use perl for in-place editing
        perl -i -pe '
          s/from\s+["'\''](\.{1,2}\/[^"'\''?]+?)(?<!\.js|\.json|\.css|\.scss)["'\'']/from "$1.js"/g;
          s/import\(\s*["'\''](\.{1,2}\/[^"'\''?]+?)(?<!\.js|\.json)["'\'']\s*\)/import("$1.js")/g
        ' "$file"
      }
      
      find "$SEARCH_DIR" \( -name "*.ts" -o -name "*.js" -o -name "*.mjs" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" | while read -r file; do
        fix_backend_file "$file"
        echo "  ✅ Fixed: $(basename "$file")"
      done
      
      echo ""
      echo "✨ Backend imports fixed!"
    else
      echo ""
      echo "💡 Run with 'fix' argument to auto-fix"
      exit 1
    fi
  else
    echo "✅ All backend imports have correct .js extensions"
  fi
  
elif [[ "$SCOPE" == "frontend" ]]; then
  echo "Checking Frontend imports..."
  
  # Frontend should NOT have .js extensions for TS imports
  BAD_IMPORTS=$(grep -r "from.*\.js['\"]" "$ROOT/src" \
    --include="*.tsx" --include="*.ts" \
    --exclude-dir=node_modules | grep -v "// @ts-ignore" || true)
  
  if [[ -n "$BAD_IMPORTS" ]]; then
    echo "❌ Frontend has incorrect .js extensions:"
    echo "$BAD_IMPORTS" | sed 's/^/  📍 /'
    
    if [[ "$FIX" == "fix" ]]; then
      echo ""
      echo "🔧 Removing .js extensions from Frontend..."
      
      find "$ROOT/src" -name "*.tsx" -o -name "*.ts" | while read -r file; do
        # Remove .js extensions from relative imports
        sed -i.bak -E "s/(from ['\"])([.\/][^'\"]+)\.js(['\"])/\1\2\3/g" "$file"
        rm -f "$file.bak"
      done
      
      echo "✨ Frontend imports fixed!"
    else
      exit 1
    fi
  else
    echo "✅ Frontend imports are correct (no .js extensions)"
  fi
fi

echo ""
echo "✅ Import check complete!"