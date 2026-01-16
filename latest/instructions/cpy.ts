import { PC } from "../pc.ts";

export default {
	function(this: PC, [reg1, reg2, reg3]: number[]) {
		const r1 = this.lib.parseReg(reg1, this);
		const r2 = this.lib.parseReg(reg2, this);
		const r3 = this.lib.parseReg(reg3, this);
		console.log({r1,r2,r3})
		for (let offset = 0; offset < r3; offset++) {
			console.log(offset, r1+offset, this.getMem(r2+offset), r2+offset)
	        this.setMem(r1+offset, this.getMem(r2+offset));
		}
	},
	args: 3,
	arg_types: 'rrr'
}
