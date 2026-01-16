import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2, reg3]: number[]) {
        const r1 = this.lib.parseReg(reg1, this, true);
        const r2 = this.lib.parseReg(reg2, this);
        const r3 = this.lib.parseReg(reg3, this);
        this.registers[r1] = r2 + r3
    },
    args: 3,
    arg_types: 'rrr'
}
