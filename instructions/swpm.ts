import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const addr1 = this.registers[this.lib.parseReg(reg1)]
        const addr2 = this.registers[this.lib.parseReg(reg2)]
        const data1 = 0 + this.getMem(+addr1)
        const data2 = 0 + this.getMem(+addr2)
        this.setMem(+addr1, data2)
        this.setMem(+addr2, data1)
    },
    args: 2
}