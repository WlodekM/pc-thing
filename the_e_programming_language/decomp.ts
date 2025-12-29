import { PC } from '../pc.ts';
if (!Deno.args[0]) throw 'bitch';
const _bin = Deno.readFileSync(Deno.args[0]);

const bin = Uint16Array.from(
	_bin
		.reduce((p: number[],c,i) => {
			if (i % 2 == 0)
				return [...p,c];
			p[p.length-1] += (c << 8);
			return p;
		}, [])
);

const pc = new PC();

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



let decomp = ''

console.log(bin, pc)


