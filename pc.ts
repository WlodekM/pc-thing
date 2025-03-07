import * as lib from "./lib.ts";
type Registers = [number, number, number]
export class PC {
    registers: Registers = new Array<number>(3).fill(0) as Registers
    regNames: string = 'abc'
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
        0: "crr",
        1: "jz",
        2: "sys",
        3: "swp",
        4: "sub",
        5: "str",
        6: "ldr",
        7: "add",
        8: "cmr",
        9: "mod",
        10: "srm",
        11: "or",
        12: "jnz",
        13: "put",
        14: "ld",
        15: "xor",
        16: "div",
        17: "srr",
        18: "jmp",
        19: "and",
        20: "ldm", // extra/deprecated
        21: "swpm",
        22: "dbg",
        23: "not",
        24: "cmp",
        25: "ret",
        26: "halt",
        27: "jnzr",
        28: "mul",
        29: "jmr",
        30: "end",
        31: "crp", // extra/deprecated
        32: "inc", // extra/deprecated
        33: "incr", // extra/deprecated
        34: 'shl',
        35: 'shr',
        36: 'sbc',
        37: 'dec', // extra/deprecated
        38: 'decr' // extra/deprecated
    }
    constructor(diskSupport = false) {
        if (diskSupport) {
            this.mem[0x7cff] = (2**16) - 1
        }
    }
}