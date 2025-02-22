// TODO - finish this maybe

const commands = []

const dir = Deno.readDirSync('instructions');

for (const filename of dir) {
    commands.push(filename.name)
}

const code = new TextDecoder().decode(Deno.readFileSync('code.p')).split('\n')

const ram = []

for (const element of code) {
    const [command, ...args] = element.split(' ');
}
