import { PC } from './pc.ts';
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

type instruction = {function: (this: PC, argv: number[]) => void, args: number,  arg_types: string}

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

const dir = Deno.readDirSync('./instructions');

for (const filename of dir) {
    runtime.addInstruction(filename.name.replace(/\..*?$/g, ''),
        (await import('./instructions/' + filename.name)).default)
}

runtime.addInstruction('end', {function: () => { }, args: 0,arg_types:''})

let decomp = ''

// console.log(bin)

let i = 0;

while (i < bin.length) {
    const word: number = bin[i];
	const instruction_id = word & 0b11111
	const instruction = pc.instructions[instruction_id];
	const start = i;
	i++;
	if (!instruction) {
		decomp += `unk 0x${word.toString(16)}\n`;
		continue;
	}
	decomp += instruction
	const instruction_data = runtime.instructions[instruction]!;
	let offset = 5;
	let mask = 0b1110_0000;
	let args = []
	for (let j = 0; j < instruction_data.args; j++) {
		const arg = (word & mask) >> offset;
		if (arg < 0b100) {
			decomp += ` ${'abcd'[arg]??`r${arg}`}`;
			args.push('abcd'[arg]??`r${arg}`)
			offset += 3;
			mask <<= 3;
			continue;
		}
		const arg_value = bin[i];
		//const arg_type = instruction_data.arg_types[j]!;
		//const arg_string = (({
		//	r: b => String.fromCharCode(b)
		//} as Record<string,(uh:number)=>string>)
		//	[arg_type] ?? (a=>a))(arg_value);
		args.push(arg_value)
		decomp += ` ${arg_value}`
		offset += 3;
		mask <<= 3;
		i++;
	}

	poopoo:
	if (['jmp','jmr','jnz'].includes(instruction)) {
		if (typeof args[0] !== 'number') break poopoo;
		
	}

	decomp+=`    \t; ${start+0x8000}\t${(start+0x8000).toString(16)}\t${start}`
	decomp+='\n'
}

console.log(decomp)
