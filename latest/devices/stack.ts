import { NamedSegmentDevice, DeviceType } from "../pc.ts";

export default class Stack extends NamedSegmentDevice {
	stack_index = 0;
	stack = new Uint16Array(256);
	name = 'stack';
	type = DeviceType.stack
	constructor(si_loc: number, stack_pointer: number) {
		super();
		const device = this;
		this._segments.si = {
			start: si_loc,
			end: si_loc,
			get_value() {
				console.log(device.stack)
				return device.stack_index;
			},
			set_value(_: number, value: number) {
				console.log('set si', value)
				device.stack_index = value
			}
		}
		this._segments.stack = {
			start: stack_pointer,
			end: stack_pointer + 256,
			get_value(addr: number) {
				return device.stack[addr-stack_pointer]
			},
			set_value(addr: number, value: number) {
				device.stack[addr-stack_pointer] = value;
			}
		}
	}
	push(value: number) {
		this.stack[this.stack_index++] = value;
	}
	pop(offset?: number): number {
		if (offset) return this.stack[this.stack_index-1-offset]
		return this.stack[--this.stack_index];
	}
}
