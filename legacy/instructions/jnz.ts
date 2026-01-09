import { PC } from "../pc.ts";

export default {
    function(this: PC, [addr]: string[]) {
        if (this.returnFlag == 0) return;
        this.programPointer = +addr - 1
    },
    args: 1
}