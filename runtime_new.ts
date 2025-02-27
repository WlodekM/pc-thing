import { PC } from "./pc.ts";

type instruction = {function: (this: PC, argv: number[]) => void, args: number}

class Runtime {
    pc: PC = new PC()
    instructions: instruction[] = []
    instructionNames: string[] = []

    addInstruction(name: string, instruction: instruction) {
        this.instructionNames.push(name)
        this.instructions.push(instruction)
    }

    run(line: number[]) {
        const instructionId = line.shift()
        if (instructionId == undefined || !this.instructions[instructionId])
            throw 'unknown instruction (1)';
        const instruction = this.instructions[instructionId];
        if (!instruction)
            throw 'unknown instruction (2)';
        try {
            instruction.function.call(this.pc, line)
        } catch (error) {
            console.error(error, 'at', this.pc.programPointer, this.instructionNames[instructionId])
        }
    }
}

const runtime = new Runtime()

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
    runtime.addInstruction(filename.name.replace(/\..*?$/g, ''),
        (await import('./instructions/' + filename.name)).default)
}

runtime.addInstruction('end', {function: () => { }, args: 0})

const iram = Deno.readFileSync("iram.bin")

runtime.pc.mem = runtime.pc.mem.toSpliced(65534 / 2 + 1, 0, ...[...iram].reduce<number[]>((result, value, index, array) => {
    if (index % 2 === 0) {
        result.push(value + (array[index + 1] << 8))
    }
    return result;
}, []))

runtime.pc.programPointer = 65534 / 2 + 1

// let c = 0
while (
    runtime.pc.mem[runtime.pc.programPointer] != runtime.instructions.length - 1 &&
    runtime.pc.programPointer != 0xFFFF - 1) {
    try {
        const instruction = runtime.pc.mem[runtime.pc.programPointer]
        runtime.pc.programPointer ++
        const args = [];
        if (Deno.args.includes('-d'))
        console.debug(runtime.pc.programPointer, instruction, runtime.instructionNames[instruction], runtime.pc.mem[runtime.pc.programPointer+1])
        while (args.length < runtime.instructions[instruction].args) {
            args.push(runtime.pc.mem[runtime.pc.programPointer])
            runtime.pc.programPointer++
        }
        runtime.run([instruction, ...args])
        // runtime.pc.programPointer++
        // c++
    } catch (error) {
        console.error(error);
        break;
    }
}

if (Deno.args.includes('-d'))
    console.debug(Object.fromEntries(runtime.instructions.map((_, i) => [i, runtime.instructionNames[i]])),)
console.debug('end of execution, dumping ram', runtime.pc.mem)
Deno.writeFileSync('ram.bin', Uint8Array.from(runtime.pc.mem.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
new Deno.Command('hexdump', {
    args: ['-C', 'ram.bin']
}).spawn()
