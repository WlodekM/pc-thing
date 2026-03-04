import { PC } from "./pc.ts";
const pc = new PC()

const commands: string[] = []
const commandData: Record<string, any> = {}

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
	commands.push(filename.name.replace(/\..*?$/g, ''))
	commandData[filename.name.replace(/\..*?$/g, '')] = (await import('./instructions/' + filename.name)).default
}

commands.push('end')

commandData.end = {
	args: 0
}

interface ObjectFile {
	// number is the ammount of bytes to skip
	code: (string | number)[],
	offset: number,
	// line number, data
	data: [number, number[]][]
}

// console.log(commands, commands.length, (commands.length - 1).toString(16))

const object: ObjectFile = JSON.parse(new TextDecoder().decode(Deno.readFileSync('code.o')))

const code = object.code

const offset = object.offset ?? 2**16 / 2

const ram = []
const trace: (string| number)[] = []

const instructions = []
const instr_trace: any[] = []

const put_inst: [number, string][] = []

for (const element of code) {
	instr_trace.push(element)
	if (typeof element == 'number') {
		instructions.push(element)
		continue;
	}
	let byte_length = 1
	const [command, ...args] = element.split(' ');
	switch (command) {
		case '.hex':
			instructions.push([parseInt(args[0], 16)]);
			continue;
		// deno-lint-ignore no-case-declarations
		case '.str':
			const str = [...element.matchAll(/"(.*?)(?<!\\)"/g)][0][1].replaceAll('\\"', '"')
			instructions.push(new Array(str.length).fill(0).map((_, i) => str.charCodeAt(i)));
			continue;
	}
	const parsedArgs = args.map(arg => {
		if (arg.startsWith('$')) return arg // line numbers can pass
		if (arg.match(/^\[.*\]$/)) return arg // line numbers can pass
		if (!isNaN(+arg)) {
			// make sure its a uint16
			return Math.floor(+arg) & 0xFFFF
		}
		arg = arg.toLowerCase();
		if (!pc.regNames.includes(arg)) throw 'unknown register '+arg
		return arg
	})
	switch (command) {
		case '.put':
			for (const a of parsedArgs) {
				instructions.push(1)
				put_inst.push([instructions.length-1, String(a)])
			}
			continue;
	}
	const inst = Object.entries(pc.instructions).find(([_, b]) => b == command);
	if (!inst) throw 'could not find instruction for ' + command + ' (' + inst + ')'
	if (!commandData[command]) throw 'no command data for ' + command + ' (' + inst + ')'
	if (commandData[command].args != args.length)
		throw `mismatch of ${command} arg length ${commandData[command].args} != ${args.length}`
	instructions.push([+inst[0], ...parsedArgs])
}

const instructionAddresses: number[] = [];

function parse_args(raw_args: (string|number)[], ia=true): (number|string)[] {
	return raw_args.map<number|string>(i => {
		if (typeof i !== 'string')
			return i;
		const m = i.match(/^\[(.*)\]$/)
		if (m) {
			const ln = +m[1]
			if (!ia) return 0;
			if (!instructionAddresses[+ln]) throw 'cant find '+i
			// console.log(i, instructionAddresses[+i.replace('$', '')])
			return instructionAddresses[+ln]
		}
		if (!i.startsWith('$'))
			return i;
		if (!instructionAddresses[+i.replace('$', '')]) throw 'a '+i
		// console.log(i, instructionAddresses[+i.replace('$', '')])
		return instructionAddresses[+i.replace('$', '')]
	});
}

let addr = offset;
for (const instr of instructions) {
	instructionAddresses.push(addr);
	if (typeof instr === 'number') {
   		addr += instr;
		continue;
	}
	const [_,...raw_args] = instr;
	const args = parse_args(raw_args, false);
	addr += args.reduce<number>((p,c) => {
		if (typeof c == 'string') return p;
		return p+1;
	}, 1)
}

