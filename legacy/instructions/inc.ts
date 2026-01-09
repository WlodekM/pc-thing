import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, by]: number[]) {
        const r = this.lib.parseReg(reg);
        this.registers[r] += by
    },
    args: 2
}