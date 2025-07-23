import { AssignmentNode, ASTNode, BinaryExpressionNode, FunctionDeclarationNode, IdentifierNode, NumberNode, VariableDeclarationNode, WhileNode } from "./ast.ts";
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
    functions: Record<string, number> = {};
    comments: Record<number, string> = {};
    depth: Record<number, number> = {};
    AST: ASTNode[];
    lastAddr: number = 0;
    instructions: Instruction[] = [];
    constructor (ast: ASTNode[]) {
        this.AST = ast
    }
    compile (node: ASTNode, depth = 1) {
        this.comments[this.instructions.length] = node.type;
        const start = this.instructions.length - 1;
        if ((node as VariableDeclarationNode).type == 'VariableDeclaration') {
            const varDeclNode = node as VariableDeclarationNode;
            if (!types[varDeclNode.vtype]) throw 'unknown type';
            const addr = this.vars[varDeclNode.identifier] =
                [this.lastAddr, types[varDeclNode.vtype] * varDeclNode.length];
            this.lastAddr += types[varDeclNode.vtype] * varDeclNode.length;
            if (varDeclNode.value.type != 'Number') throw 'a';
            this.instructions.push({
                opcode: 'mov',
                args: [A, (varDeclNode.value as NumberNode).value]
            })
            this.instructions.push({
                opcode: 'mov',
                args: [B, addr[0]]
            })
            this.instructions.push({
                opcode: 'str',
                args: [B, A]
            })
        } else if ((node as FunctionDeclarationNode).type == 'FunctionDeclaration') {
            const fnDeclNode = node as FunctionDeclarationNode;
            this.functions[fnDeclNode.name] = this.instructions
                .map(k => 1 + k.args.length)
                .reduce((prev, curr) => {
                    return prev + curr 
                }, 0);
            for (const node of fnDeclNode.body) {
                this.compile(node, depth + 1)
            }
        } else if ((node as BinaryExpressionNode).type == 'BinaryExpression') {
            const binExpNode = node as BinaryExpressionNode;
            this.compile(binExpNode.left, depth + 1)
            this.compile(binExpNode.right, depth + 1)
            this.instructions.push({
                opcode: 'pop',
                args: [B]
            })
            this.instructions.push({
                opcode: 'pop',
                args: [A]
            })
            switch (binExpNode.operator) {
                case '+':
                    this.instructions.push({
                        opcode: 'add',
                        args: [A, A, B]
                    })
                    break;
                
                case '<':
                    this.instructions.push({
                        opcode: 'cmr',
                        args: [A, A, B]
                    })
                    this.instructions.push({
                        opcode: 'mov',
                        args: [B, 1]
                    })
                    this.instructions.push({
                        opcode: 'and',
                        args: [A, A, B]
                    })
                    break;
            
                default:
                    throw 'oh no'
            }
            this.instructions.push({
                opcode: 'push',
                args: [A]
            })
        } else if ((node as WhileNode).type == 'While') {
            const whileNode = node as WhileNode;
            const start = this.instructions
                .map(k => 1 + k.args.length)
                .reduce((prev, curr) => {
                    return prev + curr 
                }, 0);
            for (const node of whileNode.branch) {
                this.compile(node, depth + 1)
            }
            this.compile(whileNode.condition)
            this.instructions.push({
                opcode: 'pop',
                args: [A]
            })
            this.instructions.push({
                opcode: 'mov',
                args: [B, 0]
            })
            this.instructions.push({
                opcode: 'cmp',
                args: [A, B]
            })
            this.instructions.push({
                opcode: 'mov',
                args: [A, start]
            })
            this.instructions.push({
                opcode: 'jz',
                args: [A]
            })
        } else if ((node as AssignmentNode).type == 'Assignment') {
            const assNode = node as AssignmentNode;
            this.compile(assNode.value, depth + 1)
            this.instructions.push({
                opcode: 'pop',
                args: [A]
            })
            this.instructions.push({
                opcode: 'mov',
                args: [B, this.vars[assNode.identifier.name][0]]
            })
            if (assNode.identifier.offset) {
                this.instructions.push({
                    opcode: 'push',
                    args: [A]
                })
                this.instructions.push({
                    opcode: 'push',
                    args: [B]
                })
                this.compile(assNode.identifier.offset, depth + 1)
                this.instructions.push({
                    opcode: 'pop',
                    args: [C]
                })
                this.instructions.push({
                    opcode: 'pop',
                    args: [B]
                })
                this.instructions.push({
                    opcode: 'pop',
                    args: [A]
                })
                this.instructions.push({
                    opcode: 'add',
                    args: [B, B, C]
                })
            }
            this.instructions.push({
                opcode: 'str',
                args: [B, A]
            })
        } else if ((node as IdentifierNode).type == 'Identifier') {
            const idenNode = node as IdentifierNode;
            this.instructions.push({
                opcode: 'mov',
                args: [A, this.vars[idenNode.name][0]]
            })
            if (idenNode.offset) {
                this.instructions.push({
                    opcode: 'push',
                    args: [A]
                })
                this.compile(idenNode.offset, depth + 1)
                this.instructions.push({
                    opcode: 'pop',
                    args: [C]
                })
                this.instructions.push({
                    opcode: 'pop',
                    args: [A]
                })
                this.instructions.push({
                    opcode: 'add',
                    args: [A, A, C]
                })
            }
            this.instructions.push({
                opcode: 'ld',
                args: [B, A]
            })
            this.instructions.push({
                opcode: 'push',
                args: [B]
            })
        } else if ((node as NumberNode).type == 'Number') {
            const numNode = node as NumberNode;
            this.instructions.push({
                opcode: 'mov',
                args: [A, numNode.value]
            })
            this.instructions.push({
                opcode: 'push',
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