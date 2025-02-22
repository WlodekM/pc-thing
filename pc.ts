import * as lib from "./lib.ts";
type Registers = [number, number, number]
export class PC {
    registers: Registers = new Array<number>(3).fill(0) as Registers
    mem = new Array<number>(2**16).fill(0)
    programPointer: number = 0;
    lib = lib
    returnFlag = 0;
    returnStack: number[] = []
}