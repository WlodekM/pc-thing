import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r1 = this.lib.parseReg(reg1);
        const r2 = this.lib.parseReg(reg2);
        this.registers[r2] = this.flagZCN(this.registers[r1], false)
    },
    args: 2,
    arg_types: 'rr'
}