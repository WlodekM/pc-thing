// deno-lint-ignore-file no-this-alias prefer-const
import Stack from "./devices/stack.ts";
import * as lib from "./lib.ts";
export class BitField {
    bits: boolean[];
    flip(bit: number) {
        this.bits[bit] = !this.bits[bit];
    }
    bit(bit: number) {
        return this.bits[bit]
    }
    setBit(bit: number, value: boolean) {
        this.bits[bit] = value;
    }
    set(value: number) {
        for (let bit = 0; bit < this.bits.length; bit++) {
            const mask: number = 1 << bit;
            this.setBit(bit, (value & mask) != 0)
        }
    }
    num(): number {
        let number = 0;
        for (let bit = 0; bit < this.bits.length; bit++) {
            const mask: number = 1 << bit;
            if (this.bits[bit])
                number |= mask;
        }
        return number;
    }
    constructor (len: number) {
        this.bits = new Array(len).fill(false);
    }
}

export class Register<T=number> extends BitField {
    get value(): number {
        return this.num()
    }
    set value(value: number) {
        this.set(value)
    }
    increment(): number {
        this.set(this.num() + 1);
        return this.num()
    }
    decrement(): number {
        this.set(this.num() - 1);
        return this.num()
    }
    constructor(bits: number) {
        super(bits);
    }
}

export enum DeviceType {
	// segment devices
	mem_chip		= 0x01,
	rom				= 0x02,
	disk			= 0x03,
	stack			= 0x04,
	
	other_segment	= 0x7f,
	// interrupt devices
	clock			= 0x80,

	other_int		= 0x9f,
	//both interrupt and segment
	serial			= 0xa1,

	//device devices
	stack_device	= 0x100,
	disk_device		= 0x101,
}

export abstract class SegmentDefinition {
	pc?: PC = undefined as unknown as PC;
	abstract start: number;
	abstract end: number;
	get_value?: (addr: number) => number;
	set_value?: (addr: number, value: number) => void;
	// bootable?: boolean;
	abstract type?: DeviceType;
}
export class Segment {
	pc: PC;
	start: number;
	end: number;
	name: string;
	//bootable: boolean = false;
	get_value?: (addr: number) => number;
	set_value?: (addr: number, value: number) => void;
	constructor(pc: PC, definition: SegmentDefinition&{name:string}) {
		this.pc = pc;
		this.start = definition.start;
		this.end = definition.end;
		this.get_value = definition.get_value;
		this.set_value = definition.set_value;
		// this.bootable = definition.bootable ?? false;
		this.name = definition.name;
	}
}

export abstract class Device {
	abstract type: DeviceType
	abstract name: string
	abstract bootable: boolean
	pc?: PC = undefined as unknown as PC;
}

export interface InterruptDevice extends Device {
	interrupt: number
	type: DeviceType
	bootable: boolean
	handle_interrupt: (pc: PC)=>void
}
export interface SegmentDevice extends Device {
	type: DeviceType
	segments: (SegmentDefinition&{name:string})[]
	bootable: boolean
}

export abstract class NamedSegmentDevice implements SegmentDevice {
	_segments: Record<string, SegmentDefinition> = {}
	abstract type: DeviceType;
	abstract name: string;
	abstract bootable: boolean;
	abstract interrupt?: number;
	get segments(): (SegmentDefinition&{name:string})[] {
		return Object.entries(this._segments)
			.map(([name, seg]) => ({name,...seg}))
	}
}

export class MemoryDevice extends NamedSegmentDevice {
	start: number;
	size: number;
	mem: Uint16Array;
	type = DeviceType.mem_chip;
	bootable = false;
	name = 'mem'
	interrupt = undefined;
	constructor(start: number, size: number) {
		super();
		const device = this;
		this._segments.mem = {
			start: start,
			end: start + size,
			get_value(addr: number) {
				return device.mem[addr - device.start]
			},
			set_value(addr: number, value: number) {
				device.mem[addr - device.start] = value
			}
		}
		this.start = start;
		this.size = size;
		this.mem = new Uint16Array(size)
	}
}

interface MemoryMode {
	offset: number,
	size: number
}

type Registers = [number, number, number, number, number]
export class PC {
	registers: Registers = [0,0,0,0,0x2000] as Registers
	regNames: string[] = ['a','b','c','d','sp']
	halted: boolean = false
	//mem = new Array<number>(2**16).fill(0)
	stack_pointer: number = 0
	stack_index: number = 0
	segments: Record<string, Segment> = {}
	interrupt_devices: Record<number, InterruptDevice> = {}
	devices: Record<string, SegmentDevice | InterruptDevice> = {}
	stack_device?: Stack;
	device_structs: Uint16Array[] = [];

