#!/bin/bash
# Repo Inventory Script
# Generates a quick overview of the monorepo structure

set -e

echo "=== REPO INVENTORY ==="
echo ""

echo "## Packages"
for pkg in packages/*/; do
    if [ -f "${pkg}package.json" ]; then
        name=$(grep -m1 '"name"' "${pkg}package.json" | sed 's/.*": "\(.*\)".*/\1/')
        echo "- $name (${pkg})"
    fi
done
echo ""

echo "## Apps"
for app in apps/*/; do
    if [ -f "${app}package.json" ]; then
        name=$(grep -m1 '"name"' "${app}package.json" | sed 's/.*": "\(.*\)".*/\1/')
        echo "- $name (${app})"
    fi
done
echo ""

echo "## API Routes"
if [ -d "apps/web/app/api" ]; then
    find apps/web/app/api -name "route.ts" | while read f; do
        route=$(echo "$f" | sed 's|apps/web/app||' | sed 's|/route.ts||')
        methods=$(grep -oE "export (async function|const) (GET|POST|PUT|DELETE|PATCH)" "$f" 2>/dev/null | grep -oE "(GET|POST|PUT|DELETE|PATCH)" | tr '\n' ',' | sed 's/,$//')
        echo "- $route [$methods]"
    done
fi
echo ""

echo "## Database Tables"
if [ -f "packages/db/src/schema.ts" ]; then
    grep -E "export const \w+ = pgTable" packages/db/src/*.ts 2>/dev/null | sed 's/.*export const \(\w\+\) = pgTable.*/- \1/'
fi
echo ""

echo "## Recent Changes (last 10 commits)"
git log --oneline -10
