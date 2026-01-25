import { PC, MemoryDevice } from "./pc.ts";
import { Args } from 'args';
import process from 'node:process'
import cli from "./debugger.ts";
import StackDevice from './devices/stack.ts'
import SerialDevice from './devices/serial.ts'
import GraphicsAdapter from "./devices/display/index.js";
const args = new Args();

export interface ImmediateArg {
	v: number
}

export enum RegisterArg {
	A,B,C,D
}

args //@ts-ignore:
	.option('binary', 'the binary to be run by the emulator', 'iram.bin', ['b'])
	.option('load-location', 'the address at which to load the binary', 0x8000, ['l'])
	.option('debugger', 'enable the debugger', false, ['d'])
	.option('input', 'enable interrupts on input', false, ['i']);
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
if (process.stdin.isTTY)
	process.stdin.setRawMode(false);
pc.add_device(new SerialDevice(0x1000, flags.i && !flags.d));
pc.add_device(new MemoryDevice(0, 0x7fff));
pc.add_device(new MemoryDevice(0xb900, 0x10));
pc.add_device(new GraphicsAdapter(0xa000))

const runtime = new Runtime(pc)

for (const file of Deno.readDirSync(import.meta.dirname+'/instructions')) {
	if (file.isDirectory) continue;
	runtime.instructions[file.name.split('.')[0]]
		= (await import(import.meta.dirname+'/instructions/'+file.name)).default;
}

// console.log(runtime.pc.device_structs)
runtime.pc.programPointer = 0x8000
runtime.instructions.end = runtime.instructions.halt

function wait(ms:number) {return new Promise(r=>setTimeout(r,ms))}

let original_pointer: number;
let last = Date.now()
while (!runtime.pc.halted) {
	const opcode = runtime.pc.getMem(runtime.pc.programPointer);
	const instr_id = opcode & 0b0000_0000_0001_1111;
	const instr_name = runtime.pc.instructions[instr_id];
	original_pointer = runtime.pc.programPointer;
	runtime.pc.programPointer++;
	if (!instr_name) {
		console.warn('unknown instr', instr_id, instr_id.toString(16), opcode.toString(2));
		continue;
	}
	const instruction = runtime.instructions[instr_name]!;
	const args: (ImmediateArg | RegisterArg)[] = [];
	if (!instruction) throw `instruction ${instr_name} not found`
	let o = 5
	let mask = 0b111;
	for (let i = 0; i < instruction.args; i++) {
		const argtype = (opcode & (mask << o)) >> o;
		//console.log(argtype, argtype.toString(2))
		if (argtype < 0b100) {
			args.push(argtype as RegisterArg);
		} else {
			args.push({
				v: runtime.pc.getMem(runtime.pc.programPointer)
			} as ImmediateArg);
			runtime.pc.programPointer++;
		}
		o += 3
	}
	//console.log(runtime.pc.programPointer, instr_id, opcode?.toString(2), instr_id.toString(2), args)
	if (!flags.d || await cli(runtime, original_pointer, instruction, instr_name, args, opcode)) {
		instruction.function.call(runtime.pc, args);
		await wait(1)
	}
	if (Date.now() - last >= 500) {
		runtime.pc.interrupt(11, Date.now() - last)
		last = Date.now();
	}
}
