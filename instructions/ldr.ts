import { PC } from "../pc.ts";

export default function(this: PC, [reg1, reg2]: string[]) {
    if (!'ABC'.split('').includes(reg1))
        throw '';
    if (!'ABC'.split('').includes(reg2))
        throw '';
    this.registers['ABC'.split('').indexOf(reg1)] = this.mem[this.registers['ABC'.split('').indexOf(reg2)]]
}