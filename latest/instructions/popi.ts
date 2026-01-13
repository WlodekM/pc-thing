import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        //if (!this.getMem(0x7000)) throw 'no stack pointer';
        //if (this.getMem(0x7001) == 0) throw 'stack underflow';
        const r1 = this.lib.parseReg(reg1);
        const r2 = this.lib.parseReg(reg2);
        this.registers[r1] = this.pop(this.registers[r2]);
        //this.setMem(0x7001, this.getMem(0x7001) - 1)
    },
    args: 2,
    arg_types: 'rr'
}
