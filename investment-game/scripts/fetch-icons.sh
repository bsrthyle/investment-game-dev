#!/usr/bin/env bash
# Download a curated set of professionally-drawn SVG icons from the Iconify API.
# Source: Fluent Emoji Flat (Microsoft, MIT license).
# Output: public/icons/game/*.svg — committed to the repo, no runtime network.

set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/icons/game"
mkdir -p "$OUT_DIR"

# format: local_name|iconify_id|semantic_role
ICONS=(
  "coin|fluent-emoji-flat:coin|Gold coin for token display"
  "plant|fluent-emoji-flat:seedling|Plant button / seedling motif"
)

echo "→ Fetching ${#ICONS[@]} icons from Iconify…"

failures=0
for entry in "${ICONS[@]}"; do
  IFS='|' read -r name id role <<< "$entry"
  url="https://api.iconify.design/${id}.svg"
  out="$OUT_DIR/$name.svg"
  # Fetch; Iconify returns 200 with tiny body for unknown icons — check size too.
  if curl -sSf "$url" -o "$out" && [ -s "$out" ] && head -c 20 "$out" | grep -q "<svg"; then
    printf "  ✓ %-22s  %s\n" "$name.svg" "$role"
  else
    printf "  ✗ %-22s  FAILED (%s)\n" "$name.svg" "$id"
    rm -f "$out"
    failures=$((failures + 1))
  fi
done

if [ "$failures" -gt 0 ]; then
  echo
  echo "⚠️  $failures icon(s) failed. Fix their Iconify IDs in this script."
  exit 1
fi

cat > "$OUT_DIR/MANIFEST.json" <<EOF
{
  "source": "Iconify — Fluent Emoji Flat (MIT license)",
  "project": "https://github.com/microsoft/fluentui-emoji",
  "license": "MIT",
  "fetched_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "icons": [
$(for entry in "${ICONS[@]}"; do
  IFS='|' read -r name id role <<< "$entry"
  printf '    { "name": "%s", "id": "%s", "role": "%s" },\n' "$name" "$id" "$role"
done | sed '$ s/,$//')
  ]
}
EOF

echo "✓ Done. $OUT_DIR"
ls -la "$OUT_DIR"
