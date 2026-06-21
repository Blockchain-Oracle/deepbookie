#!/usr/bin/env bash
# Publish the @deepbookie stack to npm in dependency order.
# Auth comes from the gitignored repo .npmrc (an npm token). If the account enforces 2FA on
# writes, pass a fresh 6-digit OTP as the first arg — all packages publish in one tight batch:
#   bash scripts/publish-npm.sh            # token-only (account 2FA = authorization-only)
#   bash scripts/publish-npm.sh 123456     # token + OTP (account 2FA = auth + writes)
set -euo pipefail
cd "$(dirname "$0")/.."

OTP="${1:-}"
OTP_ARG=()
[ -n "$OTP" ] && OTP_ARG=(--otp="$OTP")

# Build first so dist is current.
pnpm --filter "./packages/*" build >/dev/null

# Leaves first (no @deepbookie deps), then core, then the adapters.
for pkg in predict-client node core mcp cli; do
  echo "── publishing @deepbookie/$pkg ──"
  pnpm --filter "@deepbookie/$pkg" publish --no-git-checks --access public "${OTP_ARG[@]}"
done

echo "✓ all published — verify: npx -y @deepbookie/cli@latest tools"
