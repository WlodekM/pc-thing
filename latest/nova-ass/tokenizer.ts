export enum TokenType {
	identifier			= 'identifier',
	register			= 'register',
	number				= 'number',
	bracket_open		= 'bracket_open',
	bracket_close		= 'bracket_close',
	paren_open			= 'paren_open',
	paren_close			= 'paren_close',
	brace_open			= 'brace_open',
	brace_close			= 'brace_close',
	semicolon			= 'semicolon'
	string				=
}

export interface Token {
	type: TokenType,
	value: string
}

const REGISTERS = 'abcd'

// tokenizer? i hardly know 'er
export class Tokenizer {
	text: string;
	index: number = 0;
	constructor(text: string) {
		this.text = text;
	}
	eat(): string {
		return this.text[this.index++];
	}
	peek(offset: number = 0): string {
		return this.text[this.index+offset] ?? '';
	}
	alpha(char: string) {
		return /[a-zA-Z_@\.]/.test(char);
	}
	numeric(char: string) {
		return /\d/.test(char);
	}
	whitespace(char: string) {
		return /[\s]/.test(char);
	}
	tokens: Token[] = []
	tokenize(): Token[] {
		let comment = false;
		while (this.index < this.text.length) {
			const char = this.eat();
			if (comment) {
				if (char == '\n') comment = false;
				continue;
			}
			if (char == '#') {
				comment = true
				continue;
			}
			if (this.whitespace(char)) continue;
			if (char == '"') {
				throw 'TODO'
				continue;
			}
			if (this.alpha(char)) {
				let identifier = char;
				while (this.alpha(this.peek()) || this.numeric(this.peek())) {
					identifier += this.eat();
				}
				if (REGISTERS.includes(identifier.toLowerCase()))
					this.tokens.push({ type: TokenType.register, value: identifier.toLowerCase() })
				else
					this.tokens.push({ type: TokenType.identifier, value: identifier })
				continue;
			}
			if (this.numeric(char)) {
				let number = char;
				let base = 10;
				balls:
				if (char == '0') {
					if (this.numeric(this.peek()))
						break balls; // owie
					const BASES = {
						o: 8,
						x: 16
					};
					const char = this.eat();
					if (!BASES[char]) throw `unknown base ${char}`;
					base = BASES[char];
					console.log('base', char)
					number =  '';
					//this.eat();
				}
				while (
					this.numeric(this.peek()) ||
					(base == 16 && 'abdef'.includes(this.peek().toLowerCase()))
				) {
					number += this.eat();
					console.log(number)
				}
				this.tokens.push({ type: TokenType.number, value: parseInt(number,base).toString() });
				continue;
			}
			const THINGY = {
				'[': TokenType.bracket_open,
				']': TokenType.bracket_close,
				'{': TokenType.brace_open,
				'}': TokenType.brace_close,
				'(': TokenType.paren_open,
				')': TokenType.paren_close,
				';': TokenType.semicolon,
			}
			if (THINGY[char]) {
				this.tokens.push({ type: THINGY[char], value: char });
				continue;
			}
			throw `unexpected character ${char} at ${this.index}`
		}
	}
}
