import { PC } from "./pc.ts";
const pc = new PC()

const commands = []
const commandData: Record<string, any> = {}

const dir = Deno.readDirSync('instructions_new');

for (const filename of dir) {
    commands.push(filename.name.replace(/\..*?$/g, ''))
    commandData[filename.name.replace(/\..*?$/g, '')] = (await import('./instructions_new/' + filename.name)).default
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

const instructions = []

for (const element of code) {
    if (typeof element == 'number') {
        instructions.push(element)
        continue;
    }
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
        if (!pc.regNames.split('').includes(arg)) throw 'whar '+arg
        return arg
    })
    const inst = Object.entries(pc.instructions).find(([_, b]) => b == command);
    if (!inst) throw 'erm,, what the sigma ' + command + ' (' + inst + ')'
    if (!commandData[command]) throw 'no command data for ' + command + ' (' + inst + ')'
    if (commandData[command].args != args.length)
        throw `mismatch of ${command} arg length ${commandData[command].args} != ${args.length}`
    instructions.push([+inst[0], ...parsedArgs])
}

const instructionAddresses: number[] = [];

let addr = offset;
for (const instr of instructions) {
    instructionAddresses.push(addr);
    addr += typeof instr == 'number' ? instr : instr.length
}

let i = 0
for (const instr of instructions) {
    // console.log(instr, Array.isArray(instr) ? instr[0].toString(16) : null)
    if (typeof instr == 'number') {
        // console.log(ram.length, instr, new Array<number>(instr).fill(0))
        ram.push(...new Array<number>(instr).fill(0))
        continue;
    }
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
        return instructionAddresses[+i.replace('$', '')]
    })
    // console.log(instructionAddresses[i], (instructionAddresses[i] * 2).toString(16), commands[newInstr[0]], newInstr)
    ram.push(...newInstr)
    i++
}


for (const element of object.data) {
    // console.log(instructionAddresses[element[0]] - offset, element[0], element[1])
    ram.splice(instructionAddresses[element[0]] - offset, element[1].length, ...element[1])
}

Deno.writeFileSync(Deno.args[0] ?? 'iram.bin', Uint8Array.from(ram.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
