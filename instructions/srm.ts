import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg, addr]: number[]) {
        if (Number(addr) > this.mem.length || Number(addr) < 0 || Number.isNaN(Number(addr)))
            throw 'unknown address';
        this.mem[this.mem[Number(addr)]] = this.registers[this.lib.parseReg(reg)]
    },
    args: 2
}