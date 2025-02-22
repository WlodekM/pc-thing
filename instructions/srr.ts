import { PC } from "../pc.ts";

export default function(this: PC, [reg1, reg2]: string[]) {
    const r1 = this.lib.parseReg(reg1)
    const r2 = this.registers[this.lib.parseReg(reg2)]
    if (Number(r2) > this.mem.length || Number(r2) < 0 || Number.isNaN(Number(r2)))
        throw 'unknown address';
    this.mem[Number(r2)] = this.registers[r1] & 0xFFFF
}