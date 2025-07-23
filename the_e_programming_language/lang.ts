import Tokenizer from "./tokenizer.ts";
import ASTGen from "./ast.ts";
import Compiler from "./compiler.ts";
import { PC } from "../pc.ts";
const input = Deno.readTextFileSync('test.e')
const pc = new PC()

const tokenizer = new Tokenizer(input);
const tokens = tokenizer.tokenize();

console.log(tokens)

const astGenerator = new ASTGen(tokens);

let ast;
try {
    ast = astGenerator.parse()
} catch (error) {
    console.error(error);
    console.log('at', astGenerator.position, tokens.map((a, i) => i == astGenerator.position ? `${a.type}(${a.value}) <--` : `${a.type}(${a.value})`).join('\n'))
    Deno.exit(1)
}

console.log(ast)

const compiler = new Compiler(ast);

for (const node of compiler.AST) {
    compiler.compile(node)
}

Deno.writeTextFileSync('ast.json', JSON.stringify(ast, null, 4))
Deno.writeTextFileSync('depths.json', JSON.stringify(compiler.depth, null, 4))
Deno.writeTextFileSync('code.txt', compiler.instructions
    .map((i, idx) => `${' '.repeat(compiler.depth[idx])}${compiler.comments[idx] ? '; ' + compiler.comments[idx] + '\n ' : ''}\
${i.opcode}${i.args.length > 0 ? ' ' : ''}${i.args.join(',')}`).join('\n'))
Deno.writeFileSync('../iram.bin', Uint8Array.from(compiler.instructions.map<number[]>(i => {
    const goog = Object.entries(pc.instructions).find(([_, opc]) => opc == i.opcode);
    if (!goog) throw 'whar';
    return [+goog[0], 0, ...(i.args.map((a) => [a & 0x00FF, a & 0xFF00])).reduce((p, c) => {p.push(...c);return p}, [] as number[])]
}).reduce<number[]>((p, c) => {p.push(...c);return p}, [] as number[])))