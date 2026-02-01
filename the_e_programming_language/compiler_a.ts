import { AssignmentNode, ASTNode, BinaryExpressionNode, FunctionCallNode, FunctionDeclarationNode, IdentifierNode, IfNode, LiteralNode, NumberNode, VariableDeclarationNode, WhileNode } from "./ast.ts";
// import { PC } from "../pc.ts";
// const pc = new PC();

type Opcode = 
	'halt'	|
	'mov'	|
	'str'	|
	'ld'	|
	'push'	|
	'pop'	|
	'add'	|
	'sub'	|
	'mul'	|
	'div'	|
	'not'	|
	'and'	|
	'or'	|
	'xor'	|
	'mod'	|
	'shr'	|
	'shl'	|
	'swp'	|
	'zr'	|
	'flg'	|
	'cmp'	|
	'int'	|
	'jmp'	|
	'jmr'	|
	'jnz'	|
	'ret'	|
	'rti'	|
	'cpy'	|
	'popi'	|
	'stop'
type Register = 'a' | 'b' | 'c' | 'd' | 'sp'

interface Instruction {
	opcode: Opcode,
	args: (Register | number)[]
}

const types: Record<string, number> = {
	'int' : 1,
	'bool': 1,
	'char': 1
}

const A = 'a';
const B = 'b';
const C = 'c';
// deno-lint-ignore no-unused-vars
const D = 'd';

