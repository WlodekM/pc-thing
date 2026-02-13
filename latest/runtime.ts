import { PC, MemoryDevice } from "./pc.ts";
import { Args } from 'args';
import process from 'node:process'
import cli, { print_inst } from "./debugger.ts";
import StackDevice from './devices/stack.ts'
import SerialDevice from './devices/serial.ts'
const args = new Args();

export interface ImmediateArg {
	v: number
}

export enum RegisterArg {
	A,B,C,D
}

args //@ts-ignore:
	.option('binary', 'the binary to be run by the emulator', 'iram.bin')
	.option('load-location', 'the address at which to load the binary', 0x8000)
	.option('debugger', 'enable the debugger', false)
	.option('input', 'enable interrupts on input', false)
	.option('print-instruction', 'print instruction', false)
	.option('graphics', 'okay, JAMER', false);
//@ts-ignore:
const flags = args.parse(process.argv)
const iram = Deno.readFileSync(flags.b)

export type instruction = {function: (this: PC, argv: (ImmediateArg | RegisterArg)[]) => void, args: number, arg_types: string}

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
if (flags.g) {
	const GraphicsAdapter = (await import("./devices/display/index.js")).default;
	pc.add_device(new GraphicsAdapter(0xa000))
}

const runtime = new Runtime(pc)

for (const file of Deno.readDirSync(import.meta.dirname+'/instructions')) {
	if (file.isDirectory) continue;
	runtime.instructions[file.name.split('.')[0]]
		= (await import(import.meta.dirname+'/instructions/'+file.name)).default;
}

// console.log(runtime.pc.device_structs)
runtime.pc.programPointer = 0x8000
runtime.instructions.end = runtime.instructions.halt

let resolver:(...a:any[])=>void=()=>{};
function wait(ms:number) {
	return new Promise(r=>{
		resolver=r
		setTimeout(r,ms)
	})
}

let original_pointer: number;
let last = Date.now();
let repeating = 0;
const default_clock_delay = 1;
let clock_delay = default_clock_delay;
let last_pp = -1;
pc.ih = (i,b,c,d,v) => {
	if (i == 11) return;
	//console.log(i,b,c,d,v)
	if (!v) return;
	repeating = 0;
	clock_delay = default_clock_delay;
	resolver()
}
async function run_inst() {
	const opcode = runtime.pc.getMem(runtime.pc.programPointer);
	const instr_id = opcode & 0b0000_0000_0001_1111;
	const instr_name = runtime.pc.instructions[instr_id];
	original_pointer = runtime.pc.programPointer;
	runtime.pc.programPointer++;
	if (!instr_name) {
		console.warn('unknown instr', instr_id, instr_id.toString(16), opcode.toString(2));
		return;
	}
	const instruction = runtime.instructions[instr_name]!;
	const args: (ImmediateArg | RegisterArg)[] = [];
	if (!instruction) throw `instruction ${instr_name} not found`
	let o = 5
	let mask = 0b111;
	for (let i = 0; i < instruction.args; i++) {
		const argtype = (opcode & (mask << o)) >> o;
		//console.log(argtype, argtype.toString(2))
		if (argtype != 0b100) {
			args.push(argtype - +(argtype > 0b100) as RegisterArg);
		} else {
			args.push({
				v: runtime.pc.getMem(runtime.pc.programPointer)
			} as ImmediateArg);
			runtime.pc.programPointer++;
		}
		o += 3
	}
	//console.log(runtime.pc.programPointer, instr_id, opcode?.toString(2), instr_id.toString(2), args)
	if (flags.p && !flags.d)
		print_inst(original_pointer, instruction, instr_name, args)
	if (!flags.d || await cli(runtime, original_pointer, instruction, instr_name, args, opcode)) {
		instruction.function.call(runtime.pc, args);
	}
	if (last_pp == pc.programPointer) {
		repeating++;
		clock_delay = Math.min(500, default_clock_delay * repeating**2);
	}
	last_pp = pc.programPointer
}
while (!runtime.pc.halted) {
	await run_inst()
	await run_inst()
	await run_inst()
	await wait(clock_delay)
	if (Date.now() - last >= 100) {
		runtime.pc.interrupt(11, Date.now() - last)
		last = Date.now();
	}
}
//process.stdout.flush()
await wait(100);
const ram = new Uint16Array(0xFFFF)
for (let i = 0; i < 0xFFFF; i++) {
	ram[i] = pc.getMem(i)
}
Deno.writeFileSync('ram.bin', new Uint8Array(ram.buffer))
