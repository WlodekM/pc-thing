import { PC } from "./pc.ts";
const pc = new PC()
// TODO - finish this maybe

const commands = []

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
    commands.push(filename.name.replace(/\..*?$/g, ''))
}

commands.push('end')

// console.log(commands, commands.length, (commands.length - 1).toString(16))

const code = new TextDecoder().decode(Deno.readFileSync('code.p')).split('\n')

const offset = 65534 / 2 + 1

const ram = []

const instructions = []

for (const element of code) {
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
        if (!'abc'.split('').includes(arg)) throw 'whar '+arg
        return arg
    })
    const inst = Object.entries(pc.instructions).find(([_, b]) => b == command);
    if (!inst) throw 'erm,, what the sigma ' + command + ' (' + inst + ')'
    instructions.push([+inst[0], ...parsedArgs])
}

const instructionAddresses: number[] = [];

let addr = offset;
for (const instr of instructions) {
    instructionAddresses.push(addr);
    addr += instr.length
}

let i = 0
for (const instr of instructions) {
    const newInstr: number[] = instr.map<number>(i => {
        if (typeof i !== 'string') return i;
        const m = i.match(/^\[(.*)\]$/)
        if (m) {
            const ln = m[1]
            if (!instructionAddresses[+ln]) throw 'a '+i
            // console.log(i, instructionAddresses[+i.replace('$', '')])
            return instructionAddresses[+ln]
        }
        if (!i.startsWith('$')) return i.charCodeAt(0);
        if (!instructionAddresses[+i.replace('$', '')]) throw 'a '+i
        // console.log(i, instructionAddresses[+i.replace('$', '')])
        return instructionAddresses[+i.replace('$', '')]+1
    })
    // console.log(instructionAddresses[i], (instructionAddresses[i] * 2).toString(16), commands[newInstr[0]], newInstr)
    ram.push(...newInstr)
    i++
}

Deno.writeFileSync('iram.bin', Uint8Array.from(ram.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
