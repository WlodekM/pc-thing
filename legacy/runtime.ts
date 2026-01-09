import { PC } from "./pc.ts";

class Runtime {
    pc: PC = new PC()
    instructions: Map<string, (this: PC, argv: string[]) => void> = new Map()

    addInstruction(name: string, instruction: (this: PC, argv: string[]) => void) {
        this.instructions.set(name, instruction)
    }

    run(line: string) {
        line = line.replace(/\s*;.*$/gm, '')
        if (!line) return;
        const [instr, ...argv] = line.split(' ')
        const instructionId = instr.toLowerCase()
        if (!this.instructions.has(instructionId))
            throw 'unknown instruction';
        const instruction = this.instructions.get(instructionId);
        if (!instruction)
            throw 'unknown instruction';
        instruction.call(this.pc, argv)
    }
}

const runtime = new Runtime()

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
    runtime.addInstruction(filename.name.replace(/\..*?$/g, ''),
        (await import('./instructions/'+filename.name)).default)
}

const code = new TextDecoder().decode(Deno.readFileSync('code.p')).split('\n')

runtime.pc.programPointer = 0
while (runtime.pc.programPointer < code.length) {
    const line = code[runtime.pc.programPointer]
    try {
        runtime.run(line)
        // console.debug('0'.repeat(4 - String(runtime.pc.programPointer).length) +
        //     runtime.pc.programPointer,
        //     runtime.pc.registers, line)
    } catch (error) {
        console.error(error, 'at', line);
        throw 'Unexpected error while running program'
    }
    runtime.pc.programPointer++
}

console.debug('end of execution, dumping ram', runtime.pc.mem)
Deno.writeFileSync('ram.bin', Uint8Array.from(runtime.pc.mem.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
new Deno.Command('hexdump', {
    args: ['-C', 'ram.bin']
}).spawn()