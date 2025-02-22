import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1, reg2]: number[]) {
        const addr1 = this.registers[this.lib.parseReg(reg1)]
        const addr2 = this.registers[this.lib.parseReg(reg2)]
        console.debug(addr1, addr2)
        if (Number(addr1) > this.mem.length || Number(addr1) < 0 || Number.isNaN(Number(addr1)))
            throw 'Invalid address'
        if (Number(addr2) > this.mem.length || Number(addr2) < 0 || Number.isNaN(Number(addr2)))
            throw 'Invalid address'
        const data1 = 0 + this.mem[+addr1]
        const data2 = 0 + this.mem[+addr2]
        this.mem[+addr1] = data2
        this.mem[+addr2] = data1
    },
    args: 2
}