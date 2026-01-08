import { PC, MemoryDevice } from "./pc.ts";
import { Args } from 'args';
import process from 'node:process'
const args = new Args();

args //@ts-ignore:
	.option('binary', 'the binary to be run by the emulator', '../iram.bin', ['b'])
	.option('load-location', 'the address at which to load the binary', 0x8000, ['l']);
//@ts-ignore:
const flags = args.parse(process.argv)
const iram = Deno.readFileSync(flags.b)
console.log(flags)

type instruction = {function: (this: PC, argv: number[]) => void, args: number}

class Runtime {
	pc: PC
	constructor(pc?: PC) {
		if (pc)
			this.pc = pc;
		else
			this.pc = new PC();
	}
	instructions: Record<string, instruction> = {}
}

const pc = new PC();
const bios_rom = new MemoryDevice(flags.l, 0xfff);
console.log(flags.l)
bios_rom.mem.set(iram, 0)
pc.add_device(bios_rom);
//TODO - actual memory map like in memory_map.md
pc.add_device(new MemoryDevice(0, 0xffff));

const runtime = new Runtime(pc)

for (const file of Deno.readDirSync(import.meta.dirname+'/instructions')) {
	if (file.isDirectory) continue;
	runtime.instructions[file.name.split('.')[0]]
		= (await import(import.meta.dirname+'/instructions/'+file.name)).default;
}

console.log(runtime)