	default_mmode: MemoryMode = {
		offset: 0,
		size: 0xFFFF
	}
	memory_mode: MemoryMode = this.default_mmode

	generate_device_struct(device: SegmentDevice | InterruptDevice): void {
		//let structs: Uint16Array = [];
		let device_struct = new Array(32).fill(0);
		const id = Object.keys(this.devices).reduce((p,c)=>p+ +(c.startsWith(device.name)),0)
		const te = new TextEncoder();
		device_struct[0] = 0b1000 | ((+device.bootable) << 5)
		device_struct[1] = this.device_structs.length;
		let n = te.encode(`${device.name}${id}d`);
		device_struct.splice(2, 14, ...new Array(14).fill(0).map((_,i)=>n[i]))
		device_struct[15] = device.type
		device_struct[16] = 0
		//NOTE - fucky: reserve an index for the device to later overwrite
		let idx = this.device_structs.length
		this.device_structs.push(undefined as unknown as Uint16Array)
		//var definitions = []
		if (typeof (device as SegmentDevice).segments !== 'undefined') {
			let i = 0;
			for (const segment of (device as SegmentDevice).segments) {
				let n = te.encode(`${device.name}${segment.name??i}s`);
				let definition = [
					(+!!segment.get_value) | (+!!segment.get_value << 1) | 4,
					this.device_structs.length,
					...new Array(28).fill(0).map((_,i)=>n[i]),
					segment.type ?? device.type,
					segment.start,
					segment.end
				]
				device_struct[device_struct[16]++ +17] = this.device_structs.length;
				this.device_structs.push(new Uint16Array(definition.flat()));
				i++;
			}
		}
		if ((device as InterruptDevice).interrupt) {
			let dev = device as InterruptDevice;
			let n = te.encode(`${device.name}${id}i`);
			let definition = [
				4,
				this.device_structs.length,
				...new Array(29).fill(0).map((_,i)=>n[i]),
				dev.type,
				dev.interrupt,
			]
			device_struct[device_struct[16]++ +17] = this.device_structs.length;
			this.device_structs.push(new Uint16Array(definition.flat()));
			//this.interrupt_devices[] = device as InterruptDevice
		}
		this.device_structs[idx] = new Uint16Array(device_struct.flat());
	}

