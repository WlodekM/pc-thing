0000-7FFF	- user memory
8000-9FFE	- bios ROM
9FFF 		- memory page (0-256)
A000-AFFF	- paged memory
B000-B0FF	- stack
B100 		- stack index
B101-B901	- segment definitions (64 of em)
B902 		- reset vector (defaults to 0x8000)
B902-B90a	- general purpose interrupt pointers (8 of em)
B90a-B910	- hw interrupt pointers (6 of em)
B910-DFFF	- device/segment space
F000-FFFF	- idk


segment device definition struct
{
	int			mode // bitfield, bit 0 is for read, 1 is for write, 2 is no segment, other is reserved
	char[27]	name
	int			interrupt // anything higher than 12 = no interrupts for this segment/device
	int			type
	int			start
	int			end
}
32 words
interrupt device definition struct
{
	int			mode = 0bXXXX_XXXX_XXXX_X100
	char[29]	name
	int			interrupt // anything higher than 12 = no interrupts for this segment/device
	int			type
}
32 words
