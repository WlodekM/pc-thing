import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, addr]: number[]) {
        this.registers[this.lib.parseReg(reg)] = this.getMem(this.getMem(Number(addr)))
    },
    args: 2
}