import { PC } from "../pc.ts";

export default {
	function(this: PC, [reg1, reg2]: [number, number]) {
		const r1 = this.lib.parseReg(reg1, this);
		const r2 = this.lib.parseReg(reg2, this);
		this.memory_mode = {
			offset: r1,
			size: r2
		}
	},
	args: 2,
	arg_types: 'rr'
}