export default class Compiler {
	vars: Record<string, [number, number]> = {};
	function_locations: Record<string, number> = {};
	functions: Record<string, string[]> = {};
	comments: Record<number, string> = {};
	depth: Record<number, number> = {};
	AST: ASTNode[];
	lastAddr: number = 0;
	str_instructions: string[] = []
	id = 0;
	instructions = {
		push(inst: Instruction) {
			// this.compiler.ilength += inst.args.length + 1;
			this.compiler.str_instructions.push(`${inst.opcode} ${inst.args.join(' ')}`.replace(/ $/,''))
		},
		compiler: null as unknown as Compiler
	};
	status: Record<string, number> = {
		A: 0,
		B: 0,
		C: 0,
		D: 0
	}
	stack: number[] = [];
	functions_start = 0x8000
	//functions: Record<string, Instruction[]> = {}
	constructor (ast: ASTNode[]) {
		this.AST = ast
		this.instructions.compiler = this;
	}
	mov(reg: 'A'|'B'|'C'|'D', value: number) {
		if (this.status[reg] == value) return;
		this.status[reg] = value;
		return this.instructions.push({
			opcode: 'mov',
			args: [reg.toLowerCase() as Register, value]
		})
	}
	pop(reg: 'A'|'B'|'C'|'D') {
		this.status[reg] = this.stack.pop() ?? NaN;
		if (this.str_instructions.length > 0 &&
			this.str_instructions.at(-1)!
				== ('push '+ reg))
			return this.str_instructions.pop();
		
		this.instructions.push({
			opcode: 'pop',
			args: [reg.toLowerCase() as Register]
		});
	}
	push(reg_or_value: 'A'|'B'|'C'|'D') {
		this.stack.push(typeof reg_or_value == 'number' ? reg_or_value : this.status[reg_or_value])
		this.instructions.push({
			opcode: 'push',
			args: [typeof reg_or_value == 'number' ? reg_or_value : reg_or_value.toLowerCase() as Register]
		})
	}
	append(code: string) {
		this.str_instructions.push(...code.split('\n'))
	}
	reset_status() {
		this.status.A=this.status.B=this.status.C=this.status.D=NaN
	}
	// get_addr() {
	// 	return this.instructions
	// 			.map(k => 1 + k.args.length)
	// 			.reduce((prev, curr) => {
	// 				return prev + curr 
	// 			}, 0) + this.functions_start
	// }
	compile (node: ASTNode, depth = 1) {
		// this.comments[this.instructions.length] = node.type;
		// const start = this.instructions.length - 1;
		if ((node as VariableDeclarationNode).type == 'VariableDeclaration') {
			const varDeclNode = node as VariableDeclarationNode;
			if (!types[varDeclNode.vtype]) throw 'unknown type';
			let addr;
			if (varDeclNode.location) {
				addr = this.vars[varDeclNode.identifier] = [varDeclNode.location, types[varDeclNode.vtype] * varDeclNode.length]
			} else {
				addr = this.vars[varDeclNode.identifier] =
					[this.lastAddr, types[varDeclNode.vtype] * varDeclNode.length];
				this.lastAddr += types[varDeclNode.vtype] * varDeclNode.length;
			}
			if (varDeclNode.value) {
				if (varDeclNode.value.type != 'Number') throw 'a';
				//this.mov('A', (varDeclNode.value as NumberNode).value)
				//this.mov('B', addr[0])
				this.instructions.push({
					opcode: 'str',
					args: [addr[0], (varDeclNode.value as NumberNode).value]
				})
			}
		} else if ((node as FunctionDeclarationNode).type == 'FunctionDeclaration') {
			const fnDeclNode = node as FunctionDeclarationNode;
			this.reset_status()

			const prev_instructions = this.str_instructions;
			//this.function_locations[fnDeclNode.name] = this.functions_start;

			this.str_instructions = [`_fn_${fnDeclNode.name}:`];

			for (const node of fnDeclNode.body) {
				this.compile(node, depth + 1)
			}
			this.instructions.push({
				opcode: 'ret',
				args: []
			})
			
			//const length = this.instructions
			//	.map(k => 1 + k.args.length)
			//	.reduce((prev, curr) => {
			//		return prev + curr 
			//	}, 0);
			//this.functions_start += length;
			
			this.functions[fnDeclNode.name] = this.str_instructions;
			this.str_instructions = prev_instructions;
		} else if ((node as BinaryExpressionNode).type == 'BinaryExpression') {
			const binExpNode = node as BinaryExpressionNode;
			this.compile(binExpNode.left, depth + 1)
			this.compile(binExpNode.right, depth + 1)
			this.pop('B')
			this.pop('A')
			switch (binExpNode.operator) {
				case '+':
					this.instructions.push({
						opcode: 'add',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;

				case '-':
					this.instructions.push({
						opcode: 'sub',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;

				case '*':
					this.instructions.push({
						opcode: 'mul',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;

				case '/':
					this.instructions.push({
						opcode: 'div',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;

				case '%':
					this.instructions.push({
						opcode: 'mod',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;

				case '!=':
					this.instructions.push({
						opcode: 'sub',
						args: [A, A, B]
					})
					this.instructions.push({
						opcode: 'zr',
						args: [A, A]
					})
					this.instructions.push({
						opcode: 'zr',
						args: [A, A]
					})
					
					this.status.A = NaN
					break;

				case '=':
					this.instructions.push({
						opcode: 'sub',
						args: [A, A, B]
					})
					this.instructions.push({
						opcode: 'zr',
						args: [A, A]
					})
					this.status.A = NaN
					break;
				
				case '>':
					this.instructions.push({
						opcode: 'cmp',
						args: [A, B, A]
					})
					this.status.A = NaN
					this.mov('B', 0b1000_0000)
					this.instructions.push({
						opcode: 'and',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;
				
				case '<':
					this.instructions.push({
						opcode: 'cmp',
						args: [A, A, B]
					})
					this.status.A = NaN
					this.mov('B', 0b1000_0000)
					this.instructions.push({
						opcode: 'and',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;
			
				default:
					throw `cannot handle binexp ${binExpNode.operator}; ${JSON.stringify(binExpNode)}`
			}
			this.push('A')
		} else if ((node as WhileNode).type == 'While') {
			const whileNode = node as WhileNode;
			// const start = this.ilength + this.functions_start;
			const label = `.while${this.id++}`
			this.reset_status()
			this.append(`${label}_start:`)
 			this.compile(whileNode.condition)
			this.pop('A')
			this.mov('B', 0)
			this.append(`cmp b a b`)
			this.append(`mov c 2`)
			this.append(`and b b c`)
			this.append(`mov a [${label}_end]`)
			this.append(`jnz a b`)
			this.reset_status()
			for (const node of whileNode.branch) {
				this.compile(node, depth + 1)
			}
			this.append(`mov a [${label}_start]\njmp a`)
			this.append(`${label}_end:`)
			this.reset_status()
		} else if ((node as IfNode).type == 'If') {
			const ifNode = node as IfNode;
			const label = `.if${this.id++}_end`
			this.compile(ifNode.condition)
			//this.reset_status()
			this.pop('A')
			//this.mov('B', 0)
			//this.instructions.push({
			//	opcode: 'cmp',
			//	args: [B, A, B]
			//})
			//this.append(`mov c 2`)
			//this.append(`and b b c`)
			this.append(`zr a a`)
			this.status.a = NaN;
			//this.mov('A', start)
			//const inst = this.str_instructions.length -1;
			this.str_instructions.push(`jnz [${label}] a`);
			this.reset_status()
			for (const node of ifNode.thenBranch) {
				this.compile(node, depth + 1)
			}
			this.str_instructions.push(`${label}:`)
			this.reset_status()
			//inst.args[1] = this.get_addr()
		} else if ((node as AssignmentNode).type == 'Assignment') {
			const assNode = node as AssignmentNode;
			this.compile(assNode.value, depth + 1)
			this.pop('A')
			this.mov('B', this.vars[assNode.identifier.name][0])
			if (assNode.identifier.offset) {
				this.push('A')
				this.push('B')
				this.compile(assNode.identifier.offset, depth + 1)
				this.pop('C')
				this.pop('B')
				this.pop('A')
				this.instructions.push({
					opcode: 'add',
					args: [B, B, C]
				})
				this.status.B = NaN
			}
			this.instructions.push({
				opcode: 'str',
				args: [B, A]
			})
		} else if ((node as IdentifierNode).type == 'Identifier') {
			const idenNode = node as IdentifierNode;
			this.mov('A', this.vars[idenNode.name][0])
			if (idenNode.offset) {
				this.push('A')
				this.compile(idenNode.offset, depth + 1)
				this.pop('C')
				this.pop('A')
				this.instructions.push({
					opcode: 'add',
					args: [A, A, C]
				})
				this.status.A = NaN
			}
			this.instructions.push({
				opcode: 'ld',
				args: [B, A]
			})
			this.status.B = NaN
			this.push('B')
		} else if ((node as NumberNode).type == 'Number') {
			const numNode = node as NumberNode;
			this.mov('A', numNode.value)
			this.push('A')
		} else if (node.type == 'FunctionCall') {
			const fncNode = node as FunctionCallNode;
			if (fncNode.identifier == '__asm__') {
				const code: string[] = []
				for (const arg of fncNode.args) {
					if (arg.type == 'Identifier') {
						//console.log(arg)
						code.push(this.vars[(arg as IdentifierNode).name][0].toString())
						continue;
					}
					if (arg.type != 'Literal')
						throw `can only use literals or identifiers in __asm__`;
					code.push((arg as LiteralNode).value)
				}
				return this.append(code.join(''))
			}
			this.str_instructions.push(`jmr [_fn_${fncNode.identifier}]`)
		} else {
			console.error(`!!! UNIMPLEMENTED NODE `, node.type, node)
		}
		// this.instructions.forEach((_, i) => {
		// 	if (!this.depth[i] && i >= start)
		// 		this.depth[i] = depth
		// })
	}
}
