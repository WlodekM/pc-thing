import { PC } from "../pc.ts";

export default {
    function(this: PC, [reg1]: number[]) {
        const r1 = this.lib.parseReg(reg1);
        this.returnStack.push(this.programPointer);
        this.programPointer = this.registers[r1];
    },
    args: 1
}