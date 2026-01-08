import { PC } from "../pc.ts";

export default {
	function(this: PC, [reg1, reg2, reg3]: number[]) {
		const r1 = this.lib.parseReg(reg1);
		const r2 = this.lib.parseReg(reg2);
		const r3 = this.lib.parseReg(reg3);
		for (let offset = 0; offset < r3; offset++) {
	        this.setMem(this.getMem(r1+offset), r2+offset);
		}
	},
	args: 3,
	arg_types: 'rrr'
}
