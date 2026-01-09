export function parseReg(arg: number): number {
    if (!'abcd'.split('').includes(String.fromCharCode(arg).toLowerCase()))
        throw `invalid register "${String.fromCharCode(arg)}"`;
    return 'abcd'.split('').indexOf(String.fromCharCode(arg).toLowerCase())
}