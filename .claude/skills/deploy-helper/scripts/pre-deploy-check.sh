#!/bin/bash
# Pre-Deploy Check Script
# Validates deployment readiness

set -e

echo "=== PRE-DEPLOY CHECK ==="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

check_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "## Quality Checks"

# TypeScript
echo -n "Running typecheck... "
if pnpm typecheck > /dev/null 2>&1; then
    check_pass "TypeScript compiles"
else
    check_fail "TypeScript errors found"
fi

# ESLint
echo -n "Running lint... "
if pnpm lint > /dev/null 2>&1; then
    check_pass "ESLint passes"
else
    check_fail "ESLint errors found"
fi

# Build
echo -n "Running build... "
if pnpm -C apps/web build > /dev/null 2>&1; then
    check_pass "Build succeeds"
else
    check_fail "Build failed"
fi

echo ""
echo "## Tests"

# Integration tests
echo -n "Checking integration tests... "
if pnpm test:integration > /dev/null 2>&1; then
    check_pass "Integration tests pass"
else
    check_warn "Integration tests failed or not run"
fi

# Mobile tests
echo -n "Checking mobile tests... "
if pnpm -C apps/mobile test > /dev/null 2>&1; then
    check_pass "Mobile tests pass"
else
    check_warn "Mobile tests failed or not run"
fi

echo ""
echo "## Git Status"

# Uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    check_warn "Uncommitted changes present"
else
    check_pass "Working directory clean"
fi

# Branch status
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $BRANCH"

if [ "$BRANCH" != "main" ]; then
    check_warn "Not on main branch"
fi

echo ""
echo "## Migrations"

# Check for pending migrations
MIGRATION_COUNT=$(ls packages/db/drizzle/*.sql 2>/dev/null | wc -l)
echo "Migration files: $MIGRATION_COUNT"

echo ""
echo "## Summary"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Ready to deploy!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Ready with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${RED}✗ Not ready: $ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
