import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1]: number[]) {
        if (!this.getMem(0x7000)) throw 'no stack pointer';
        if (this.getMem(0x7001) == 256) throw 'stack overflow';
        const r1 = this.lib.parseReg(reg1);
        this.setMem(this.getMem(0x7000) + this.getMem(0x7001), this.registers[r1])
        this.setMem(0x7001, this.getMem(0x7001) + 1)
    },
    args: 1
}