export function parseReg(arg: number): number {
    if (!'ABC'.split('').includes(String.fromCharCode(arg).toUpperCase()))
        throw 'invalid register';
    return 'ABC'.split('').indexOf(String.fromCharCode(arg).toUpperCase())
}