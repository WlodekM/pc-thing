#!/bin/sh
deno -A lang_a.ts $$
pushd ..
cd /home/silly/proojukts/pc-thing/
deno -A assembler.ts the_e_programming_language/code.a
deno -A ramgen.ts
popd
