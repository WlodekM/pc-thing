import { PC } from "./pc.ts";

type instruction = { function: (this: PC, argv: number[]) => void, args: number }

class Runtime {
    pc: PC = new PC(true)
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

const disk = [...Deno.readFileSync('disk.img')].reduce<number[]>((result, value, index, array) => {
    if (index % 2 === 0) {
        result.push(value | (array[index + 1] << 8))
    }
    return result;
}, [])

const runtime = new Runtime()

runtime.pc.getSegment = function getSegment(segment: number): Uint16Array {
    const seg = disk.slice(segment * 512, (segment + 1) * 512);
    console.log(`getSegment( ${segment} ):`, seg)
    return Uint16Array.from(seg.fill(seg.length, 512))
}

const dir = Deno.readDirSync('instructions_new');

for (const filename of dir) {
    runtime.addInstruction(filename.name.replace(/\..*?$/g, ''),
        (await import('./instructions_new/' + filename.name)).default)
}

runtime.addInstruction('end', { function: () => { }, args: 0 })

const iram = Deno.readFileSync("iram.bin")

runtime.pc.mem = runtime.pc.mem.toSpliced(65534 / 2 + 1, 0, ...[...iram].reduce<number[]>((result, value, index, array) => {
    if (index % 2 === 0) {
        result.push(value | (array[index + 1] << 8))
    }
    return result;
}, []))

runtime.pc.programPointer = 65536 / 2

const haltEvents = new EventTarget()

function waitUntilNotInterrupted(): Promise<void> {
    return new Promise((resolve) => {
        const callback = () => {
            resolve()
            haltEvents.removeEventListener('unHalted', callback)
        }
        haltEvents.addEventListener('unHalted', callback)
    })
}

function gotoInterrupt() {
    // console.log("INTERRUPT!", runtime.pc.mem[0x7000])
    if (!runtime.pc.mem[0x7000])
        return;
    runtime.pc.halted = false
    haltEvents.dispatchEvent(new Event('unHalted'));
    runtime.pc.returnStack.push(runtime.pc.programPointer - 1);
    runtime.pc.programPointer = runtime.pc.mem[0x7000]
}

const interruptInterval = setInterval(gotoInterrupt, 10)

const endInst = (Object.entries(runtime.pc.instructions) as [unknown, string][] as [number, string][])
    .find(([_, b]: [number, string]) => b == 'end')
if (!endInst) throw 'where the fuck is the end instruction'
const endInstId = endInst[0];


let c = 0
while (
    runtime.pc.mem[runtime.pc.programPointer] != endInstId &&
    runtime.pc.programPointer != 0xFFFF - 1) {
    try {
        const definition = Object.entries(runtime.pc.instructions).find(([a]) => +a == runtime.pc.mem[runtime.pc.programPointer])
        if (!definition || !definition[1]) throw `what the fuck is that (unknown instruction)
at ${runtime.pc.programPointer} (${runtime.pc.programPointer.toString(16)}/${(runtime.pc.programPointer * 2).toString(16)}/${(runtime.pc.programPointer * 2 - (2 ** 16)).toString(16)})
instruction: ${runtime.pc.mem[runtime.pc.programPointer]}`
        const instruction = definition[1]
        runtime.pc.programPointer++
        // console.debug(instruction, runtime.instructions, definition)
        const args = [];
        if (Deno.args.includes('-d'))
            console.debug(runtime.pc.programPointer, definition, instruction, runtime.pc.mem[runtime.pc.programPointer + 1])
        while (args.length < runtime.instructions[instruction].args) {
            args.push(runtime.pc.mem[runtime.pc.programPointer])
            runtime.pc.programPointer++
        }
        runtime.run([+definition[0], ...args])
        // runtime.pc.programPointer++
        c++
    } catch (error) {
        console.error(error);
        break;
    }
    if (runtime.pc.halted) {
        await waitUntilNotInterrupted()
    }
}

clearInterval(interruptInterval)

if (Deno.args.includes('-d'))
    console.debug(Object.values(runtime.pc.instructions))
console.debug('end of execution, dumping ram', runtime.pc.mem)
Deno.writeFileSync('ram.bin', Uint8Array.from(runtime.pc.mem.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
new Deno.Command('hexdump', {
    args: ['-C', 'ram.bin']
}).spawn()
