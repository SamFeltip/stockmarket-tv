#!/usr/bin/env bash
# Compatibility entry point; the dependency-free Node installer also runs on Windows.
set -euo pipefail
tv_project="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$tv_project/scripts/install-tv.mjs" "$@"
