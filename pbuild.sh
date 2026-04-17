#!/bin/bash

PATH_SHELL=$(cd `dirname $0`; pwd)

set -e

#npm install -g esbuild
esbuild $PATH_SHELL/src/index.js --bundle --minify --format=esm --outfile=$PATH_SHELL/build/bundle.js

$PATH_SHELL/bin/qjs-linux-x86_64 --std -c $PATH_SHELL/build/bundle.js -o $PATH_SHELL/build/dtc --exe $PATH_SHELL/bin/qjs-linux-x86_64
$PATH_SHELL/bin/qjs-linux-x86_64 --std -c $PATH_SHELL/build/bundle.js -o $PATH_SHELL/build/dtc.exe --exe $PATH_SHELL/bin/qjs-windows-x86_64.exe
