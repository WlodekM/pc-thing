import { NamedSegmentDevice, DeviceType } from "../pc.ts";

export default class Serial extends NamedSegmentDevice {
	name = 'serial';
	type = DeviceType.segment_other
	constructor(addr: number) {
		super();
		this._segments.si = {
			start: addr,
			end: addr,
			set_value(_: number, value: number) {
				Deno.stdout.write(new Uint8Array([value]))
			}
		}
	}
}
