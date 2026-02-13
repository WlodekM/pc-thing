// deno-lint-ignore-file no-process-globals no-node-globals
import sdl from '@kmamal/sdl';
import font from './font.js'
import { Buffer } from 'node:buffer'

/** @type {Uint8Array[]} */
const colors = [];
let l, r, g, b, c;
for (let i = 0; i < 16; i++) {
	l = +((i & 0b1000) != 0) * 0x55
	r = +((i & 0b0100) != 0) * 0xAA + l
	g = +((i & 0b0010) != 0) * 0xAA + l
	b = +((i & 0b0001) != 0) * 0xAA + l
	c = [r, g, b, 0xFF]
	colors.push(Uint8Array.from(c))
}

const [width, height] = [640, 480];

const screen_buffer = new Uint8Array(width * height * 4);

/** @returns {sdl.Sdl.Video.Window} */
function makeWindow() {
	const config = {
		title: "2616",
		width: width,
		height: height,
		// borderless: true,
		resizable: false,
		// skipTaskbar: true
		// alwaysOnTop: true,
		//flags: sdl.video.POPUP_MENU, // or POPUP_MENU
		// flags: 0x0000000040000000

	}
	if (sdl.video?.createWindow)
		return sdl.video?.createWindow(config)
	return new sdl.Window(config)
}
const sdl_window = makeWindow();

const stores = {}

class UI {
	static touching(x1, y1, x2, y2) {
		const [mx, my] = stores.cursor;
		if (mx < x1)
			return false;
		if (mx > x2)
			return false;
		if (my < y1)
			return false;
		if (my > y2)
			return false;
		return true
	}
}

const fontBits = font.map(rows => rows.map(row => [...Array(8)].map((_,i)=>row>>(7-i)&1)))
const background_buffer = new Uint8Array(width*height*4);
// 8x8, 4 colors, 4bpp, 16bit words 4 pixels per word, 16 words
// character word
// 
const character_memory = new Uint16Array(255*16);
const background = new Uint8Array(80*60*255);
export class Rendering {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {Uint8Array} sprite
	 * @param {number} spr_width
	 * @param {number} spr_height
	 */
	_blit(x, y, sprite, spr_width, spr_height) {
		const offset = (x + (y*width))*4
		for (let row = 0; row < spr_height; row++) {
			screen_buffer.set(sprite, row*spr_width*4+offset)
		}
	}
	_render_bg() {
		for (let i = 0; i < background.length; i++) {
			const idx = background[i]
			const character = [...character_memory.subarray(idx*16,(idx+1)*16)
				.map(c => colors[c])].flat();
			this._blit((i%80)*8, Math.floor(i / 80)*8, character, 8, 8)
		}
	}
	
