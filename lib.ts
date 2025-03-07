export function parseReg(arg: number): number {
    if (!'abc'.split('').includes(String.fromCharCode(arg).toLowerCase()))
        throw `invalid register "${String.fromCharCode(arg)}"`;
    return 'abc'.split('').indexOf(String.fromCharCode(arg).toLowerCase())
}