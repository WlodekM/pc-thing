import { NamedSegmentDevice, DeviceType } from "../pc.ts";
import readline from 'node:readline'
import process from 'node:process'

export default class Serial extends NamedSegmentDevice {
	name = 'serial';
	type = DeviceType.serial;
	bootable = false;
	interrupt = 10;
	//key: null | number = null;
	constructor(addr: number, inp = false) {
		super();
		const device = this;
		console.log(inp)
		if (inp) {
			readline.emitKeypressEvents(process.stdin);
			if (process.stdin.isTTY)
				process.stdin.setRawMode(true);
			process.stdin.on('keypress', (key: string, s: any) => {
				console.log(s.name, key)
				if (key == undefined) {
					if (s.name == 'escape') {
						process.stdin.destroy()
						device.pc.halted = true
						//process.exit(0)
						return;
					}
					else return;
				}
				//device.key = 0x0;
				console.log('i', 10, key.charCodeAt(0))
				device.pc.interrupt(10, key.charCodeAt(0))
			})
		}
		this._segments.serial = {
			name: 'serial',
			start: addr,
			end: addr,
			set_value(_: number, value: number) {
				process.stdout.write(String.fromCharCode(value))
			},
			get_value(_: number) {
				return 0x0
			}
		}
	}
}