	/**
	 * @param {string} char
	 * @param {number} x
	 * @param {number} y
	 */
	static char(char, x, y, color, background=byteColors.background) {
		let id = char.charCodeAt(0);
		if (id < 32 || id > 127)
			id = 63; // ?
		const charData = fontBits[id-32];
		// console.log(charData)
		
		//TODO: specified color
		// ctx.putImageData(charData, x, y)
		// fs.writeFileSync('char.bin', charData.data)
		// ctx.fillStyle = colors.foreground;
		for (let y_offset = 0; y_offset < charData.length; y_offset++) {
			const bits = charData[charData.length-y_offset-1];
			// const bits = fontBits;
			const thing = bits.map((bit,i) => {
				//TODO - fix
				if (background != 0xFFFF || bit)
					return bit ? colors[color] : colors[background];
				const sbi = (((y+y_offset)*width*4)+((x+i)*4));
				return screen_buffer.subarray(sbi, sbi+4)
			}).flat();
			// console.log(thing)
			screen_buffer.set(thing, (((y+y_offset)*width*4)+(x*4)))
			// for (let x_offset = 0; x_offset < 8; x_offset++) {
			// 	if (!bits[7-x_offset])
			// 		continue;
			// 	this.dot(x+x_offset,y+y_offset, color)
			// 	// ctx.fillRect(x+x_offset,y+y_offset,1,1);
			// }
		}
	}
	// /**
	//  * @param {string} text
	//  * @param {number} x
	//  * @param {number} y
	//  * @param {boolean} [wrap]
	//  * @param {[number, number, number, number] | "transparent"} background
	//  * @param {[number, number, number, number]} color
	//  * @returns {[number, number]}
	//  */
	// static text(text, x, y, color=byteColors.foreground, background=byteColors.background, wrap=false) {
	// 	let char_id = 0;
	// 	let x_offset = 0;
	// 	let y_offset = 0;
	// 	while (char_id < text.length) {
	// 		const char = text[char_id];
	// 		if (char == '\n') {
	// 			x_offset = 0;
	// 			y_offset++;
	// 			char_id++
	// 			continue;
	// 		}
	// 		if (char == '\t') {
	// 			x_offset += 8-(x_offset+1)%8;
	// 			char_id++
	// 			continue;
	// 		}
	// 		if (x + ((x_offset+1) * 9) >= width && wrap) {
	// 			x_offset = 0;
	// 			y_offset++;
	// 			char_id++
	// 			continue;
	// 		}
	// 		this.char(
	// 			char,
	// 			x + (x_offset*9), // 8 width + 1 px of padding
	// 			y + (y_offset*this.CHAR_HEIGHT),
	// 			color,
	// 			background
	// 		)
	// 		x_offset++
	// 		char_id++
	// 	}
	// 	return [x_offset+1, y_offset]
	// }
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} color 
	 */
	static dot(x, y, color) {
		if (x>=width||x<0||y>=height||y<0)
			return;
		screen_buffer.set(colors[color], ((y*width*4)+(x*4)))
	}
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width
	 * @param {number} color 
	 */
	static row(x, y, width, color) {
		if (x>=width||x<0||y>=height||y<0)
			return;
		screen_buffer.set(new Array(width).map(_=>color).flat(), ((y*width*4)+(x*4)))
	}
	/**
	 * @param {number} color 
	 */
	static fill(x1, y1, x2, y2, color) {
		const _x1 = Math.min(x1, x2)
		const _x2 = Math.max(x1, x2)
		const _y1 = Math.min(y1, y2)
		const _y2 = Math.max(y1, y2)
		for (let x = _x1; x < _x2; x++) {
			for (let y = _y1; y < _y2; y++) {
				this.dot(x, y, color)
			}
		}
	}
	static BG() {
		// ctx.fillStyle = colors.background
		// ctx.fillRect(0, 0, width, height)
		this.fill(0, 0, width, height, byteColors.background)
	}
	static line_bresenham(x0, y0, x1, y1, color) {
		let dx = x1 - x0
		let dy = y1 - y0
	
		const xsign = +(dx > 0) * 2 - 1
		const ysign = +(dy > 0) * 2 - 1
	
		dx = Math.abs(dx)
		dy = Math.abs(dy)
	
		let [xx, xy, yx, yy] = [0,0,0,0];
		if (dx > dy)
			[xx, xy, yx, yy] = [xsign, 0, 0, ysign]
		else {
			[dx, dy] = [dy, dx]
			[xx, xy, yx, yy] = [0, ysign, xsign, 0]
		}
	
		let D = 2*dy - dx
		let y = 0
	
		for (let x = 0; x < dx + 1; x++) {
			this.dot(x0 + x*xx + y*yx, y0 + x*xy + y*yy, color)
			if (D >= 0) {
				y += 1
				D -= 2*dx
			}
			D += 2*dy
		}
	}
	static line(x1, y1, x2, y2, color) {
		const dx = x1 - x2;
		const dy = y1 - y2;
		if (dx != 0 && dy != 0)
			return this.line_bresenham(x1, y1, x2, y2, color);
		if (dx) {
			const _x1 = Math.min(x1, x2)
			const _x2 = Math.max(x1, x2)
			for (let x = _x1; x < _x2; x++) {
				this.dot(x, y1, color)
			}
			return
		}
		const _y1 = Math.min(y1, y2)
		const _y2 = Math.max(y1, y2)
		for (let y = _y1; y < _y2; y++) {
			this.dot(x1, y, color)
		}
		return
	}
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {string} text 
	 * @returns {boolean}
	 */
	static button(x, y, text) {
		const text_length = 9 * text.length - 1;
		const touching = UI.touching(x,y,x+text_length+1, y+12);
		const button_color	= touching ? byteColors.background : byteColors.foreground;
		const button_color2	= touching ? byteColors.foreground : byteColors.background;
		this.line(x+1,				y+0,	x+text_length+1,	y+0,	button_color);
		this.line(x+1,				y+13,	x+text_length+1,	y+13,	button_color);
		this.line(x,				y+1,	x,					y+13,	button_color);
		this.line(x+text_length+1,	y+1,	x+text_length+1,	y+13,	button_color);
		this.fill(x+1,				y+1,	x+text_length+1,	y+13,	button_color);

		this.text(text,				x+1, y+1, button_color2, button_color)
		return touching && stores.mouse
	}
	static switch(x, y, value) {
		this.fill(x, y, x + 40, y + 16, byteColors.foreground)
		this.fill(x+1, y+1, x + 39, y + 15, byteColors.background)
		if (value)
			this.fill(x + 24, y+2, x + 38, y + 14, byteColors.foreground)
		else
			this.fill(x+2, y+2, x + 15, y + 14, byteColors.foreground)
	}
	static init() {
		// ctx.imageSmoothingEnabled = false;
	}
	static width = width
	static height = height
	static CHAR_HEIGHT = 14
	static CHAR_WIDTH = 9
	static UI = UI
}

