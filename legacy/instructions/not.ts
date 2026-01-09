import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        this.registers[2] = ~this.registers[0]
    },
    args: 0
}