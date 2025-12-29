import { AssignmentNode, ASTNode, BinaryExpressionNode, FunctionCallNode, FunctionDeclarationNode, IdentifierNode, NumberNode, VariableDeclarationNode, WhileNode } from "./ast.ts";
// import { PC } from "../pc.ts";
// const pc = new PC();

type Opcode = 
	'mov'  |
	'swp'  |
	'ld'   |
	'str'  |
	'add'  |
	'sub'  |
	'mul'  |
	'div'  |
	'mod'  |
	'shl'  |
	'shr'  |
	'cmp'  |
	'cmr'  |
	'and'  |
	'or'   |
	'xor'  |
	'not'  |
	'push' |
	'pop'  |
	'halt' |
	'sys'  |
	'jmp'  |
	'jnz'  |
	'jz'   |
	'jmr'  |
	'ret'  |
	'end';
type Register = 97 | 98 | 99 | 100

interface Instruction {
	opcode: Opcode,
	args: (Register | number)[]
}

const types: Record<string, number> = {
	'int' : 1,
	'bool': 1,
	'char': 1
}

const A: Register = 97;
const B: Register = 98;
const C: Register = 99;
// deno-lint-ignore no-unused-vars
const D: Register = 100;

export default class Compiler {
	vars: Record<string, [number, number]> = {};
	function_locations: Record<string, number> = {};
	functions: Record<string, Instruction[]> = {};
	comments: Record<number, string> = {};
	depth: Record<number, number> = {};
	AST: ASTNode[];
	lastAddr: number = 0;
	instructions: Instruction[] = [];
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
	}
	mov(reg: 'A'|'B'|'C'|'D', value: number) {
		if (this.status[reg] == value) return;
		const reg_num = 'ABCD'.indexOf(reg)+A;
		this.instructions.push({
			opcode: 'mov',
			args: [reg_num, value]
		})
		this.status[reg] = value;
	}
	pop(reg: 'A'|'B'|'C'|'D') {
		const reg_num = 'ABCD'.indexOf(reg)+A;
		this.status[reg] = this.stack.pop() ?? NaN;
		if (this.instructions.length > 0 &&
			this.instructions.at(-1)!
				.opcode == 'push' &&
			this.instructions.at(-1)!
				.args[0] == reg_num)
			return this.instructions.pop();
		
		this.instructions.push({
			opcode: 'pop',
			args: [reg_num]
		});
	}
	push(reg: 'A'|'B'|'C'|'D') {
		const reg_num = 'ABCD'.indexOf(reg)+A;
		this.stack.push(this.status[reg])
		this.instructions.push({
			opcode: 'push',
			args: [reg_num]
		})
	}
	reset_status() {
		this.status.A=this.status.B=this.status.C=this.status.D=NaN
	}
	compile (node: ASTNode, depth = 1) {
		this.comments[this.instructions.length] = node.type;
		const start = this.instructions.length - 1;
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
				this.mov('A', (varDeclNode.value as NumberNode).value)
				this.mov('B', addr[0])
				this.instructions.push({
					opcode: 'str',
					args: [B, A]
				})
			}
		} else if ((node as FunctionDeclarationNode).type == 'FunctionDeclaration') {
			const fnDeclNode = node as FunctionDeclarationNode;
			this.reset_status()

			const prev_instructions = this.instructions;
			this.function_locations[fnDeclNode.name] = this.functions_start;

			this.instructions = []

			for (const node of fnDeclNode.body) {
				this.compile(node, depth + 1)
			}
			
			const length = this.instructions
				.map(k => 1 + k.args.length)
				.reduce((prev, curr) => {
					return prev + curr 
				}, 0);
			this.functions_start += length;
			
			this.functions[fnDeclNode.name] = this.instructions;
			this.instructions = prev_instructions;
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
				
				case '<':
					this.instructions.push({
						opcode: 'cmr',
						args: [A, A, B]
					})
					this.status.A = NaN
					this.mov('B', 1)
					this.instructions.push({
						opcode: 'and',
						args: [A, A, B]
					})
					this.status.A = NaN
					break;
			
				default:
					throw 'oh no'
			}
			this.push('A')
		} else if ((node as WhileNode).type == 'While') {
			const whileNode = node as WhileNode;
			const start = this.instructions
				.map(k => 1 + k.args.length)
				.reduce((prev, curr) => {
					return prev + curr 
				}, 0);
			this.reset_status()
			for (const node of whileNode.branch) {
				this.compile(node, depth + 1)
			}
			this.reset_status()
			this.compile(whileNode.condition)
			//this.reset_status()
			this.pop('A')
			this.mov('B', 0)
			this.instructions.push({
				opcode: 'cmp',
				args: [A, B]
			})
			this.mov('A', start)
			this.instructions.push({
				opcode: 'jz',
				args: [A]
			})
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
			//console.log('meow', this.function_locations)
			this.mov('A', this.function_locations[
				(node as FunctionCallNode).identifier
			]);
			this.instructions.push({
				opcode: 'jmr',
				args: [A]
			})
		} else {
			console.error(`!!! UNIMPLEMENTED NODE `, node.type, node)
		}
		this.instructions.forEach((_, i) => {
			if (!this.depth[i] && i >= start)
				this.depth[i] = depth
		})
	}
}
