import { Args } from 'args';
import process from 'node:process';
import { Tokenizer } from './tokenizer.ts';
const args = new Args();
args.option('_', 'the fil', ['_'])
const flags = args.parse(process.argv)

if (!flags._[0])
	throw 'give me a nva file dumpass'

const file = Deno.readTextFileSync(flags._[0]!);

const tokenizer = new Tokenizer(file);

tokenizer.tokenize();

console.log(tokenizer.tokens);
