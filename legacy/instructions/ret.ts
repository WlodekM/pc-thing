import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        const ret = this.returnStack.pop();
        if (ret == undefined) throw 'whar'
        this.programPointer = ret
    },
    args: 0
}