import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, addr]: number[]) {
        this.setMem(this.getMem(Number(addr)), this.registers[this.lib.parseReg(reg)])
    },
    args: 2
}