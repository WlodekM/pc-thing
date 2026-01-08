#!/bin/sh
set -e
deno -A lang_a.ts $1
pushd ..
cd /home/silly/proojukts/pc-thing/
deno -A assembler.ts the_e_programming_language/code.a
deno -A ramgen.ts $2
popd
