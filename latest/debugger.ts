import { type instruction, type Runtime } from "./runtime.ts";

function inspect(runtime: Runtime) {
	console.log('IO status:')


	console.log(Object.entries(runtime.pc)
		.filter(([, value]) => (typeof value) == 'boolean')
		.map(([name, io]) => {
			// if (io instanceof Pin) {
			return ` ${name}: ${' '.repeat(20 - name.length)}${io ? "TRUE" : "FALSE"}`
			// } else if (io instanceof BitField) {
			//     return ` ${name}: ${' '.repeat(20 - name.length)}${io.bits.map(k=>+k).join('')} (0x${io.num().toString(16)})`
			// }
		}).join('\n'));

	console.log('\nregisters:')
	const [...letters] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	for (let i = 0; i < runtime.pc.registers.length; i++) {
		const value = runtime.pc.registers[i];
		const letter = letters[i] ?? i.toString(16)
		if (typeof value != 'number') {
			if (typeof value == 'undefined') continue;
			console.log(` ${letter}:\t${value}`)
			continue;
		}
		console.log(` ${letter}:\t${value.toString(2).split('').map(k => +k).reverse().join('')} (0x${value.toString(16)})`)
	}
	console.log(` PC:\t${runtime.pc.programPointer.toString(2).split('').map(k => +k).reverse().join('')} (0x${runtime.pc.programPointer.toString(16)}) [0x${(runtime.pc.programPointer * 2).toString(16)}]`)

}