// const stores = {
// 	page: "_default",
// 	cursor: [0, 0],
// 	mouse: false,
// 	keys: {},
// 	keys_pressed: {},
// 	logs: true,
// 	log_events: false,
// 	text_input: '',
// }

sdl_window.on("mouseMove", ({x, y}) => {
	// log(`${x}, ${y}`)
	// stores.cursor[0] = x;
	// stores.cursor[1] = y;
})

// sdl_window.on('*', (name, data) => {
// 	if (!stores.log_events) return;
// 	// console.log(name, data)
// 	log(`#${name} - ${JSON.stringify(data)}`)
// })

sdl_window.on('mouseButtonDown', () => stores.mouse = true);
sdl_window.on('mouseButtonUp', () => stores.mouse = false);
sdl_window.on('keyDown', ({key}) => {
	// stores.keys[key] = true;
	// stores.keys_pressed[key] = true

});
sdl_window.on('keyUp', ({key}) => {
	// stores.keys[key] = false
});
sdl_window.on('textInput', ({text}) => stores.text_input = text);

// let last = Math.round(Number(process.hrtime.bigint() / 1_000_000n));
// const targetFPS = 30;
// console.log('uh')
function render() {
	// const page = stores.page;
	// const t = Math.round(Number(process.hrtime.bigint() / 1_000_000n));
	// stores.t = t;
	// const delta = (t - last) / 1000;
	// if (delta < 1 / targetFPS) {
	// 	const r = Math.ceil(((1 / targetFPS) - delta) *1000);
	// 	// console.log(delta, 1/targetFPS, r)
	// 	return setTimeout(render, r)
	// }
	// last = t;
	// console.log('ye', fps);
	// (pages[page] ?? pages._default)(Rendering, stores, delta);
	// _common(Rendering, stores, delta)
	// console.log('uh')
	const buffer = Buffer.from(screen_buffer)
	// fs.writeFileSync('canvas.bin', buffer)
	sdl_window.render(width, height, width * 4, 'rgba32', buffer)
	// stores.keys_pressed = {};
	// stores.text_input = '';
	// setTimeout(render)
}

render()

console.log(colors)

import { NamedSegmentDevice, DeviceType, PC } from "../../pc.ts";

export default class GraphicsAdapter extends NamedSegmentDevice {
	name = 'serial';
	type = DeviceType.serial;
	bootable = false;
	interrupt = 50;
	//key: null | number = null;
	color = 0
	pos = [0,0]
	/** @param {PC} pc */
	handle_interrupt(pc) {
		console.log('int', pc.registers)
		switch (pc.registers[0]) {
			case 0:
				render()
				break;
			case 1:
				Rendering.dot(pc.registers[1], pc.registers[2], pc.registers[3])
				break;
			case 2:
				this.color = pc.registers[1]
				break;
			case 3:
				Rendering.line(pc.registers[1], pc.registers[2], ...this.pos, this.color);
				break;
			case 4:
				this.pos = [pc.registers[1], pc.registers[2]];
				break;
			case 5:
				Rendering.fill(pc.registers[1], pc.registers[2], ...this.pos, this.color);
				break;
			case 6:
				Rendering.char(String.fromCharCode(pc.registers[1]), ...this.pos, this.color, pc.registers[2]);
				break;
		
			default:
				break;
		}
	}
	constructor(addr,) {
		super();
		const device = this;
		this._segments.buff = {
			name: 'buff',
			start: addr,
			end: addr+(width*height),
			set_value(ad, value) {
				const o =  ad - addr;
				screen_buffer.set(colors[value], o)
			},
		}
	}
}

