deno -A assembler.ts code/bootloader.a
deno -A ramgen.ts
cat iram.bin > bootloader.bin
deno -A assembler.ts code/move-bootloader.a
deno -A ramgen.ts
cat bootloader.bin >> iram.bin