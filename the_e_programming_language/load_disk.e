int			stdout@0x1000
int			block@0x6000
char[512]	block_data@0x6001
char		prog@0x5000
int			zeros = 0
int			ptr = 0
int			block_offset = 0
int			offset = 0
int			sdout@0x1000
char		running = 1
int			i@0x9000 = 0
int			end@0x9001
int			ram@0

fn cleanup {
	// set end to *running
	__asm__("mov a ", running, "
mov b ", end, "
str b a")
	while (i < end) {
		ram[i] = 0
		i = i + 1
	}
}

fn _start {
	stdout = 0x21
	while (running) {
		stdout = 0x28
		ptr = 0
		block_offset = block*512
		zeros = 0
		while (ptr != 512) {
			offset = block_offset + ptr
			prog[offset] = block_data[ptr]
			if (block_data[ptr] == 0) {
				zeros = zeros + 1
				stdout = 0x2e
			}
			if (block_data[ptr] != 0) {
				stdout = 0x30
			}
			ptr = ptr + 1
		}
		if (zeros > 511) {
			running = 0
		}
		stdout = 0x29
		block = block + 1
	}
	stdout = 0x23
	stdout = 0x0a
	cleanup()
	__asm__("mov a 0", prog, "
jmp a")
}
