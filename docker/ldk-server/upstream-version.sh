#!/bin/sh
# Which upstream ldk-server the images are built from, and the version they are published as.
#
#   docker/ldk-server/upstream-version.sh
#   revision=dbe22c574bd2c7040d82f2c27e480968e15c8a1d
#   version=0.1.0-dbe22c5
#   release=false
#
# The commit is LDK_SERVER_REV in the Dockerfile, the only place it is set. The version is the
# one the binary itself reports (`ldk-server --version`: crate version and commit):
#   - an upstream release tag pointing at that commit: its version (v0.2.0 -> 0.2.0), release=true;
#   - otherwise the crate version and the short commit (0.1.0-dbe22c5), release=false.
# Written as key=value lines, so CI can append them to $GITHUB_OUTPUT.
set -eu
cd "$(dirname "$0")"

repo=https://github.com/lightningdevkit/ldk-server
rev=$(sed -n 's/^ARG LDK_SERVER_REV=\([0-9a-f]\{40\}\)$/\1/p' Dockerfile)
[ -n "$rev" ] || { echo "Dockerfile has no full-length LDK_SERVER_REV" >&2; exit 1; }

# Annotated tags list the tagged commit as <tag>^{}.
tag=$(git ls-remote --tags "$repo" \
    | awk -v rev="$rev" '$1 == rev { sub("^refs/tags/", "", $2); sub("\\^\\{\\}$", "", $2); print $2 }' \
    | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1 || true)

if [ -n "$tag" ]; then
    version=${tag#v}
    release=true
else
    crate=$(curl -fsSL "https://raw.githubusercontent.com/lightningdevkit/ldk-server/$rev/ldk-server/Cargo.toml" \
        | sed -n 's/^version = "\(.*\)"$/\1/p' | head -n 1)
    [ -n "$crate" ] || { echo "could not read the ldk-server crate version at $rev" >&2; exit 1; }
    version="$crate-$(printf '%s' "$rev" | cut -c1-7)"
    release=false
fi

echo "revision=$rev"
echo "version=$version"
echo "release=$release"
