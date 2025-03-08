import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        // this.programPointer = 0xFFFF - 1
        this.halted = true
    },
    args: 0
}