for (const [line, thing] of put_inst) {
	const p = parse_args([thing])[0];
	if (Number.isNaN(+p)) throw 'what'
	object.data.push([line, [+p]])
}
const registers = pc.regNames;
let i = 0
for (const instr of instructions) {
	//console.log(instr, Array.isArray(instr) ? instr[0].toString(16) : null)
	if (typeof instr == 'number') {
		// console.log(ram.length, instr, new Array<number>(instr).fill(0))
		ram.push(...new Array<number>(instr).fill(0))
		trace.push(...new Array(instr).fill(instr_trace[i]))
		i++
		continue;
	}
	const [instr_id, ...raw_args] = instr;
	const args = parse_args(raw_args)
	//0bNO333222_111IIIII 0bA8887776_66555444
	let opcode = (+instr_id) & 0b11111
	opcode = opcode | 0b1000_0000_0000_0000;
	let num_args = [];
	let arg_shift = 5;
	if (args.length > 3) throw 'more than 3 args not supported yet, sorry!';
	//console.log(args.length)
	for (let j = 0;  j < args.length; j++) {
		const arg = args[j];
		//console.log(j, arg, registers.includes(arg))
		let argn: number;
		if (typeof arg == 'string') {
			if (!registers.includes(arg))
				throw `what how did you even get a string to this stage (${arg})`;
			argn = registers.indexOf(arg)
			if (argn >= 0b100) argn++;
		} else {
			argn = 0b100
			num_args.push(arg)
		}
		//console.log(arg, argn, argn << arg_shift)
		opcode |= argn << arg_shift
		arg_shift += 3
	}
	const bin = opcode.toString(2);
	// console.log(`${bin.slice(0,-14)}-${bin.slice(-14,-11)}_${bin.slice(-11,-8)}_${bin.slice(-8,-5)}_${bin.substr(-5)}`, num_args, args)
	//const newInstr: number[] = instr.map<number>(i => {
	//    if (typeof i !== 'string') return i;
	//    const m = i.match(/^\[(.*)\]$/)
	//    if (m) {
	//        const ln = +m[1]
	//        if (!instructionAddresses[+ln]) throw 'cant find '+i
	//        // console.log(i, instructionAddresses[+i.replace('$', '')])
	//        return instructionAddresses[+ln]
	//    }
	//    if (!i.startsWith('$')) return i.charCodeAt(0);
	//    if (!instructionAddresses[+i.replace('$', '')]) throw 'a '+i
	//    // console.log(i, instructionAddresses[+i.replace('$', '')])
	//    return instructionAddresses[+i.replace('$', '')]
	//})
	// console.log(instructionAddresses[i], (instructionAddresses[i] * 2).toString(16), commands[newInstr[0]], newInstr)
	//ram.push(...newInstr)
	ram.push(opcode, ...num_args)
	trace.push(instr_trace[i], ...num_args.map<any>(_=>'* '+instr_trace[i]))
	i++
}


for (const element of object.data) {
	// console.log(instructionAddresses[element[0]] - offset, element[0], element[1])
	ram.splice(instructionAddresses[element[0]] - offset, element[1].length, ...element[1])
}

Deno.writeFileSync(Deno.args[0] ?? 'iram.bin', Uint8Array.from(ram.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))

console.log(`\x1b[92;20m${ram.map((v: number, i: number) => {
	const s = String(v.toString(2).padStart(16,'0'))
	return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)} ${s.slice(11, 16)} \
[0x${v.toString(16).padStart(4,'0')}] \
(${v & 0x8000 ? pc.instructions[v & 0b11111] : '-'})\t{${v.toString().padStart(6, ' ')}} | \t\
${(instructionAddresses.indexOf(offset + i)==-1?'':instructionAddresses.indexOf(offset + i).toString()).padEnd(6,' ')}:\
<${String(trace[i])}>`
}).join('\n')}\x1b[0m`)
