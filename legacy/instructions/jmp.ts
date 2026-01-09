import { PC } from "../pc.ts";

export default {
    function(this: PC, [addr]: string[]) {
        this.programPointer = Number(addr) - 1
    },
    args: 1
}