import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r1 = this.lib.parseReg(reg1, this, true);
        const r2 = this.lib.parseReg(reg2, this);
        this.registers[r1] = this.flagZCN(r2, false)
    },
    args: 2,
    arg_types: 'rr'
}
