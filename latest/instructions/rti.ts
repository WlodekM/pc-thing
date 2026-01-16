import { PC } from "../pc.ts";

export default {
	function(this: PC) {
		//if (!this.getMem(0x7002)) return;
		this.programPointer = this.pop();
		this.registers[0] = this.pop();
		this.registers[1] = this.pop();
		this.registers[2] = this.pop();
		this.registers[3] = this.pop();
	},
	args: 0,
	arg_types: ''
}
