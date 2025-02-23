const labels: Record<string, string> = {}

const code = new TextDecoder()
    .decode(Deno.readFileSync(Deno.args[0] ?? 'code.a'))

const aliases = Object.fromEntries(new TextDecoder()
    .decode(Deno.readFileSync('aliases.txt')).split('\n').map(a=>a.split('=')))

const macros: Record<string, (args: string[]) => string> = {}

function processCode(rcode: string, offset: number = 0) {
    let code: string[] = rcode
        .split('\n')
        .map(l => l.trim())
        .map(l => l.replace(/\s*;.*$/gm, ''))
        .filter(l => l);
    const result = []

    let i = offset;
    let li = 0;
    while (li < code.length) {
        const el = code[li];
        const sel = el.split(' ');
        li++;
        if (el.endsWith(":")) {
            labels[sel[0].replace(/:$/g,'')] = '$'+i;
            continue;
        }
        if (sel[0] == '.label') {
            labels[sel[1]] = sel[2];
            continue;
        }
        if (sel[0] == '.macro') {
            sel.shift();
            let tx = sel.join(' ');
            const pattern = /([A-z\-_0-9]+)\((.*?)\)\s*/g
            const match = [...tx.matchAll(pattern)][0]
            tx = tx.replace(pattern, '').replaceAll('\\n', '\n');
            if (!match || !match[2]) throw 'knives at you'
            const args = match[2].split(/,\s*/g)
            console.log(args, '-', match[1], '-', tx)
            macros[match[1]] = (args_: string[]) => {
                let s = tx;
                let i = 0
                for (const a of args_) {
                    s = s.replaceAll(args[i], a)
                    i++
                }
                return s
            }
            continue;
        }
        i++
    }

    i = offset;
    li = 0;
    while (li < code.length) {
        let el = code[li];
        const sel = el.split(' ');
        if (aliases[sel[0]]) el = el.replace(sel[0], aliases[sel[0]]);
        li++;
        if (macros[sel[0]]) {
            const macro = macros[sel[0]]
            sel.shift()
            const r = macro(sel).split('\n')
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
        if (sel[0] == '#using') {
            const newCode = processCode(new TextDecoder().decode(Deno.readFileSync(sel[1])), i + 1)
            code = [
                ...code.filter((_, i) => i < li),
                `jmp $${i+newCode.length+1}`, // skip over included code
                ...newCode,
                ...code.filter((_, i) => i >= li)
            ]
            i += newCode.length + 1
            continue;
        }
        for (const label of Object.keys(labels).sort((a, b) => b.length - a.length)) {
            el = el.replace(label, labels[label])
        }
        result.push(el)
        i++
    }
    return result
}

const result = processCode(code+'\nend')

// console.log(labels)

// for (const label of Object.keys(labels)) {
//     result.push(`ld a ${labels[label]}`);
//     result.push(`mov b ${labels[label]}`);
//     result.push(`mov c 0`);
//     result.push(`dbg ${label}`)
// }

Deno.writeTextFileSync('code.p', result.join('\n'))
