import dedent from "npm:dedent";
import { PC } from "./pc.ts";
const pc = new PC()
const labels: Record<string, string> = {}

const code = new TextDecoder()
    .decode(Deno.readFileSync(Deno.args[0] ?? 'code.a'))

const aliases = Object.fromEntries(new TextDecoder()
    .decode(Deno.readFileSync('aliases.txt')).split('\n').map(a=>a.split('=')))

const macros: Record<string, (args: string[]) => string> = {}

interface DataAddr {
    line: number,
    offset: number
}

interface ObjectFile {
    // number is the ammount of bytes to skip
    code: (string | number)[],
    offset: number,
    // line number, data
    data: [number, number[]][]
}

const object: ObjectFile = {
    code: [],
    data: [],
    offset: 2**16 / 2
}

const advAliases: Record<string, string> = {
    'mov,reg,addr': dedent`\
        mov d @1
        ld @0 d`,
    'mov,addr,reg': dedent`\
        mov d @0
        str d @1`,
    'str,reg,addr': dedent`\
        mov d @1
        str d @0`,
    'ld,reg,addr':  dedent`\
        mov d @1
        ld @0 d`,
    'add,': `add c a b`,
    'sub,': `sub c a b`,
    'mul,': `mul c a b`,
    'div,': `div c a b`,
}

function processCode(rcode: string, offset: number = 0): (string | number)[] {
    const code: (string | number)[] = rcode
        .split('\n')
        .map(l => l.trim())
        .map(l => l.replace(/\s*(?<!(?<!\"[^"]*)\"[^"]*);.*$/gm, ''))
        .map(l => l.replace(/(?<!(?<!\"[^"]*)\"[^"]*)'(.)'/g, (_, char) => char.charCodeAt(0).toString()))
        .map(l => l.replace(/0x([0-9A-Fa-f]+)/g, (_, hex: string) => ''+parseInt(hex, 16)))
        .filter(l => l)
        .reduce((acc, l) => {
            if (acc[acc.length - 1] && acc[acc.length - 1].endsWith('\\')) {
                acc[acc.length - 1] = acc[acc.length - 1].slice(0, -1) + '\n'
                acc[acc.length - 1] += l
                return acc
            }
            acc.push(l)
            return acc
        }, [] as string[]);
    const result: (string | number)[] = []

    let i = offset;
    let li = 0;
    //parse macros
    while (li < code.length) {
        const el = code[li];
        if (typeof el == 'number') {
            li++;
            continue;
        }
        const sel = el.split(' ');
        li++;
        if (sel[0] == '.macro') {
            sel.shift();
            let tx = sel.join(' ');
            const pattern = /([A-z\-_0-9]+)\((.*?)\)\s*/g
            const match = [...tx.matchAll(pattern)][0]
            tx = tx.replace(pattern, '').replaceAll('\\n', '\n');
            if (!match) throw 'knives at you'
            const args = (match[2] ?? '').split(/,\s*/g)
            macros[match[1]] = (args_: string[]) => {
                let s = tx;
                let i = 0
                for (const a of args_) {
                    s = s.replaceAll('@'+args[i], a)
                    i++
                }
                return s
            }
            continue;
        }
        i++
    }

    // parse other
    i = offset;
    li = 0;
    while (li < code.length) {
        const el = code[li];
        if (typeof el == 'number') {
            li++;
            continue;
        }
        const sel = el.split(' ');
        li++;
        if (el.endsWith(":")) {
            console.log(sel[0], i)
            labels[sel[0].replace(/:$/g,'')] = '$'+i;
            labels[`[${sel[0].replace(/:$/g,'')}]`] = `[${i}]`;
            continue;
        }
        if (sel[0] == '.label') {
            labels[sel[1]] = sel[2];
            continue;
        }
        if (macros[sel[0]]) {
            const macro = macros[sel[0]]
            sel.shift()
            const r = macro(sel).split('\n')
            i+=r.length
            continue;
        }
        if (sel[0] == '.macro') {
            continue;
        }
        if (sel[0] == '.offset') {
            continue;
        }
        if (sel[0] == '#using') {
            const newCode = processCode(new TextDecoder().decode(Deno.readFileSync(sel[1])), i + 1)
            i += newCode.length + 1
            continue;
        }
        i++
    }

    i = offset;
    li = 0;
    while (li < code.length) {
        let el = code[li];
        if (typeof el == 'number') {
            result.push(el);
            li++;
            continue;
        }
        let sel = el.split(' ');
        if (aliases[sel[0]]) el = el.replace(sel[0], aliases[sel[0]]);
        li++;
        if (macros[sel[0]]) {
            for (const label of Object.keys(labels).sort((a, b) => b.length - a.length)) {
                el = el.split(' ').map(a => a == label ? labels[label] : a).join(' ')
            }
            sel = el.split(' ')
            const macro = macros[sel[0]]
            sel.shift()
            let rr = macro(sel)
            for (const label of Object.keys(labels).sort((a, b) => b.length - a.length)) {
                rr = rr.replace(label, labels[label])
            }
            const r = rr.split('\n')
            result.push(...r)
            i+=r.length
            continue;
        }
        if (el.endsWith(":")) {
            continue;
        }
        if (sel[0] == '.label') {
            continue;
        }
        if (sel[0] == '.macro') {
            continue;
        }
        if (sel[0] == '.offset') {
            object.offset = +sel[1]
            continue;
        }
        if (sel[0] == '#using') {
            const newCode = processCode(new TextDecoder().decode(Deno.readFileSync(sel[1])), i + 1)
            result.push(`jmp $${i+newCode.length+1}`) // skip over included code
            result.push(...newCode)
            i += newCode.length + 1
            continue;
        }
        if (sel[0] == '.hex') {
            object.data.push([
                i,
                [parseInt(sel[1], 16)]
            ])
            result.push(1)
            i++;
            continue;
        }
        if (sel[0] == '.str') {
            const str = [...el.matchAll(/"(.*?)(?<!\\)"/g)][0][1].replaceAll('\\"', '"')
            object.data.push([
                i,
                new Array(str.length).fill(0).map((_, i) => str.charCodeAt(i))
            ])
            result.push(str.length)
            i++;
            continue;
        }
        for (const label of Object.keys(labels).sort((a, b) => b.length - a.length)) {
            el = el.split(' ').map(a => a == label ? labels[label] : a).join(' ')
        }
        const [cmd, ...args] = el.split(' ');
        const argtypes = args.map((a: string) => {
            if (pc.regNames.split('').includes(a)) return 'reg';
            if (a.match(/^\$[0-9A-Fa-f]+$/g)) return 'addr';
            return 'val';
        })
        if (advAliases[`${cmd},${argtypes.join(',')}`]) {
            el = advAliases[`${cmd},${argtypes.join(',')}`].replace(/@([0-9]+)/g, (_m, arg) => {
                if (argtypes[+arg] == 'addr') {
                    return args[+arg].replace('$', '')
                }
                return args[+arg]
            })
            result.push(...el.split('\n'));
            i += el.split('\n').length;
            continue;
        }
        result.push(el.replace(/\$[0-9A-Fa-f]+/g, (_, addr) => addr))
        i++
    }
    return result
}

object.code = processCode(code+'\nend')

// console.log(labels)

// for (const label of Object.keys(labels)) {
//     result.push(`ld a ${labels[label]}`);
//     result.push(`mov b ${labels[label]}`);
//     result.push(`mov c 0`);
//     result.push(`dbg ${label}`)
// }

Deno.writeTextFileSync('code.o', JSON.stringify(object))
