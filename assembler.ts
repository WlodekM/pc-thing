const labels: Record<string, number | string> = {}

let code = new TextDecoder()
    .decode(Deno.readFileSync('code.a'))

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
        let el = code[li];
        const sel = el.split(' ');
        li++;
        if (el.endsWith(":")) {
            labels[sel[0].replace(/:$/g,'')] = i;
            continue;
        }
        if (sel[0] == '.label') {
            labels[sel[1]] = sel[2];
            continue;
        }
        if (sel[0] == '#using') {
            const newCode = processCode(new TextDecoder().decode(Deno.readFileSync(sel[1])), i + 1)
            code = [
                ...code.filter((_, i) => i < li),
                `jmp ${li+newCode.length-1}`, // skip over included code
                ...newCode,
                ...code.filter((_, i) => i >= li)
            ]
            i += newCode.length + 1
            continue;
        }
        for (const label of Object.keys(labels).sort((a, b) => b.length - a.length)) {
            el = el.replace(label, labels[label].toString())
        }
        result.push(el)
        i++
    }
    return result
}

const result = processCode(code)

// console.log(labels)

// for (const label of Object.keys(labels)) {
//     result.push(`ld a ${labels[label]}`);
//     result.push(`mov b ${labels[label]}`);
//     result.push(`mov c 0`);
//     result.push(`dbg ${label}`)
// }

Deno.writeTextFileSync('code.p', result.join('\n'))
