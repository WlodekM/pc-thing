// deno-lint-ignore-file no-this-alias
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

enum DeviceType {
	// segment devices
	mem_chip	= 0x01,
	rom			= 0x02,
	disk		= 0x03,

	// interrupt devices
	clock		= 0x81,
}

export abstract class SegmentDefinition {
	pc?: PC = undefined as unknown as PC;
	abstract start: number;
	abstract end: number;
	get_value?: (addr: number) => number;
	set_value?: (addr: number, value: number) => void;
}
export class Segment {
	pc: PC;
	start: number;
	end: number;
	get_value?: (addr: number) => number;
	set_value?: (addr: number, value: number) => void;
	constructor(pc: PC, defintion: SegmentDefinition) {
		this.pc = pc;
		this.start = defintion.start
		this.end = defintion.end
		this.get_value = defintion.get_value
		this.set_value = defintion.set_value
	}
}

abstract class Device {
	abstract type: DeviceType
	abstract name: string
}

export interface InterruptDevice extends Device {
	interrupt: number
	type: DeviceType
}
export interface SegmentDevice extends Device {
	type: DeviceType
	segments: SegmentDefinition[]
}

abstract class NamedSegmentDevice implements SegmentDevice {
	_segments: Record<string, SegmentDefinition> = {}
	abstract type: DeviceType;
	abstract name: string;
	get segments(): SegmentDefinition[] {
		return Object.values(this._segments)
	}
}

export class MemoryDevice extends NamedSegmentDevice {
	start: number;
	size: number;
	mem: Uint16Array;
	type = DeviceType.mem_chip;
	name = 'mem'
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

type Registers = [number, number, number, number]
export class PC {
	registers: Registers = new Array<number>(4).fill(0) as Registers
	regNames: string = 'abcd'
	halted: boolean = false
	//mem = new Array<number>(2**16).fill(0)
	stack_pointer: number = 0
	stack_index: number = 0
	segments: Record<string, Segment> = {}
	interrupt_devices: Record<string, InterruptDevice> = {}
	devices: Record<string, SegmentDevice | InterruptDevice> = {}
	add_device(device: SegmentDevice | InterruptDevice) {
		const id = Object.keys(this.devices).reduce((p,c)=>p+ +(c.startsWith(device.name)),0)
		this.devices[`${device.name}${id}`] = device;
		if ((device as SegmentDevice).segments) {
			let i = 0
			for (const segment_definition of (device as SegmentDevice).segments) {
				const segment = new Segment(this, segment_definition)
				this.segments[`${device.name}${id}s${i}`] = segment
				i++
			}
		} else if ((device as InterruptDevice).interrupt) {
			this.interrupt_devices[`${device.name}${id}i`] = device as InterruptDevice
		}
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
	    if (addr < 0 || addr > 2**16)
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
		if (!this.stack_pointer) throw 'no stack pointer';
		if (this.stack_index == 256) throw 'stack overflow';
		this.setMem(this.stack_pointer + this.stack_index, v)
		this.stack_index++;
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
        status.setBit(0, num > 0xFF || num < 0)
        status.setBit(7, (num & 0x80) != 0);
        status.setBit(1, num == 0);
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
		/*0x18:*/	'jz',
		/*0x19:*/	'ret',
		/*0x1a:*/	'rti',
		/*0x1b:*/	'cpy',
		/*0x1c:*/	undefined,
		/*0x1d:*/	undefined,
		/*0x1e:*/	undefined,
        /*0x1f:*/	'end',
	]
}
