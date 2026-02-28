import { PC } from "../pc.ts";

export default {
	function(this: PC, [reg1]: [number, number]) {
		if (this.mm_lock) return;
		const r1 = this.lib.parseReg(reg1, this);
		const offset = this.getMem(r1);
		const size = this.getMem(r1 + 1);
		this.memory_mode = {
			offset,
			size,
		}
		this.mm_lock = true;
	},
	args: 1,
	arg_types: 'r'
}
