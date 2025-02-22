// TODO - finish this maybe

const commands = []

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
    commands.push(filename.name.replace(/\..*?$/g, ''))
}

commands.push('end')

console.log(commands, commands.length, (commands.length - 1).toString(16))

const code = new TextDecoder().decode(Deno.readFileSync('code.p')).split('\n')

const offset = 65534 / 2 + 1

const ram = []

const instructions = []

for (const element of code) {
    const [command, ...args] = element.split(' ');
    const parsedArgs = args.map(arg => {
        if (arg.startsWith('$')) return arg // line numbers can pass
        if (!isNaN(+arg)) {
            // make sure its a uint16
            return Math.floor(+arg) & 0xFFFF
        }
        arg = arg.toLowerCase();
        if (!'abc'.split('').includes(arg)) throw 'whar '+arg
        return arg
    })
    instructions.push([commands.indexOf(command), ...parsedArgs, 0, 42, 65535])
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
        if (!i.startsWith('$')) return i.charCodeAt(0);
        if (!instructionAddresses[+i.replace('$', '')]) throw 'a '+i
        return instructionAddresses[+i.replace('$', '')] - 2
    })
    // console.log(instructionAddresses[i], (instructionAddresses[i] * 2).toString(16), commands[newInstr[0]], newInstr)
    ram.push(...newInstr)
    i++
}

Deno.writeFileSync('iram.bin', Uint8Array.from(ram.map(a => [a & 0x00FF, (a & 0xFF00) >> 8]).flatMap(([a, b]) => [a, b])))
