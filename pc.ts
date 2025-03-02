import * as lib from "./lib.ts";
type Registers = [number, number, number]
export class PC {
    registers: Registers = new Array<number>(3).fill(0) as Registers
    mem = new Array<number>(2**16).fill(0)
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
        20: "ldm",
        21: "swpm",
        22: "dbg",
        23: "not",
        24: "cmp",
        25: "ret",
        26: "halt",
        27: "jnzr",
        28: "mul",
        29: "jmr",
        30: "end"
    }
}