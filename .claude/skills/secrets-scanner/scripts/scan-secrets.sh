#!/bin/bash
# Secrets Scanner Script
# Scans for potential secrets and credentials in the codebase

set -e

echo "=== SECRETS SCAN ==="
echo ""

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

FINDINGS=0

# Function to scan for pattern
scan_pattern() {
    local name="$1"
    local pattern="$2"
    local exclude="${3:-.env.example}"

    results=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude="$exclude" \
        -E "$pattern" . 2>/dev/null || true)

    if [ -n "$results" ]; then
        echo -e "${RED}[FOUND]${NC} $name"
        echo "$results" | head -5
        echo ""
        FINDINGS=$((FINDINGS + 1))
    fi
}

echo "## Scanning for API Keys..."
scan_pattern "OpenAI API Keys" "sk-[a-zA-Z0-9]{32,}"
scan_pattern "Anthropic Keys" "sk-ant-[a-zA-Z0-9-]{32,}"
scan_pattern "AWS Access Keys" "AKIA[A-Z0-9]{16}"

echo "## Scanning for Credentials..."
scan_pattern "Hardcoded Passwords" "password\s*[:=]\s*['\"][^'\"]{8,}['\"]"
scan_pattern "Hardcoded Secrets" "secret\s*[:=]\s*['\"][^'\"]{8,}['\"]"
scan_pattern "Connection Strings" "(postgres|mysql|mongodb)://[^:]+:[^@]+@"

echo "## Scanning for Private Keys..."
if grep -rn --include="*.ts" --include="*.tsx" --include="*.pem" \
    --exclude-dir=node_modules --exclude-dir=.git \
    "BEGIN.*PRIVATE KEY" . 2>/dev/null; then
    echo -e "${RED}[FOUND]${NC} Private Key"
    FINDINGS=$((FINDINGS + 1))
fi

echo "## Checking .env files..."
for envfile in $(find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*" 2>/dev/null); do
    if [ -f "$envfile" ]; then
        if git ls-files --error-unmatch "$envfile" 2>/dev/null; then
            echo -e "${RED}[CRITICAL]${NC} $envfile is tracked by git!"
            FINDINGS=$((FINDINGS + 1))
        else
            echo -e "${GREEN}[OK]${NC} $envfile is not tracked"
        fi
    fi
done

echo ""
echo "## Checking .gitignore..."
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} .env is in .gitignore"
else
    echo -e "${YELLOW}[WARN]${NC} .env may not be in .gitignore"
fi

echo ""
echo "=== SCAN COMPLETE ==="
if [ $FINDINGS -eq 0 ]; then
    echo -e "${GREEN}No secrets found!${NC}"
    exit 0
else
    echo -e "${RED}Found $FINDINGS potential issues${NC}"
    exit 1
fi