	add_device(device: SegmentDevice | InterruptDevice) {
		const id = Object.keys(this.devices).reduce((p,c)=>p+ +(c.startsWith(device.name)),0)
		//console.log(device)
		device.pc = this
		this.devices[`${device.name}${id}`] = device;
		if ((device as SegmentDevice).segments) {
			let i = 0
			for (const segment_definition of (device as SegmentDevice).segments) {
				const segment = new Segment(this, segment_definition)
				this.segments[`${device.name}${id}s${i}`] = segment
				i++
			}
			if (device.type == DeviceType.stack) {
				this.stack_device = device as Stack
			}
		}
		if ((device as InterruptDevice).interrupt) {
			this.interrupt_devices[(device as InterruptDevice).interrupt] = device as InterruptDevice
		}
		this.generate_device_struct(device)
	}
	interrupt(id: number, b: number = 0, c: number = 0, d: number = 0) {
		if (this.interrupt_devices[id])
			return this.interrupt_devices[id].handle_interrupt(this)
		id &= 0xFF;
		const vector = this.getMem(0xb902+id);
		//console.log(`int`, id, b, c, d, ':', vector)
		if (vector == 0) return;
		this.push(this.registers[3]);
		this.push(this.registers[2]);
		this.push(this.registers[1]);
		this.push(this.registers[0]);
		this.registers[0] = id;
		this.registers[1] = b;
		this.registers[2] = c;
		this.registers[3] = d;
		this.push(this.programPointer);
		this.programPointer = vector;
		this.memory_mode = this.default_mmode;
	}
	find_segment(addr: number): Segment | undefined {
		for (const segment_name in this.segments) {
			const segment = this.segments[segment_name];
			if (addr < segment.start)
				continue;
			if (addr > segment.end)
				continue;
			return segment;
		}
	}
	getMem(addr: number): number {
		addr += this.memory_mode.offset
	    if (addr < 0 || addr > this.memory_mode.size)
	        throw 'invalid address';
		const segment = this.find_segment(addr);
		if (segment)
			return segment.get_value ? segment.get_value.call(this,addr) : 0;
	    return 0;
	}
	setMem(addr: number, data: number) {
	   	const segment = this.find_segment(addr);
	   	if (segment)
	   		return segment.set_value ? segment.set_value.call(this,addr, data) : 0;
	    //this.mem[addr] = Math.floor(data) % 2**16
	}
    push(v: number) {
    	// const sp = this.registers[4];
    	// const so = this.getMem(sp) + 1;
    	// this.setMem(so+sp, v);
    	// this.setMem(sp, so);
    	if (!this.stack_device) throw 'no stack device';
		//if (!this.stack_pointer) throw 'no stack pointer';
		//if (this.stack_index == 256) throw 'stack overflow';
		this.stack_device.push(v)
	}
    pop(offset: number=0): number {
       	// const sp = this.registers[4];
       	// const so = this.getMem(sp) + 1;
       	// return this.getMem(so+sp+offset);
       	// if (!offset)
       	// 	this.setMem(sp, so-1);
    	if (!this.stack_device) throw 'no stack device';
		return this.stack_device.pop(offset)
	}
    // status: Register<8>				= new Register(8);
    //!SECTION
    //SECTION - status reg bits
	//	get carry(): boolean			{return this.status.bit(0)}
	//	get zero(): boolean				{return this.status.bit(1)}
	//	get IRQBDisable(): boolean		{return this.status.bit(2)}
	//	get decimalMode(): boolean		{return this.status.bit(3)}
	//	get BRK(): boolean				{return this.status.bit(4)}
	//	// ...1... //
	//	get overflow(): boolean			{return this.status.bit(6)}
	//	get negative(): boolean			{return this.status.bit(7)}
	//	
	//	set carry(value:boolean)		{this.status.setBit(0, value)}
	//	set zero(value:boolean)			{this.status.setBit(1, value)}
	//	set IRQBDisable(value:boolean)	{this.status.setBit(2, value)}
	//	set decimalMode(value:boolean)	{this.status.setBit(3, value)}
	//	set BRK(value:boolean)			{this.status.setBit(4, value)}
	//	// ...1... //
	//	set overflow(value:boolean)		{this.status.setBit(6, value)}
	//	set negative(value:boolean)		{this.status.setBit(7, value)}
    //!SECTION
    flagZN() {
        // this.negative = (num & 0x80) != 0;
        // this.zero = num == 0;
		throw 'deprecated: PC.flagZN'
    }
    flagZCN(num: number, set: boolean = true): number {
		if (set)
			throw 'deprecated: PC.flagZCN(any, true)'
        const status = new BitField(8);
        status.setBit(0, num > 0xFFFF || num < 0);
        status.setBit(1, num == 0);
        status.setBit(2, num > 0);
        status.setBit(7, num < 0 || ((num & 0x80) != 0));
        return status.num()

    }
    programPointer: number = 0;
    lib = lib
    returnFlag = 0;
    returnStack: number[] = []
    // the instruction set, in no particular order :3
    instructions: (string|undefined)[] = [
		/*0x00:*/	'halt',
		/*0x01:*/	'mov',
		/*0x02:*/	'str',
		/*0x03:*/	'ld',
		/*0x04:*/	'push',
		/*0x05:*/	'pop',
		/*0x06:*/	'add',
		/*0x07:*/	'sub',
		/*0x08:*/	'mul',
		/*0x09:*/	'div',
		/*0x0a:*/	'not',
		/*0x0b:*/	'and',
		/*0x0c:*/	'or',
		/*0x0d:*/	'xor',
		/*0x0e:*/	'mod',
		/*0x0f:*/	'shr',
		/*0x10:*/	'shl',
		/*0x11:*/	'swp',
		/*0x12:*/	'zr',
		/*0x13:*/	'flg',
		/*0x14:*/	'cmp',
		/*0x15:*/	'int',
		/*0x16:*/	'jmp',
		/*0x17:*/	'jmr',
		/*0x18:*/	'jnz',
		/*0x19:*/	'ret',
		/*0x1a:*/	'rti',
		/*0x1b:*/	'cpy',
		/*0x1c:*/	'popi',
		/*0x1d:*/	undefined,
		/*0x1e:*/	undefined,
        /*0x1f:*/	'end',
	]
}
