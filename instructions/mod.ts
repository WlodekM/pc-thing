import { PC } from "../pc.ts";

export default {
    function(this: PC) {
        this.registers[2] = this.registers[0] % this.registers[1]
    },
    args: 0
}