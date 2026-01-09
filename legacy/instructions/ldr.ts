import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        this.registers[this.lib.parseReg(reg1)] = this.getMem(this.registers[this.lib.parseReg(reg2)])
    },
    args: 2
}