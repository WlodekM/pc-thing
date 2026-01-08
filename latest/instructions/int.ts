import { PC } from "../pc.ts";
import push from "./push.ts";

export default {
	function(this: PC) {
		if (!this.getMem(0x7002)) return;
		push.function.call(this,[100]);
		push.function.call(this,[99]);
		push.function.call(this,[98]);
		push.function.call(this,[97]);
		push.function.call(this,[this.programPointer])
		this.programPointer = this.getMem(0x7002)
	},
	args: 0,
	arg_types: ''
}