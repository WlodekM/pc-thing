0000-7FFF	- user memory
8000-9FFE	- bios ROM
9FFF 		- memory page (0-256)
A000-AFFF	- paged memory
B000-B0FF	- stack
B100 		- stack index
B101-B901	- segment definitions (64 of em)
B902 		- reset vector (defaults to 0x8000)
B902-B982	- general purpose interrupt pointers (128 of em)
B980-BA00	- hw interrupt pointers (125(?) of em)
BA00-DFFF	- device/segment space
F000-FFFF	- idk



device definition struct
{
	int			mode = 0bXXXX_XXXX_XXXB_1000
	int			index
	char[14]	name
	int			type
	int			definition_count
	int[14]		definitions
}
segment device definition struct
{
	// bitfield, bit 0 is for read, 1 is for write, 2 is no segment, 3 is device defition, 4 is bootable, other is reserved
	int			mode
	int			index
	char[28]	name
	int			type
	int			start
	int			end
}
32 words
interrupt device definition struct
{
	int			mode = 0bXXXX_XXXX_XXXX_X100
	int			index
	char[29]	name
	int			type
	int			interrupt // anything higher than 255 = no interrupts for this segment/device
}
32 words
