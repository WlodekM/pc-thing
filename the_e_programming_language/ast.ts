import { Token, TokenType } from "./tokenizer.ts";

export interface ASTNode {
    type: string;
}

export interface VariableDeclarationNode extends ASTNode {
    type: "VariableDeclaration";
    identifier: string;
    value: ASTNode;
    vtype: string;
    length: number;
}

export interface FunctionDeclarationNode extends ASTNode {
    type: "FunctionDeclaration";
    name: string;
    // params: string[];
    body: ASTNode[];
}

export interface AssignmentNode extends ASTNode {
    type: "Assignment";
    identifier: IdentifierNode;
    value: ASTNode;
}

export interface BinaryExpressionNode extends ASTNode {
    type: "BinaryExpression";
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

export interface LiteralNode extends ASTNode {
    type: "Literal";
    value: string;
}

export interface NumberNode extends ASTNode {
    type: "Number";
    value: number;
}

export interface IdentifierNode extends ASTNode {
    type: "Identifier";
    name: string;
    offset?: ASTNode;
}

export interface FunctionCallNode extends ASTNode {
    type: "FunctionCall";
    identifier: string;
    args: ASTNode[];
}

// export interface BranchFunctionCallNode extends ASTNode {
//     type: "BranchFunctionCall";
//     identifier: string;
//     args: ASTNode[];
//     branches: ASTNode[][];
// }

// export interface StartBlockNode extends ASTNode {
//     type: "StartBlock";
//     body: ASTNode[];
// }

export interface IfNode extends ASTNode {
    type: "If";
    condition: ASTNode;
    thenBranch: ASTNode[];
    elseBranch?: ASTNode[];
}

export interface WhileNode extends ASTNode {
    type: "While";
    condition: ASTNode;
    branch: ASTNode[];
}

// export interface ForNode extends ASTNode {
//     type: "For";
//     times: ASTNode;
//     varname: ASTNode;
//     branch: ASTNode[];
// }

// export interface GreenFlagNode extends ASTNode {
//     type: "GreenFlag";
//     branch: ASTNode[];
// }

// use 1 or 0 for boolean
// export interface BooleanNode extends ASTNode {
//     type: "Boolean";
//     value: boolean;
// }

// export interface IncludeNode extends ASTNode {
//     type: "Include";
//     itype: string;
//     path: string;
// }

// export interface ListDeclarationNode extends ASTNode {
//     type: "ListDeclaration";
//     identifier: string;
//     value: ASTNode[];
//     vtype: 'list' | 'global'
// }

export default class AST {
    private tokens: Token[];
    position: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(ahead = 0): Token {
        return this.tokens[this.position + ahead];
    }

    private advance(): Token {
        return this.tokens[this.position++];
    }

    private match(...types: TokenType[]): boolean {
        if (types.includes(this.peek().type)) {
            this.advance();
            return true;
        }
        return false;
    }

    private matchTk(types: TokenType[], token = this.peek()): boolean {
        if (types.includes(token.type)) {
            return true;
        }
        return false;
    }

    private expect(type: TokenType, errorMessage: string): Token {
        if (this.peek().type === type) {
            return this.advance();
        }
        console.error('trace: tokens', this.tokens, '\nIDX:', this.position);
        throw new Error(errorMessage);
    }

    parse(): ASTNode[] {
        const nodes: ASTNode[] = [];
        while (this.peek().type !== TokenType.EOF) {
            nodes.push(this.parseStatement());
        }
        return nodes;
    }

    private parseStatement(): ASTNode {
        if (this.matchTk([TokenType.TYPE])) {
            const type = this.advance().value
            let len = 1;
            if (this.match(TokenType.LBRACKET)) {
                len = Number(this.expect(TokenType.NUMBER, 'expected number after [').value);
                this.expect(TokenType.RBRACKET, 'expected ] after length')
            }
            const identifier = this.expect(TokenType.IDENTIFIER, "expected var name after type (hint: functions dont have return types yet").value;
            this.expect(TokenType.ASSIGN, "expected = after var name");
            const value = this.parseAssignment(false);
            return { type: "VariableDeclaration", identifier, value, vtype: type, length: len } as VariableDeclarationNode;
        }

        if (this.match(TokenType.FN_DECL)) {
            const name = this.expect(TokenType.IDENTIFIER, "expected function name after fn").value;
            // this.expect(TokenType.LPAREN, "Expected '(' after function name");
            // const params: string[] = [];
            // if (!this.match(TokenType.RPAREN)) {
            //     do {
            //         params.push(this.expect(TokenType.IDENTIFIER, "Expected parameter name").value);
            //     } while (this.match(TokenType.COMMA));
            //     this.expect(TokenType.RPAREN, "Expected ')' after parameters");
            // }
            this.expect(TokenType.LBRACE, "expected '{' before function body");
            const body = this.parseBlock();
            return { type: "FunctionDeclaration", name, body } as FunctionDeclarationNode;
        }

        if (this.match(TokenType.IF)) {
            this.expect(TokenType.LPAREN, "Expected '(' after 'if'");
            const condition = this.parseAssignment();
            this.expect(TokenType.RPAREN, "Expected ')' after if condition");
            this.expect(TokenType.LBRACE, "Expected '{' after if condition");
            const thenBranch = this.parseBlock();
            let elseBranch: ASTNode[] | undefined;
            if (this.match(TokenType.ELSE)) {
                this.expect(TokenType.LBRACE, "Expected '{' after 'else'");
                elseBranch = this.parseBlock();
            }
            return { type: "If", condition, thenBranch, elseBranch } as IfNode;
        }

        if (this.match(TokenType.WHILE)) {
            this.expect(TokenType.LPAREN, "Expected '(' after 'while'");
            const condition = this.parseAssignment();
            this.expect(TokenType.RPAREN, "Expected ')' after while condition");
            this.expect(TokenType.LBRACE, "Expected '{' after while condition");
            const branch = this.parseBlock();
            return { type: "While", condition, branch } as WhileNode;
        }

        // if (this.match(TokenType.FOR)) {
        //     this.expect(TokenType.LPAREN, "Expected '(' after 'for'");
        //     const varname = this.parseAssignment();
        //     const of = this.expect(TokenType.IDENTIFIER, 'expected of');
        //     if (of.value !== 'of') throw new Error('expected of');
        //     const times = this.parseAssignment();
        //     this.expect(TokenType.RPAREN, "Expected ')' after for");
        //     this.expect(TokenType.LBRACE, "Expected '{' after for");
        //     const branch = this.parseBlock();

        //     return { type: "For", varname, times, branch } as ForNode;
        // }

        // if (this.match(TokenType.GREENFLAG)) {
        //     this.expect(TokenType.LBRACE, "Expected '{' after greenflag");
        //     const branch = this.parseBlock();

        //     return { type: "GreenFlag", branch } as GreenFlagNode;
        // }

        return this.parseAssignment();
    }

