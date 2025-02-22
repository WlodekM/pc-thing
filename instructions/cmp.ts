import { PC } from "../pc.ts";

export default function(this: PC, [reg, val]: string[]) {
    const r = this.lib.parseReg(reg)
    this.returnFlag = +(this.registers[r] == +val)
}