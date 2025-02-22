import { PC } from "../pc.ts";

export default function(this: PC, [reg, data]: string[]) {
    const r = this.lib.parseReg(reg)
    this.registers[r] = Number(data) ?? 0
}