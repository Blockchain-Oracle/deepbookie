#!/usr/bin/env bash
# Publish the @deepbookie stack to npm in dependency order.
# Run it interactively — if your account requires 2FA on writes, npm opens a browser to approve
# (use your fingerprint); you don't have to type a code. Auth comes from the gitignored .npmrc token
# (or your `npm login` session). Optional: pass a 6-digit OTP as arg 1 to skip the browser prompt.
#   bash scripts/publish-npm.sh
#   bash scripts/publish-npm.sh 123456
set -eo pipefail
cd "$(dirname "$0")/.."

OTP="${1:-}"

echo "building packages…"
pnpm --filter "./packages/*" build >/dev/null

# Leaves first (no @deepbookie deps), then core, then the adapters.
for pkg in predict-client node core mcp cli; do
  echo ""
  echo "── publishing @deepbookie/$pkg ──"
  if [ -n "$OTP" ]; then
    pnpm --filter "@deepbookie/$pkg" publish --no-git-checks --access public --otp="$OTP"
  else
    pnpm --filter "@deepbookie/$pkg" publish --no-git-checks --access public
  fi
done

echo ""
echo "✓ all published — verify with:  npx -y @deepbookie/cli@latest tools"
