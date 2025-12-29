import Tokenizer from "./tokenizer.ts";
import ASTGen from "./ast.ts";
import Compiler from "./compiler.ts";
import { PC } from "../pc.ts";
const dirname = import.meta.dirname+'/';
const input = Deno.readTextFileSync(dirname+'test.e')
const pc = new PC()

const tokenizer = new Tokenizer(input);
const tokens = tokenizer.tokenize();

// console.log(tokens)

const astGenerator = new ASTGen(tokens);

let ast;
try {
    ast = astGenerator.parse()
} catch (error) {
    console.error(error);
    console.log('at', astGenerator.position, tokens.map((a, i) => i == astGenerator.position ? `${a.type}(${a.value}) <--` : `${a.type}(${a.value})`).join('\n'))
    Deno.exit(1)
}

// console.log(ast)

const compiler = new Compiler(ast);

compiler.functions_start += 5

for (const node of compiler.AST) {
    compiler.compile(node)
}

const instructions = [];
instructions.push({
	opcode: 'mov',
	args: [97]
})
instructions.push({
	opcode: 'jmp',
	args: [97]
})
for (const name in compiler.functions) {
	instructions.push(...compiler.functions[name])
}
instructions.push({
    opcode: 'halt',
    args: []
})
const end = instructions
	.map(inst => 1 + inst.args.length)
	.reduce((p,c)=>p+c,0);
instructions[0].args.push(end+0x8001)
instructions.push(...compiler.instructions)
instructions.push({
	opcode: 'mov',
	args: [97, compiler.function_locations._start+1+2]
})
instructions.push({
	opcode: 'jmr',
	args: [97]
})
instructions.push({
    opcode: 'halt',
    args: []
})

Deno.writeTextFileSync(dirname+'ast.json', JSON.stringify(ast, null, 4))
Deno.writeTextFileSync(dirname+'depths.json', JSON.stringify(compiler.depth, null, 4))
//Deno.writeTextFileSync(dirname+'code.txt', compiler.instructions
//    .map((i, idx) => `${' '.repeat(compiler.depth[idx])}${compiler.comments[idx] ? '; ' + compiler.comments[idx] + '\n ' : ''}\
// ${i.opcode}${i.args.length > 0 ? ' ' : ''}${i.args.join(',')}`).join('\n'))
const bin = Uint8Array.from(instructions.map<number[]>(i => {
    const goog = Object.entries(pc.instructions).find(([_, opc]) => opc == i.opcode);
    if (!goog) throw 'whar';
    // console.log(goog, i)
    return [+goog[0], 0, ...(i.args.map((a) => [a & 0x00FF, (a & 0xFF00) >> 8])).flat()]
}).reduce<number[]>((p, c) => {p.push(...c);return p}, [] as number[]));
Deno.writeFileSync(dirname+'../iram.bin', bin)
Deno.writeFileSync(dirname+'./prog.bin', bin)
