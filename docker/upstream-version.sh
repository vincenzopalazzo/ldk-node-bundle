#!/bin/sh
# Which upstream commit an image is built from, and the version it is published as.
#
#   docker/upstream-version.sh ldk-server     # ldk-server and ldk-server-mcp
#   docker/upstream-version.sh vss-server
#   revision=dbe22c574bd2c7040d82f2c27e480968e15c8a1d
#   version=0.1.0-dbe22c5
#   release=false
#
# The commit is the <NAME>_REV argument in the component's Dockerfile, the only place it is set.
# The version is the one upstream gives that commit:
#   - an upstream release tag pointing at it: the tag without its "v" (v0.2.0 -> 0.2.0,
#     v0.1.0-alpha.0 -> 0.1.0-alpha.0), release=true;
#   - otherwise the crate version and the short commit (0.1.0-dbe22c5), release=false, which is
#     also what `ldk-server --version` prints.
# Written as key=value lines, so CI can append them to $GITHUB_OUTPUT.
set -eu
cd "$(dirname "$0")"

case "${1:-}" in
    ldk-server) repo=lightningdevkit/ldk-server; arg=LDK_SERVER_REV; manifest=ldk-server/Cargo.toml ;;
    vss-server) repo=lightningdevkit/vss-server; arg=VSS_SERVER_REV; manifest=Cargo.toml ;;
    *) echo "usage: $0 ldk-server|vss-server" >&2; exit 2 ;;
esac

rev=$(sed -n "s/^ARG $arg=\([0-9a-f]\{40\}\)\$/\1/p" "$1/Dockerfile")
[ -n "$rev" ] || { echo "$1/Dockerfile has no full-length $arg" >&2; exit 1; }

# Annotated tags list the tagged commit as <tag>^{}.
tag=$(git ls-remote --tags "https://github.com/$repo" \
    | awk -v rev="$rev" '$1 == rev { sub("^refs/tags/", "", $2); sub("\\^\\{\\}$", "", $2); print $2 }' \
    | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' | sort -V | tail -n 1 || true)

if [ -n "$tag" ]; then
    version=${tag#v}
    release=true
else
    crate=$(curl -fsSL "https://raw.githubusercontent.com/$repo/$rev/$manifest" \
        | sed -n 's/^version = "\(.*\)"$/\1/p' | head -n 1)
    [ -n "$crate" ] || { echo "could not read the crate version of $repo at $rev" >&2; exit 1; }
    version="$crate-$(printf '%s' "$rev" | cut -c1-7)"
    release=false
fi

echo "revision=$rev"
echo "version=$version"
echo "release=$release"
