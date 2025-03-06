import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, addr]: number[]) {
        const r = this.lib.parseReg(reg)
        this.registers[r] = this.getMem(Number(addr))
    },
    args: 2
}