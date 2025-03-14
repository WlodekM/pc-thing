import * as lib from "./lib.ts";
type Registers = [number, number, number, number]
export class PC {
    registers: Registers = new Array<number>(4).fill(0) as Registers
    regNames: string = 'abcd'
    halted: boolean = false
    mem = new Array<number>(2**16).fill(0)
    getSegment: undefined | ((segment: number) => Uint16Array) = undefined;
    getMem(addr: number): number {
        if (addr < 0 || addr > 2**16)
            throw 'invalid address';
        //TODO - memory mapping
        return this.mem[addr];
    }
    setMem(addr: number, data: number) {
        if (this.getSegment && addr == 0x7cff) {
            const segment = this.getSegment(data)
            for (let i = 0; i < 512; i++) {
                this.mem[0x7d00 + i] = segment.length > i ? segment[i] : 0;
            }
            return;
        }
        if (addr >= 0x7d00 && addr <= 0x7fff && this.getSegment) {
            return;
        }
        this.mem[addr] = Math.floor(data) % 2**16
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
        
        31: 'end'
    }
    constructor(diskSupport = false) {
        if (diskSupport) {
            this.mem[0x7cff] = (2**16) - 1
        }
    }
}