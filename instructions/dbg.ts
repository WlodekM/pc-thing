import { PC } from "../pc.ts";

export default {
    function(this: PC, [msg]: string[]) {
        console.log(msg, this.mem, this.registers, this.returnFlag, this.returnStack);
        const b = new Uint8Array(1);
        Deno.stdin.readSync(b)
        if (b[0] == 'c'.charCodeAt(0)) {
            this.programPointer = 0xFFFF - 1
        }
    },
    args: 1
}