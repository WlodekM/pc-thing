int mem = 0
int stdout@0x1000

fn _start {
    mem = 21
    mem = 30
    stdout = 97
	test()    
}

fn test {
	stdout = 0x62
}
