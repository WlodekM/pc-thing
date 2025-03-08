import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        this.returnStack.pop();
    },
    args: 0
}