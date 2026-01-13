import { PC, MemoryDevice } from "./pc.ts";
import { Args } from 'args';
import process from 'node:process'
import cli from "./debugger.ts";
import StackDevice from './devices/stack.ts'
import SerialDevice from './devices/serial.ts'
const args = new Args();

args //@ts-ignore:
	.option('binary', 'the binary to be run by the emulator', '../iram.bin', ['b'])
	.option('load-location', 'the address at which to load the binary', 0x8000, ['l'])
	.option('debugger', 'enable the debugger', false, ['d']);
//@ts-ignore:
const flags = args.parse(process.argv)
const iram = Deno.readFileSync(flags.b)
// console.log(flags)

export type instruction = {function: (this: PC, argv: number[]) => void, args: number, arg_types: string}

export class Runtime {
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
const iram16 = new Uint16Array(iram.buffer);
//console.log(iram16)
bios_rom.mem.set(iram16, 0)
pc.add_device(bios_rom);
//TODO - actual memory map like in memory_map.md
pc.add_device(new StackDevice(0xb100, 0xb000));
pc.add_device(new SerialDevice(0x1000));
pc.add_device(new MemoryDevice(0, 0x7fff));

const runtime = new Runtime(pc)

for (const file of Deno.readDirSync(import.meta.dirname+'/instructions')) {
	if (file.isDirectory) continue;
	runtime.instructions[file.name.split('.')[0]]
		= (await import(import.meta.dirname+'/instructions/'+file.name)).default;
}

// console.log(runtime)
runtime.pc.programPointer = 0x8000
runtime.instructions.end = runtime.instructions.halt

let original_pointer: number;
while (!runtime.pc.halted) {
	const opcode = runtime.pc.getMem(runtime.pc.programPointer);
	const instr_name = runtime.pc.instructions[opcode];
	original_pointer = runtime.pc.programPointer;
	runtime.pc.programPointer++;
	if (!instr_name) {
		console.warn('unknown instr', opcode, opcode.toString(16));
		continue;
	}
	const instruction = runtime.instructions[instr_name]!;
	const args: number[] = [];
	if (!instruction) throw `instruction ${instr_name} not found`
	for (let i = 0; i < instruction.args; i++) {
		args.push(runtime.pc.getMem(runtime.pc.programPointer));
		runtime.pc.programPointer++;
	}
	if (!flags.d || await cli(runtime, original_pointer, instruction, instr_name, args))
		instruction.function.call(runtime.pc, args)
}
