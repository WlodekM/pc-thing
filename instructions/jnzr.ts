import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const r1 = this.lib.parseReg(reg1)
        const r2 = this.lib.parseReg(reg2)
        if (this.registers[r1] == 0) return;
        this.programPointer = this.registers[r2] - 1
    },
    args: 2
}