import * as lib from "./lib.ts";
export class BitField {
    bits: boolean[];
    flip(bit: number) {
        this.bits[bit] = !this.bits[bit];
    }
    bit(bit: number) {
        return this.bits[bit]
    }
    setBit(bit: number, value: boolean) {
        this.bits[bit] = value;
    }
    set(value: number) {
        for (let bit = 0; bit < this.bits.length; bit++) {
            const mask: number = 1 << bit;
            this.setBit(bit, (value & mask) != 0)
        }
    }
    num(): number {
        let number = 0;
        for (let bit = 0; bit < this.bits.length; bit++) {
            const mask: number = 1 << bit;
            if (this.bits[bit])
                number |= mask;
        }
        return number;
    }
    constructor (len: number) {
        this.bits = new Array(len).fill(false);
    }
}

export class Register<T=number> extends BitField {
    get value(): number {
        return this.num()
    }
    set value(value: number) {
        this.set(value)
    }
    increment(): number {
        this.set(this.num() + 1);
        return this.num()
    }
    decrement(): number {
        this.set(this.num() - 1);
        return this.num()
    }
    constructor(bits: number) {
        super(bits);
    }
}

export interface Segment {
	start: number,
	end: number,
	get_value?: (addr: number) => number,
	set_value?: (addr: number, value: number) => void
}

type Registers = [number, number, number, number]
export class PC {
    registers: Registers = new Array<number>(4).fill(0) as Registers
    regNames: string = 'abcd'
    halted: boolean = false
    mem = new Array<number>(2**16).fill(0)
    segments: Record<string, Segment> = {}
    find_segment(addr: number): Segment | undefined {
    	for (const segment_name in this.segments) {
    		const segment = this.segments[segment_name];
    		if (addr < segment.start)
    			continue;
    		if (addr > segment.end)
   				continue;
   			return segment;
    	}
    }
    getMem(addr: number): number {
        if (addr < 0 || addr > 2**16)
            throw 'invalid address';
    	const segment = this.find_segment(addr);
    	if (segment)
    		return segment.get_value ? segment.get_value(addr) : 0;
        //TODO - memory mapping
        return this.mem[addr];
    }
    setMem(addr: number, data: number) {
       	const segment = this.find_segment(addr);
       	if (segment)
       		return segment.set_value ? segment.set_value(addr, data) : 0;
        this.mem[addr] = Math.floor(data) % 2**16
    }
    status:          Register<8>  = new Register(8);
    //!SECTION
    //SECTION - status reg bits
    get carry(): boolean {return this.status.bit(0)}
    set carry(value:boolean) {this.status.setBit(0, value)}
    get zero(): boolean {return this.status.bit(1)}
    set zero(value:boolean) {this.status.setBit(1, value)}
    get IRQBDisable(): boolean {return this.status.bit(2)}
    set IRQBDisable(value:boolean) {this.status.setBit(2, value)}
    get decimalMode(): boolean {return this.status.bit(3)}
    set decimalMode(value:boolean) {this.status.setBit(3, value)}
    get BRK(): boolean {return this.status.bit(4)}
    set BRK(value:boolean) {this.status.setBit(4, value)}
    // ...1... //
    get overflow(): boolean {return this.status.bit(6)}
    set overflow(value:boolean) {this.status.setBit(6, value)}
    get negative(): boolean {return this.status.bit(7)}
    set negative(value:boolean) {this.status.setBit(7, value)}
    //!SECTION
    flagZN(num: number) {
        this.negative = (num & 0x80) != 0;
        this.zero = num == 0;
    }
    flagZCN(num: number, set: boolean = true): number {
        const status = new BitField(8);
        status.set(this.status.num())
        status.setBit(0, num > 0xFF || num < 0)
        status.setBit(7, (num & 0x80) != 0);
        status.setBit(1, num == 0);
        if (set)
            this.status.set(status.num())
        return status.num()
    }
    programPointer: number = 0;
    lib = lib
    returnFlag = 0;
    returnStack: number[] = []
    // the instruction set, in no particular order :3
    instructions: Record<number, string> = {
        0:  'mov',
        1:  'swp',
        2:  'ld',
        3:  'str',
        4:  'add',
        5:  'sub',
        6:  'mul',
        7:  'div',
        8:  'mod',
        9:  'shl',
        10: 'shr',
        11: 'cmp',
        12: 'cmr',
        13: 'and',
        14: 'or',
        15: 'xor',
        16: 'not',
        17: 'push',
        18: 'pop',
        19: 'halt',
        20: 'sys', // extra
        21: 'jmp',
        22: 'jnz',
        23: 'jz',
        24: 'jmr',
        25: 'ret',
        
        31: 'end'
    }
    constructor(diskSupport = false) {
        if (diskSupport) {
            this.mem[0x7cff] = (2**16) - 1
        }
    }
}
