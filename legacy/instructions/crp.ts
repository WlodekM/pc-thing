import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2, val]: number[]) {
        const r1 = this.lib.parseReg(reg1)
        const r2 = this.lib.parseReg(reg2)
        this.registers[r1] = +(this.registers[r2] == val)
    },
    args: 3
}