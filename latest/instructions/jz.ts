import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r2 = this.lib.parseReg(reg2);
        if (!this.registers[r2]) return;
        const r1 = this.lib.parseReg(reg1);
        this.programPointer = this.registers[r1];
    },
    args: 2,
    arg_types: 'rr'
}