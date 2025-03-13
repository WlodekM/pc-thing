// deno-lint-ignore-file no-case-declarations no-process-globals
import { PC } from "../pc.ts";

declare global {
    const process: any;
}

export default {
    function(this: PC) {
        if (typeof process == 'undefined') throw 'process global is undefined';
        switch (this.registers[0]) {
            case 0:
                switch (this.registers[1]) {
                    case 0:
                        const data = new Uint8Array(1024)
                        const len = Deno.stdin.readSync(data) ?? 0
                        let i = 0;
                        while (i < len) {
                            this.mem[this.registers[2] + i] = data[i]
                            i++
                        }
                        this.registers[0] = len
                        this.mem[this.registers[2] + i] = 0
                        break;

                    default:
                        throw 'unknown fd'
                }
                break;
            case 1:
                const writeBuff = [];
                let i = this.registers[2];
                while (this.mem[i] != 0 && i <= this.mem.length) {
                    writeBuff.push(this.mem[i]);
                    i++
                }
                switch (this.registers[1]) {
                    case 1:
                        process.stdout.write(writeBuff.map(a => String.fromCharCode(a)).join(''))
                        break;

                    case 2:
                        process.stderr.write(writeBuff.map(a => String.fromCharCode(a)).join(''))
                        break;

                    default:
                        throw 'unknown fd'
                }
                break;
            
            case 2:
                Deno.stdin.setRaw(this.registers[1] ? true : false);
                break;

            default:
                throw 'unknown syscall id ' + this.registers[0]
        }
    },
    args: 0
}