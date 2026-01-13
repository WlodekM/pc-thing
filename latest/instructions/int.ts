import { PC } from "../pc.ts";
//import push from "./push.ts";

export default {
	function(this: PC, [reg]: [number]) {
		const r = this.lib.parseReg(reg);
		this.interrupt(this.registers[r]);
	},
	args: 1,
	arg_types: 'r'
}
