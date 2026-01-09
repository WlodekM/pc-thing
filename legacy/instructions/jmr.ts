import { PC } from "../pc.ts";

export default {
    function(this: PC, [addr]: string[]) {
        this.returnStack.push(this.programPointer)
        this.programPointer = Number(addr) - 1
    },
    args: 1
}