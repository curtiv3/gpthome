#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Removing node_modules/..."
rm -rf node_modules

echo "Running pnpm install --frozen-lockfile..."
pnpm install --frozen-lockfile

echo "Validation successful."
