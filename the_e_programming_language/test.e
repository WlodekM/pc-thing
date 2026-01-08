__asm__(".offset 0x1000")
int stdout@0x1000
char ch = 97
// int i = 0
// char[1024] in

fn _start {
// 	__asm__("mov a 0
// mov b 0
// mov c ", in, "
// sys")
	//while (ch < 104) {
	//	stdout = ch
	//	ch = ch + 1
	//}
	stdout = 10
	while (1) {
		stdout = ch
		ch = ch + 1
		if (ch == 0x7F) {
			ch = 0x20
		}
	}
}
