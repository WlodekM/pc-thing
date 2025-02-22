import { PC } from "../pc.ts";

export default function(this: PC, [reg, addr]: string[]) {
    const r = this.lib.parseReg(reg)
    if (Number(addr) > this.mem.length || Number(addr) < 0 || Number.isNaN(Number(addr)))
        throw 'unknown address';
    this.registers[r] = this.mem[Number(addr)]
}