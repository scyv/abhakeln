#!/usr/bin/env bash
RELEASE=2.2
INSTALL_TMPDIR=".meteor-install-tmp"
TARBALL_FILE=".meteor-tarball-tmp"
METEOR_RELEASE_FILE="METEOR_RELEASE.txt"
METEOR_INSTALL_DIR=".meteor_install"

set -e
set -u

abs_path () {    
    echo "$(cd $(dirname "$1");pwd)/$(basename "$1")"
}

rm -rf "$TARBALL_FILE"
rm -rf "$INSTALL_TMPDIR"

if [ ! -f $METEOR_RELEASE_FILE ]; then
  echo "-" > ${METEOR_RELEASE_FILE}
fi
lastRelease=$(cat ${METEOR_RELEASE_FILE})
if [ "$lastRelease" != "$RELEASE" ]; then
  if [ -e $METEOR_INSTALL_DIR ]; then
    echo "Removing your existing Meteor installation (${lastRelease})."
    rm -rf $METEOR_INSTALL_DIR
  fi

  UNAME=$(uname)
  if [ "$UNAME" = "Darwin" ] ; then
    PLATFORM="os.osx.x86_64"
  elif [ "$UNAME" = "Linux" ] ; then
    PLATFORM="os.linux.x86_64"
  fi

  TARBALL_URL="https://static-meteor.netdna-ssl.com/packages-bootstrap/${RELEASE}/meteor-bootstrap-${PLATFORM}.tar.gz"

  mkdir "$INSTALL_TMPDIR"

  echo "Downloading Meteor ${RELEASE}..."
  curl --silent "$TARBALL_URL" --output "$TARBALL_FILE"

  echo "Extracting tarball..."
  tar -xzf "$TARBALL_FILE" -C "$INSTALL_TMPDIR" -o
  mv "${INSTALL_TMPDIR}/.meteor" "./${METEOR_INSTALL_DIR}"

  METEOR_SYMLINK_TARGET="$(readlink "$METEOR_INSTALL_DIR/meteor")"
  METEOR_TOOL_DIRECTORY="$(dirname "$METEOR_SYMLINK_TARGET")"
  LAUNCHER="$METEOR_INSTALL_DIR/$METEOR_TOOL_DIRECTORY/scripts/admin/launch-meteor"

  cp "$LAUNCHER" "./meteor"

  echo "${RELEASE}" > ${METEOR_RELEASE_FILE}
  echo "Meteor is installed locally at $(abs_path "$METEOR_INSTALL_DIR")"
  rm -rf "$TARBALL_FILE"
  rm -rf "$INSTALL_TMPDIR"

  export METEOR_WAREHOUSE_DIR="$(abs_path "$METEOR_INSTALL_DIR")"
  echo "run 'export METEOR_WAREHOUSE_DIR="$(abs_path "$METEOR_INSTALL_DIR")"' to make meteor working in this local universe (otherwise, a subsequent run of meteor will install a seperate meteor copy in the ~./meteor dir)"
else
  echo "Meteor ${RELEASE} already installed"
fi
