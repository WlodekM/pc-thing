int stdout@0x1000
char ch = 97
int i = 0
char[1024] in

fn _start {
	__asm__("mov a 0
mov b 0
mov c ", in, "
sys")
	//while (ch < 104) {
	//	stdout = ch
	//	ch = ch + 1
	//}
	stdout = 10
	while (in[i] != 0) {
		stdout = in[i]
		i = i + 1
		//ch = in[i]
	}
}
