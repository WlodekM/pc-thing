import { PC } from "../pc.ts";
import pop from "./pop.ts";

export default {
	function(this: PC) {
		if (!this.getMem(0x7002)) return;
		pop.function.call(this,[97]);
		this.programPointer = this.registers[0]
		pop.function.call(this,[97]);
		pop.function.call(this,[98]);
		pop.function.call(this,[99]);
		pop.function.call(this,[100]);
	},
	args: 0,
	arg_types: ''
}