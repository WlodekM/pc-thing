export enum TokenType {
    TYPE       = "TYPE",
    FN_DECL    = "FN_DECL",
    LITERAL    = "LITERAL",
    NUMBER     = "NUMBER",
    LPAREN     = "LPAREN",
    RPAREN     = "RPAREN",
    LBRACE     = "LBRACE",
    RBRACE     = "RBRACE",
    LBRACKET   = "LBRACKER",
    RBRACKET   = "RBRACKER",
    COMMA      = "COMMA",
    WHILE      = "WHILE",
    IF         = "IF",
    ELSE       = "ELSE",
    ASSIGN     = "ASSIGN",
    BINOP      = "BINOP",
    IDENTIFIER = "IDENTIFIER",

    EOF        = "EOF",
}

export interface Token {
    type: TokenType;
    value: string;
}

const types = ['int', 'bool', 'char']

// i hardly know her
export default class Tokenizer {
    private source: string;
    private position: number = 0;

    constructor(source: string) {
        this.source = source;
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z_#]/.test(char);
    }

    private isDigit(char: string): boolean {
        return /-?[\d\.]/.test(char);
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }

    private advance(): string {
        return this.source[this.position++];
    }

    private peek(): string {
        return this.source[this.position] || "";
    }

    private match(expected: string): boolean {
        if (this.peek() === expected) {
            this.position++;
            return true;
        }
        return false;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];

        let inComment = false;
        let global = 0;

        while (this.position < this.source.length) {
            const char = this.advance();

            if (global > 0) global--;

            if (inComment) {
                if (char == '\n') inComment = false;
                continue;
            } else if (char == '/' && this.peek() == '/') {
                inComment = true
            } else if (this.isWhitespace(char)) {
                continue;
            } else if (this.isAlpha(char)) {
                let identifier = char;
                while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
                    identifier += this.advance();
                }

                // if (identifier === "#include") {
                //     // while(this.isWhitespace(this.peek()) && this.position < this.source.length) {
                //     //     this.advance()
                //     // }
                //     // if (this.advance() != '<') throw "Expected a < after #include"
                //     // let id = ''
                //     // while (this.peek() != '>'
                //     //     && (this.isAlpha(this.peek()) || this.isDigit(this.peek()))) {
                //     //     id += this.advance();
                //     // }
                //     // if (this.advance() != '>') throw "Expected a > after #include <..."
                //     tokens.push({ type: TokenType.INCLUDE, value: identifier });
                // } else if (identifier === "var") tokens.push({ type: TokenType.VAR, value: global > 0 ? 'global' : identifier });
                // else if (identifier === "list") tokens.push({ type: TokenType.LIST, value: global > 0 ? 'global' : identifier });
                // else if (identifier === "global") global = 2;
                if (identifier === "fn") tokens.push({ type: TokenType.FN_DECL, value: identifier });
                else if (identifier === "if") tokens.push({ type: TokenType.IF, value: identifier });
                else if (identifier === "else") tokens.push({ type: TokenType.ELSE, value: identifier });
                else if (identifier === "while") tokens.push({ type: TokenType.WHILE, value: identifier });
                else if (types.includes(identifier)) tokens.push({ type: TokenType.TYPE, value: identifier });
                // else if (identifier === "for") tokens.push({ type: TokenType.FOR, value: identifier });
                else tokens.push({ type: TokenType.IDENTIFIER, value: identifier });
            } else if (this.isDigit(char)) {
                let number = char;
                while (this.isDigit(this.peek())) {
                    number += this.advance();
                }
                tokens.push({ type: TokenType.NUMBER, value: number });
            } else if (char === '"') {
                let string = "";
                while (this.peek() !== '"' && this.peek() !== "") {
                    string += this.advance();
                }
                if (!this.match('"')) {
                    throw new Error("Unterminated string");
                }
                tokens.push({ type: TokenType.LITERAL, value: string });
            } else if (char === "(") tokens.push({ type: TokenType.LPAREN, value: char });
            else if (char === ")") tokens.push({ type: TokenType.RPAREN, value: char });
            else if (char === "{") tokens.push({ type: TokenType.LBRACE, value: char });
            else if (char === "}") tokens.push({ type: TokenType.RBRACE, value: char });
            else if (char === "[") tokens.push({ type: TokenType.LBRACKET, value: char });
            else if (char === "]") tokens.push({ type: TokenType.RBRACKET, value: char });
            else if (char === ",") tokens.push({ type: TokenType.COMMA, value: char });
            else if (char === "+") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "-") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "*") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "/") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "%") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "=" && this.peek() === '=') {
                tokens.push({ type: TokenType.BINOP, value: char });
                this.advance();
            }
            else if (char === "&" && this.peek() === '&') {
                tokens.push({ type: TokenType.BINOP, value: char });
                this.advance();
            }
            else if (char === "!" && this.peek() === '=') {
                tokens.push({ type: TokenType.BINOP, value: '!=' });
                this.advance();
            }
            else if (char === "<" && this.peek() === '=') {
                tokens.push({ type: TokenType.BINOP, value: '<=' });
                this.advance();
            }
            else if (char === ">" && this.peek() === '=') {
                tokens.push({ type: TokenType.BINOP, value: '>=' });
                this.advance();
            }
            else if (char === ">") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "<") tokens.push({ type: TokenType.BINOP, value: char });
            else if (char === "=") tokens.push({ type: TokenType.ASSIGN, value: char });
            else {
                throw new Error(`Unexpected character: ${char}`);
            }
        }

        tokens.push({ type: TokenType.EOF, value: "" });
        return tokens;
    }
}