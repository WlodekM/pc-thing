import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, addr]: number[]) {
        const r = this.lib.parseReg(reg)
        this.setMem(Number(addr), this.registers[r] & 0xFFFF)
    },
    args: 2
}