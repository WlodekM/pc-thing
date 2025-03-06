export function parseReg(arg: number): number {
    if (!'ABC'.split('').includes(String.fromCharCode(arg).toUpperCase()))
        throw `invalid register "${String.fromCharCode(arg)}"`;
    return 'ABC'.split('').indexOf(String.fromCharCode(arg).toUpperCase())
}