import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r1 = this.lib.parseReg(reg1)
        const r2 = this.registers[this.lib.parseReg(reg2)]
        this.setMem(Number(r2), this.registers[r1] & 0xFFFF)
    },
    args: 2
}