    private parseBlock(): ASTNode[] {
        const nodes: ASTNode[] = [];

        while (!this.match(TokenType.RBRACE)) {
            nodes.push(this.parseStatement());
        }

        return nodes;
    }

    private parseAssignment(allowStuff = true): ASTNode {

        const expr = this.parseBinaryExpression(allowStuff);
        if (this.match(TokenType.ASSIGN)) {
            if (expr.type !== "Identifier")
                throw new Error("invalid assignment target; expected an identifier");
            const value = allowStuff ? this.parseAssignment() : this.parsePrimary(false);
            // let offset = undefined;
            // if (this.match(TokenType.LBRACKET)) {
            //     offset = this.parseAssignment();
            //     this.expect(TokenType.RBRACKET, 'expected ]')
            // }
            return { type: "Assignment", identifier: (expr as IdentifierNode), value } as AssignmentNode;
        }
        return expr;
    }

    private parseBinaryExpression(allowStuff = false): ASTNode {
        let left = this.parseCall(allowStuff);

        while (this.peek().type === TokenType.BINOP) {
            const operator = this.advance().value;
            const right = this.parseCall();
            left = { type: "BinaryExpression", operator, left, right } as BinaryExpressionNode;
        }
        return left;
    }

    private parseCall(allowStuff = false): ASTNode {
        let expr = this.parsePrimary(allowStuff);

        while (this.peek().type === TokenType.LPAREN) {
            expr = this.finishCall(expr);
        }
        return expr;
    }

    private finishCall(callee: ASTNode): ASTNode {
        this.expect(TokenType.LPAREN, "Expected '(' after function name");
        //TODO - arguments
        // const args: ASTNode[] = [];
        // if (this.peek().type !== TokenType.RPAREN) {
        //     do {
        //         args.push(this.parseAssignment());
        //     } while (this.match(TokenType.COMMA));
        // }
        this.expect(TokenType.RPAREN, "Expected ')' after arguments");


        // if (this.peek().type === TokenType.LBRACE) {
        //     const branches: ASTNode[][] = [];
        //     do {
        //         this.expect(TokenType.LBRACE, "Expected '{' for branch block");
        //         branches.push(this.parseBlock());
        //     } while (this.peek().type === TokenType.LBRACE);

        //     if (callee.type !== "Identifier")
        //         throw new Error("Branch function call expects an identifier");
        //     return {
        //         type: "BranchFunctionCall",
        //         identifier: (callee as IdentifierNode).name,
        //         args,
        //         branches,
        //     } as BranchFunctionCallNode;
        // }


        if (callee.type !== "Identifier")
            throw new Error("Function call expects an identifier");
        return {
            type: "FunctionCall",
            identifier: (callee as IdentifierNode).name,
            // args,
        } as FunctionCallNode;
    }

    private parsePrimary(allowOther = true): ASTNode {
        const token = this.peek();

        if (this.match(TokenType.NUMBER)) {
            return { type: "Number", value: Number(token.value) } as NumberNode;
        }

        if (this.match(TokenType.LITERAL)) {
            return { type: "Literal", value: token.value } as LiteralNode;
        }

        if (this.match(TokenType.IDENTIFIER) && allowOther) {

            // if (["True", "true", "False", "false"].includes(token.value)) {
            //     return {
            //         type: "Boolean",
            //         value: token.value === "True" || token.value === "true"
            //     } as BooleanNode;
            // }
            let offset = undefined;
            if (this.match(TokenType.LBRACKET)) {
                offset = this.parseAssignment();
                this.expect(TokenType.RBRACKET, 'expected ]')
            }
            return { type: "Identifier", name: token.value, offset } as IdentifierNode;
        }

        if (this.match(TokenType.LPAREN) && allowOther) {
            const expr = this.parseAssignment();
            this.expect(TokenType.RPAREN, "Expected ')' after expression");
            return expr;
        }

        throw new Error(`Unexpected token: ${token.type}`);
    }

}