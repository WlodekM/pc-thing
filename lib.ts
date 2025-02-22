export function parseReg(arg: string): number {
    if (!'ABC'.split('').includes(arg.toUpperCase()))
        throw 'invalid register';
    return 'ABC'.split('').indexOf(arg.toUpperCase())
}