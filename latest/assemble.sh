#!/bin/sh
set -e
# cat $1 | cpp | sed 's/^# .*$//g' > temp.a
deno -A assembler.ts $1 #temp.a
deno -A ramgen.ts

