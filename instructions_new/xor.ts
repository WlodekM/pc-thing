import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2, reg3]: number[]) {
        const r1 = this.lib.parseReg(reg1);
        const r2 = this.lib.parseReg(reg2);
        const r3 = this.lib.parseReg(reg3);
        this.returnFlag = +((this.registers[r2] ^ this.registers[r3]) != 0);
        this.registers[r1] = this.registers[r2] ^ this.registers[r3];
    },
    args: 3
}