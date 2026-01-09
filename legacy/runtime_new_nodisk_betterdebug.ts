import { PC } from "./pc.ts";
import { crayon } from '@crayon/crayon';

type instruction = {function: (this: PC, argv: number[]) => void, args: number}

class Runtime {
    pc: PC = new PC()
    instructions: Record<string, instruction> = {}
    instructionNames: string[] = []

    addInstruction(name: string, instruction: instruction) {
        this.instructionNames.push(name)
        this.instructions[name] = instruction
    }

    run(line: number[]) {
        const instructionId = this.pc.instructions[line.shift() ?? -1]
        if (instructionId == undefined || !this.instructions[instructionId])
            throw 'unknown instruction (1)';
        const instruction = this.instructions[instructionId];
        if (!instruction)
            throw 'unknown instruction (2)';
        try {
            instruction.function.call(this.pc, line)
        } catch (error) {
            console.error(error, 'at', this.pc.programPointer, instructionId)
        }
    }
}

const runtime = new Runtime()

runtime.pc.segments.stdout = {
	start: 0x1000,
	end: 0x1000,
	set_value(_, v) {
		process.stdout.write(new Uint8Array([v]))
	}
}
const	disk = Deno.readFileSync('disk.bin');
let		block = 0;
runtime.pc.segments.disk_block = {
	start: 0x6000,
	end: 0x6000,
	set_value(_, v) {
		block = v
	},
	get_value() {return block} 
}
runtime.pc.segments.disk = {
	start: 0x6001,
	end: 0x6200,
	get_value(addr) {
		const offset = addr - 0x6001
		return disk[block * 512 + offset]
	}
}

runtime.pc.setMem(0x7000, 0x1FF)
console.log(runtime.pc)

const dir = Deno.readDirSync('instructions_newer');

for (const filename of dir) {
    runtime.addInstruction(filename.name.replace(/\..*?$/g, ''),
        (await import('./instructions_newer/' + filename.name)).default)
}

runtime.addInstruction('end', {function: () => { }, args: 0})

const iram = Deno.readFileSync(Deno.args[0] == '-p' ?
    Deno.args[1]! : "bios.bin")

runtime.pc.mem = runtime.pc.mem.toSpliced(65534 / 2 + 1, 0, ...[...iram].reduce<number[]>((result, value, index, array) => {
    if (index % 2 === 0) {
        result.push(value + (array[index + 1] << 8))
    }
    return result;
}, []))

runtime.pc.programPointer = 65536 / 2

function gotoInterrupt() {
    if (!runtime.pc.mem[65536 / 2 - 1])
        return;
    runtime.pc.returnStack.push(runtime.pc.programPointer);
    runtime.pc.programPointer = runtime.pc.mem[65536 / 2 - 1]
}

const debug = Deno.args.includes('-d')

// const interruptInterval = setInterval(gotoInterrupt, 10)

const endInst = (Object.entries(runtime.pc.instructions) as [unknown, string][] as [number, string][])
    .find(([_, b]: [number, string]) => b == 'end')
if (!endInst) throw 'where the fuck is the end instruction'
const endInstId = endInst[0];

function inspect() {
    console.log('IO status:')
    
    
    console.log(Object.entries(runtime.pc)
        .filter(([,value])=>(typeof value) == 'boolean')
        .map(([name, io]) => {
            // if (io instanceof Pin) {
            return ` ${name}: ${' '.repeat(20 - name.length)}${io ? "TRUE" : "FALSE"}`
            // } else if (io instanceof BitField) {
            //     return ` ${name}: ${' '.repeat(20 - name.length)}${io.bits.map(k=>+k).join('')} (0x${io.num().toString(16)})`
            // }
        }).join('\n'));
    
    console.log('\nregisters:')
    const [...letters] = 'ABCDEFG';
    for (let i = 0; i < runtime.pc.registers.length; i++) {
        const value = runtime.pc.registers[i];
        const letter = letters[i]
        console.log(` ${letter}:  ${value.toString(2).split('').map(k=>+k).reverse().join('')} (0x${value.toString(16)})`)
    }
    // console.log(` X:  ${cpu.regX.bits.map(k=>+k).reverse().join('')} (0x${cpu.regX.num().toString(16)})`)
    // console.log(` Y:  ${cpu.regY.bits.map(k=>+k).reverse().join('')} (0x${cpu.regY.num().toString(16)})`)
    // console.log(` SP: ${runtime.pc.returnStack.map(k=>+k).reverse().join('')} (0x${cpu.stackPointer.num().toString(16)})`)
    console.log(` PC: ${runtime.pc.programPointer.toString(2).split('').map(k=>+k).reverse().join('')} (0x${runtime.pc.programPointer.toString(16)}) [0x${(runtime.pc.programPointer * 2).toString(16)}]`)
    // console.log(` S:  ${runtime.pc.status.bits.map(k=>+k).reverse().join('')} (${
    //     'CZIDB-VN'.split('')
    //     .map((a, i) => {
    //         if (a == '-') return a;
    //         const bit = runtime.pc.status.bit(i);
    //         if (bit)
    //             return crayon.green(a)
    //         return crayon.red(a)
    //     }).reverse().join('')
    // })`)

}

if (debug) {
    //console.info('NOTE; the instructions are executed after input')
}

let instBreakpoints: string[] = [];
let breakpoints: number[] = []
let skip = 0

