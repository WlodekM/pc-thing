import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, data]: number[]) {
        const r = this.lib.parseReg(reg, this, true)
        this.registers[r] = this.lib.parseReg(data, this) ?? 0
    },
    args: 2,
    arg_types: 'ri'
}
