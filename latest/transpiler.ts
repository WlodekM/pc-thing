import { PC, MemoryDevice } from './pc.ts';
import { Args } from 'args';
import StackDevice from './devices/stack.ts'
import SerialDevice from './devices/serial.ts'
const args = new Args();

args //@ts-ignore:
	.option('binary', 'the binary to be run by the emulator', 'iram.bin')

const pc = new PC();
type instruction = {function: (this: PC, argv: number[]) => void, args: number,  arg_types: string}
const instruction_lengths: number[] = [];

const dir = Deno.readDirSync('./instructions');

const instruction_ids = Object.fromEntries(Object.entries(pc.instructions).map(([a,b])=>[b,a]))
for (const filename of dir) {
	const inst = (await import('./instructions/' + filename.name)).default;
	//console.log(instruction_ids[filename.name.replace(/\.(t|j)s$/g,'')], filename.name)
	instruction_lengths[instruction_ids[filename.name.replace(/\.(t|j)s$/g,'')]] = inst.args
}

//console.log(instruction_lengths)

const flags = args.parse(process.argv)

const iram = Deno.readFileSync(flags.b)
const iram16 = new Uint16Array(iram.buffer);
const bios_rom = new MemoryDevice(flags.l ?? 0x8000, 0xfff);
//console.log(iram16)
bios_rom.mem.set(iram16, 0)
pc.add_device(bios_rom);
//TODO - actual memory map like in memory_map.md
pc.add_device(new StackDevice(0xb100, 0xb000));
if (process.stdin.isTTY)
	process.stdin.setRawMode(false);
pc.add_device(new SerialDevice(0x1000, flags.i));
pc.add_device(new MemoryDevice(0, 0x7fff));
pc.add_device(new MemoryDevice(0xb900, 0x10));


pc.programPointer = 0x8000;

const dict: Record<number, [boolean, string]> = {
	0x00:	/*halt*/  	[false,	'return -1;'],
	0x01:	/*mov*/  	[true,	'@0=@1;'],
	0x02:	/*str*/  	[true,	'pc.setMem(@0,@1);'],
	0x03:	/*ld*/  	[true,	'@0=pc.getMem(@1);'],
	0x04:	/*push*/  	[true,	'pc.push(@0);'],
	0x05:	/*pop*/  	[true,	'@0=pc.pop();'],
	0x06:	/*add*/  	[true,	`@0=(@1+@2)&${0xFFFF};`],
	0x07:	/*sub*/  	[true,	`@0=(@1-@2)&${0xFFFF};`],
	0x08:	/*mul*/  	[true,	`@0=(@1*@2)&${0xFFFF};`],
	0x09:	/*div*/  	[true,	`@0=Math.floor(@1/@2)&${0xFFFF};`],
	0x0a:	/*not*/  	[true,	`@0=~@1;`],
	0x0b:	/*and*/  	[true,	`@0=@1&@2;`],
	0x0c:	/*or*/  	[true,	`@0=@1|@2;`],
	0x0d:	/*xor*/  	[true,	`@0=@1^@2;`],
	0x0e:	/*mod*/  	[true,	`@0=@1%@2;`],
	0x0f:	/*shr*/  	[true,	`@0=(@1<<@2)&${0xFFFF};`],
	0x10:	/*shl*/  	[true,	`@0=@1>>@2;`],
	0x11:	/*swp*/  	[true,	`[@0,@1]=[@1,@0];`],
	0x12:	/*zr*/  	[true,	`@0=+(@1==0);`],
	0x13:	/*flg*/  	[true,	`@0=pc.flagZCN(@1,false);`],
	0x14:	/*cmp*/  	[true,	`@0=pc.flagZCN(@1-@2,false);`],
	0x15:	/*int*/  	[false,	'pc.interrupt(b,c,d);'],
	0x16:	/*jmp*/  	[false,	'return @0;'],
	0x17:	/*jmr*/  	[false,	'pc.returnStack.push($!);return @0;'],
	0x18:	/*jnz*/  	[true,	'if(@1!=0){return @0};'],
	0x19:	/*ret*/  	[false,	'return pc.returnStack.pop();'],
	0x1a:	/*rti*/  	[false,	'var p=pc.pop();a=pc.pop();b=pc.pop();c=pc.pop();d=pc.pop();return p;'],
	0x1b:	/*cpy*/  	[true,	'for(var o=0;o<@2;o++){pc.setMem(@0+o,pc.getMem(@1+o))};'],
	0x1c:	/*popi*/  	[true,	'@0=pc.pop(@1);'],
}

function parse_opcode(): [string, boolean] {
	const word = pc.getMem(pc.programPointer);
	const start = pc.programPointer;
	//console.log(word.toString(2).padStart(16,'0'))
	//console.log(pc.programPointer)
	if (!(word & 0x8000)) throw `not opcode!!! ${word} (${word.toString(2).padStart(16,'0')}) @ ${start}`;
	pc.programPointer++;
	const opcode = word & 0b11111
	//console.log(opcode, opcode.toString(16))
	const arg_mask = 0b1110_0000
	const args = []
	for (let i = 0; i < instruction_lengths[opcode]; i++) {
		const a = (word & (arg_mask << (i*3))) >>
			((i*3)+5);
		if (a < 0b100) {
			args.push(`pc.registers[${a}]`)
			continue;
		}
		args.push(pc.getMem(pc.programPointer++));
	}
	const end = pc.programPointer;
	//console.log(args)
	const [cont, code] = dict[opcode]
	return [cont, code
		.replace(/@(\d)/g, (_, i) => args[+i].toString())
		.replaceAll('$$', start.toString())
		.replaceAll('$!', end.toString())
	]
}

function parse_block(): string {
	let code = '()=>{';
	let i = 0;
	let r;
	while (i < 16) {
		r = parse_opcode();
		//console.log(r)
		code += r[1]
		if (!r[0]) i += 10
		i++
	}
	code += `return ${pc.programPointer}}`
	return code
}

//let a = 0, b = 0, c = 0, d = 0;
console.log(Date.now())
let C = 0
const cache:Record<number,string> = {}
while (pc.programPointer != -1) {
	//console.log(pc.programPointer, cache)
	const start = pc.programPointer
	const c = cache[start]??parse_block()
	if (!cache[start])
		cache[start]=c;
	const r = eval(c)();
	//console.debug(c.replaceAll(';','\n'), r)
	pc.programPointer = r
	if (r == -1) break;
	//Deno.stdin.readSync(new Uint8Array(4))
}
console.log(Date.now())
