#!/usr/bin/env bash
set -euo pipefail

PKG='@biomejs/biome'

expected=$(jq -r --arg pkg "$PKG" '.devDependencies[$pkg] // empty' package.json)

if [[ -z "$expected" ]]; then
  echo "error: $PKG not found in root package.json" >&2
  exit 1
fi

expected_clean="${expected#[\^~]}"
mismatch_paths=()
mismatch_versions=()

while IFS= read -r -d '' file; do
  [[ "$file" == "./package.json" ]] && continue

  version=$(jq -r --arg pkg "$PKG" '.devDependencies[$pkg] // empty' "$file")

  [[ -z "$version" ]] && continue

  if [[ "$version" != "$expected" ]]; then
    mismatch_paths+=("$file")
    mismatch_versions+=("$version")
  fi
done < <(find . -type d -name node_modules -prune -o -type f -name package.json -print0)

schema=$(jq -r '."$schema" // empty' biome.json)

if [[ "$schema" =~ /schemas/([^/]+)/schema\.json ]]; then
  biome_json_version="${BASH_REMATCH[1]}"
  if [[ "$biome_json_version" != "$expected_clean" ]]; then
    mismatch_paths+=("./biome.json")
    mismatch_versions+=("$biome_json_version")
  fi
else
  echo "error: could not read version from biome.json \$schema" >&2
  exit 1
fi

if (( ${#mismatch_paths[@]} > 0 )); then
  echo "Biome version mismatch (expected: $expected)" >&2
  for i in "${!mismatch_paths[@]}"; do
    echo "  ${mismatch_paths[$i]}: found ${mismatch_versions[$i]}" >&2
  done
  exit 1
fi

echo "All Biome versions match ($expected)"