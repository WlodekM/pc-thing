deno -A assembler.ts $1
deno -A ramgen.ts disk.img
truncate -s 1440K thefile