import { ImmediateArg, RegisterArg } from './runtime.ts';
import type { PC } from './pc.ts';

export function parseReg(arg: ImmediateArg | RegisterArg, pc: PC, only_reg: bool): number {
	if (typeof arg === 'number')
		return only_reg ? arg : pc.registers[arg];
	if (only_reg) throw 'sorry only registers in \'ere'
	return arg.v;
}