let c = 0
mainloop:
do {
    try {
        const definition = Object.entries(runtime.pc.instructions).find(([a]) => +a == runtime.pc.mem[runtime.pc.programPointer])
        if (!definition || !definition[1]) throw 'what the fuck is that'
        const instruction = definition[1]
        const start = runtime.pc.programPointer ++
        const args = [];
        while (args.length < runtime.instructions[instruction].args) {
            args.push(runtime.pc.mem[runtime.pc.programPointer])
            runtime.pc.programPointer++
        }
        if (debug)
        	console.debug(start.toString(16).padStart(4, '0'), runtime.pc.programPointer.toString(16).padStart(4, '0'), instruction, args/*,addr != undefined ? '0x'+addr.toString(16).padStart(4, '0') : '' */);

        // debug step-by-step mode
        dbg: if (debug) {
            if (instBreakpoints.includes(instruction)) {
                instBreakpoints = instBreakpoints.filter(k => k != instruction)
                skip = 0;
                console.log('hit instruction breakpoint on', runtime.pc.programPointer.toString(16))
            }
            if (breakpoints.includes(runtime.pc.programPointer)) {
                breakpoints = breakpoints.filter(k => k != runtime.pc.programPointer)
                skip = 0;
                console.log('hit breakpoint on', runtime.pc.programPointer.toString(16))
            }
            // if (addr && memBreakpoints.includes(addr)) {
            //     memBreakpoints = memBreakpoints.filter(k => k != addr)
            //     skip = 0;
            //     console.log('hit breakpoint on', addr.toString(16))
            // }
            if (skip != 0) {
                skip--
                break dbg;
            }
            dbgl:
            while (true) {
                const i = new Uint8Array(16);
                Deno.stdout.write(Uint8Array.from(['.'.charCodeAt(0)]))
                await Deno.stdin.read(i);
                if (i[0] == 'b'.charCodeAt(0)) {
                    console.log('BREAK!!')
                    break mainloop;
                } else if (i[0] == 'i'.charCodeAt(0)) {
                    inspect()
                    continue;
                } else if (i[0] == 's'.charCodeAt(0)) {
                    console.log('stack:')
                    
                    for (let i = 0; i < runtime.pc.getMem(0x7000); i++) {
                        console.log(` ${i.toString(16).padStart(2, '0')} ${runtime.pc.mem[0x01FF - i].toString(2).padStart(8, '0')} (0x${runtime.pc.mem[0x01FF - i].toString(16).padStart(4, '0')} ${runtime.pc.mem[0x01FF - i].toString().padStart(3)})`)
                    }
                    continue;
                } else if (i[0] == 'k'.charCodeAt(0)) {
                    const num = +(new TextDecoder().decode(i.slice(1, 7)).replaceAll('\0', ''));
                    if (Number.isNaN(num)) {
                        console.log('NaN')
                        break dbg;
                    }
                    skip = num;
                    console.log(`skipping ${num} cycles`)
                    break dbgl;
                } else if (i[0] == 'r'.charCodeAt(0)) {
                    const num = i[2] ? parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16) : runtime.pc.programPointer;
                    console.log(`set breakpoint on`, num.toString(16))
                    breakpoints.push(num)
                    continue;
                } else if (i[0] == '?'.charCodeAt(0)) {
                    console.log(`b - break, exit
    i - inspect
    s - inspect stack
    c - continue
    k[NUM] - skip
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
                } else if (i[0] == ':'.charCodeAt(0)) {
                    const instr = new TextDecoder().decode(i.slice(1, 15)).replace('\n', '').replaceAll('\0', '')
                    const match = [...instr.matchAll(/^([a-fA-F0-9]{1,4})=([a-fA-F0-9]{1,2})$/g)];
                    if (!match || !match[0]) {
                        console.log('not matched, uhoh')
                        continue;
                    }
                    const [_, addr, data] = match[0]
                    console.log(`set $${addr} to 0x${data}`)
                    runtime.pc.mem[parseInt(addr, 16)] = parseInt(data, 16)
                    continue;
                } else if (i[0] == '\\'.charCodeAt(0)) {
                    const num = parseInt(new TextDecoder().decode(i.slice(1, 7)).replace('\n', '').replaceAll('\0', ''), 16);
                    if (Number.isNaN(num))
                        continue;
                    console.log(`${num.toString(16).padStart(4, '0')}: ${runtime.pc.mem[num].toString(16).padStart(2, '0')}`)
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
                break;
            }
        }
        // console.debug(instruction, runtime.instructions, definition)
        if (Deno.args.includes('debug'))
        console.debug(runtime.pc.programPointer, definition, instruction, runtime.pc.mem[runtime.pc.programPointer+1])
        runtime.run([+definition[0], ...args])
        // runtime.pc.programPointer++
        // c++
    } catch (error) {
        console.error(error);
        break;
    }
} while (
    runtime.pc.mem[runtime.pc.programPointer] != endInstId &&
    runtime.pc.programPointer != 0xFFFF - 1 && c < 50
    && !runtime.pc.halted)

// clearInterval(interruptInterval)

if (Deno.args.includes('debug'))
    console.debug(Object.values(runtime.pc.instructions))
// console.debug('end of execution, dumping ram', runtime.pc.mem)
Deno.writeFileSync('ram.bin', Uint8Array.from(runtime.pc.mem.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
if (Deno.args.includes('-a'))
new Deno.Command('hexdump', {
    args: ['-C', 'ram.bin']
}).spawn()
