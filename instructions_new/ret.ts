import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        const returnAddr = this.returnStack.pop();
        if (!returnAddr) throw 'return stack empty';
        this.programPointer = returnAddr;
    },
    args: 1
}