int mem = 0
int stdout@0x1000
char ch = 97

fn test {
	stdout = 0x62
}

fn _start {
    mem = 21
    mem = 30
    while (ch > 104) {
        stdout = ch
        ch = ch + 1
    }
    stdout = 0x21
}
