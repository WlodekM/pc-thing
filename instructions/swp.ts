import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r1 = this.lib.parseReg(reg1)
        const r2 = this.lib.parseReg(reg2)
        const data1 = Number(this.registers[r1])
        const data2 = Number(this.registers[r2])
        this.registers[r1] = data2
        this.registers[r2] = data1
    },
    args: 2
}