let instBreakpoints: string[] = [];
let breakpoints: number[] = []
let skip = 0
let skip_print = 0
//let cont_print = false
export default async function cli(runtime: Runtime, original_pointer: number, instruction: instruction, instr_name: string, args: number[], opcode: number): Promise<boolean> {
	if (instBreakpoints.includes(instr_name)) {
		instBreakpoints = instBreakpoints.filter(k => k != instr_name)
		skip = 0;skip_print = 0;
		console.log('hit instruction breakpoint on', runtime.pc.programPointer.toString(16))
	}
	if (breakpoints.includes(original_pointer)) {
		breakpoints = breakpoints.filter(k => k != original_pointer)
		skip = 0;skip_print = 0;
		console.log('hit breakpoint on', original_pointer.toString(16))
	}
	if (skip != 0) {
		skip--
		return true
	}
	let decomp: string = instr_name
	for (let j = 0; j < instruction.args; j++) {
		const arg_value = args[j];
		const arg_type = instruction.arg_types[j]!;
		const arg_string = (({
			r: b => String.fromCharCode(b)
		} as Record<string,(uh:number)=>string>)
			[arg_type] ?? (a=>a))(arg_value);
		decomp += ` ${arg_string}`
	}
	console.log(`${original_pointer.toString(16).padStart(4, '0')}\t${instr_name}\t${args
	.map(a => typeof a === 'number' ? 'abcd'[a] : a.v)
	.join('\t')}`)
	if (skip_print != 0) {
		skip_print--
		return true
	}
	dbgl:
	while (true) {
		const i = new Uint8Array(16);
		Deno.stdout.write(Uint8Array.from(['.'.charCodeAt(0)]))
		await Deno.stdin.read(i);
		if (i[0] == 'b'.charCodeAt(0)) {
			console.log('BREAK!!')
			runtime.pc.halted = true
			return false
		} else if (i[0] == 'S'.charCodeAt(0)) {
			return false
		} else if (i[0] == 'i'.charCodeAt(0)) {
			inspect(runtime)
			continue;
		} else if (i[0] == 's'.charCodeAt(0)) {
			console.log('stack:')

			for (let i = 0; i < runtime.pc.getMem(0x7000); i++) {
				const val = runtime.pc.getMem(0x01FF - i);
				console.log(` ${i.toString(16).padStart(2, '0')} \
${val.toString(2).padStart(8, '0')} \
(0x${val.toString(16).padStart(4, '0')} \
${val.toString().padStart(3)})`)
			}
			continue;
		} else if (i[0] == 'k'.charCodeAt(0)) {
			const num = +(new TextDecoder().decode(i.slice(1, 7)).replaceAll('\0', ''));
			if (Number.isNaN(num)) {
				console.log('NaN')
				continue;
			}
			skip = num;
			console.log(`skipping ${num} cycles`)
			return true;
		} else if (i[0] == 'K'.charCodeAt(0)) {
			const num = +(new TextDecoder().decode(i.slice(1, 7)).replaceAll('\0', ''));
			if (Number.isNaN(num)) {
				console.log('NaN')
				continue;
			}
			skip_print = num;
			console.log(`skipping ${num} cycles with printing`)
			return true;
		} else if (i[0] == 'r'.charCodeAt(0)) {
			const num = i[2] ? parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16) : runtime.pc.programPointer;
			console.log(`set breakpoint on`, num.toString(16))
			breakpoints.push(num)
			continue;
		} else if (i[0] == '?'.charCodeAt(0)) {
			console.log(`b - break, exit
i - inspect
s - inspect stack
S - don't execute this instruction
c - continue and not print
C - continue and print
k[NUM] - skip and not print
K[NUM] - skip and print
r[ADR] - breakpoint
g[ADR] - goto, change PC
I[INS] - breakpoint instruction
:[ADDR]=[VAL] - set memory
\\[ADDR] - get value
m[ADDR] - set breakpoint on accessing that address`);
			continue;
		} else if (i[0] == 'g'.charCodeAt(0)) {
			const num = i[2] ? parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16) : runtime.pc.programPointer;
			console.log(`PC set to`, num.toString(16))
			runtime.pc.programPointer = num
			continue;
		} else if (i[0] == 'I'.charCodeAt(0)) {
			const instr = new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', '')
			console.log(`instruction breakpoint set on`, instr)
			instBreakpoints.push(instr)
			continue;
		} else if (i[0] == 'c'.charCodeAt(0)) {
			skip = -1
			console.log(`continuing execution`)
		} else if (i[0] == 'C'.charCodeAt(0)) {
			skip_print = -1
			console.log(`continuing execution and printing`)
		} else if (i[0] == ':'.charCodeAt(0)) {
			const instr = new TextDecoder().decode(i.slice(1, 15)).replace('\n', '').replaceAll('\0', '')
			const match = [...instr.matchAll(/^([a-fA-F0-9]{1,4})=([a-fA-F0-9]{1,2})$/g)];
			if (!match || !match[0]) {
				console.log('not matched, uhoh')
				continue;
			}
			const [_, addr, data] = match[0]
			console.log(`set $${addr} to 0x${data}`)
			runtime.pc.setMem(parseInt(addr, 16), parseInt(data, 16))
			continue;
		} else if (i[0] == '\\'.charCodeAt(0)) {
			const num = parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16);
			if (Number.isNaN(num))
				continue;
			console.log(`${num.toString(16).padStart(4, '0')}: ${runtime.pc.getMem(num)?.toString(16)?.padStart(2, '0')}`)
			continue;
		}/* else if (i[0] == '\''.charCodeAt(0)) {
				if (i[1] == '\n'.charCodeAt(0)) {
					runtime.pc.mem[0x5000] = 0;
					runtime.pc.mem[0x5001] = 0;
					console.log('reset')
					continue;
				}
				const num = parseInt(new TextDecoder().decode(i.slice(1, 3)).replace('\n', '').replaceAll('\0', ''), 16);
				if (Number.isNaN(num))
					continue;
				runtime.pc.mem[0x5000] = num;
				runtime.pc.mem[0x5001] = 0x08;
				console.log(`set $5000 to 0x${num.toString(16).padStart(2, '0')} and $5001 to 08`)
				console.log(`set breakpoint to accessing address 5000`)
				memBreakpoints.push(0x5000)

			} else if (i[0] == 'm'.charCodeAt(0)) {
				const num = parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16);
				if (Number.isNaN(num)) {
					console.log('NaN')
					break dbg;
				}
				console.log(`set breakpoint to accessing address`, num.toString(16))
				memBreakpoints.push(num)
				continue;
			}*/
		else if (i[0] == 0 || i[0] == 10)
			break;
		else console.log(i)
	}
	return true;
}
