# instructions

the base instruction set (some instructions may be undocumented)

| opcode  |   name	|
| :------- | ------	|
|	0x00    |	halt	|
|	0x01    |	mov		|
|	0x02    |	str		|
|	0x03    |	ld		|
|	0x04    |	push	|
|	0x05    |	pop		|
|	0x06    |	add		|
|	0x07    |	sub		|
|	0x08    |	mul		|
|	0x09    |	div		|
|	0x0a    |	not		|
|	0x0b    |	and		|
|	0x0c    |	or		|
|	0x0d    |	xor		|
|	0x0e    |	mod		|
|	0x0f    |	shr		|
|	0x10    |	shl		|
|	0x11    |	swp		|
|	0x12    |	zr		|
|	0x13    |	jz		|
|	0x14    |	undefined	|
|	0x15    |	int		|
|	0x16    |	jmp		|
|	0x17    |	jmr		|
|	0x18    |	jnz		|
|	0x19    |	ret		|
|	0x1a    |	rti		|
|	0x1b    |	cpy		|
|	0x1c    |	popi		|
|	0x1d    |	undefined		|
|	0x1e    |	undefined		|
|	0x1f    |	stop		|

table of contents:
 - [ADD](#add)
 - [AND](#and)
 - [CMP](#cmp) <!-- TODO: remove this -->
 - [CPY](#cpy)
 - [DIV](#div)
 - [HALT](#halt)
 - [INT](#int)
 - [JMP](#jmp)
 - [JMR](#jmr)
 - [JNZ](#jnz)
 - [JZ](#jz) <!-- TODO: document this -->
 - [LD](#ld)
 - [MOD](#mod)
 - [MOV](#mov)
 - [MUL](#mul)
 - [NOT](#not)
 - [OR](#or)
 - [POP](#pop)
 - [POPI](#popi)
 - [PUSH](#push)
 - [RET](#ret)
 - [RTI](#rti)
 - [SHL](#shl)
 - [SHR](#shr)
 - [SMM](#smm) <!-- TODO: document this -->
 - [STR](#str)
 - [SUB](#sub)
 - [SWP](#swp)
 - [XOR](#xor)
 - [ZR](#zr)

## ADD

add

usage:
```
add [r1] (r2) (r3)
```

adds registers `(r2)` and `(r3)` and puts the output in `[r1]`

## AND

logical AND

usage:
```
and [r1] (r2) (r3)
```

logical AND's registers `(r2)` and `(r3)` and puts the output in `[r1]`

## CMP

compare

usage:
```
cmp [r1] (r2) (r3)
```

compares registers `(r2)` and `(r3)` and puts the output in `[r1]`

the comparison is done by subtracting `(r3)` from `(r2)`

bit 0 of the output is set if the result of the subtraction is larger than 0xFFFF or less than 0

bit 1 of the output is set if the result of the subtraction is 0

bit 2 of the output is set if the result of the subtraction is more than 0

for legacy reasons, bit 7 of the output is set if the result of the subtraction is less than 0

## CPY

copy memory

usage:
```
cpy (r1) (r2) (r3)
```

copies `(r3)` words from address at `(r1)` to address at `(r2)`

## DIV

divide

usage:
```
div [r1] (r2) (r3)
```

divides register `(r2)` by `(r3)` and puts the output in `[r1]`

## FLG

flag

usage:
```
flg [r1] (r2)
```

flags `(r2)` and puts the output in `[r1]`

bit 0 of the output is set if `(r2)` is larger than 0xFFFF or less than 0

bit 1 of the output is set if `(r2)` is 0

bit 2 of the output is set if `(r2)` is more than 0

for legacy reasons, bit 7 of the output is set if `(r2)` is less than 0

## HALT

halt

usage:
```
halt
```

halts the cpu, which exits the emulator

## INT

interrupt

usage:
```
int (r1)
```

triggers interrupt `(r1)`

## JMP

unconditional jump

usage:
```
jmp (r1)
```

jumps to address `(r1)`

## JMR

jump to subroutine

usage:
```
jmr (r1)
```

jumps to address `(r1)` whilst adding the previous value of PC to the return stack

## JNZ

jump if non-zero

usage:
```
jnz (r1) (r2)
```

jumps to address `(r1)` if `(r2)` isnt zero

## LD

load from memory

usage:
```
ld [r1] (r2)
```

loads word at address `(r2)` from memory into `[r1]`

## MOD

modulus

```
mod [r1] (r2) (r3)
```

`[r1]` = `(r2)` % `(r3)`

## MOV

move into register

```
mov [r1] (r2)
```

moves `(r2)` into `(r1)`

## MUL

multiply

usage:
```
mul [r1] (r2) (r3)
```

multiplies registers `(r2)` and `(r3)` and puts the output in `(r1)`


## NOT

logical NOT

usage:
```
not [r1] (r2)
```

logical NOT's register `(r2)` and puts the output in `(r1)`

## OR

logical OR

usage:
```
or [r1] (r2) (r3)
```

logical OR's registers `(r2)` and `(r3)` and puts the output in `(r1)`

## POP

pop from stack

```
pop [r1]
```

pops an item from the stack and puts it in register `(r1)`

## POPI

pop index(?)

```
popi [r1] (r2)
```

gets the `(r2)`th value of the stack and puts it in `[r1]`

## PUSH

push to stack

```
push (r1)
```

pushes `(r1)` to stack

## RET

return

```
ret
```

pops a value from the return stack and jumps to it

## RTI

return from interrupt

usage:
```
rti
```

basically,
```ts
this.programPointer		= this.pop();
this.registers[0]/*A*/	= this.pop();
this.registers[1]/*B*/	= this.pop();
this.registers[2]/*C*/	= this.pop();
this.registers[3]/*D*/	= this.pop();
```

## SHL

shift left

```
shl [r1] (r2)
```

shifts the bits in register `[r1]` to the left by `(r2)`

## SHR

shift right

```
shr [r1] (r2)
```

shifts the bits in register `[r1]` to the right by `(r2)`

## SUB

subtract

usage:
```
sub (r1) (r2) (r3)
```

subtracts registers `(r2)` and `(r3)` and puts the output in `(r1)`

## SWP

swap registers

```
swp (r1) (r2)
```

swaps `(r2)` and `(r1)`

## XOR

logical XOR

usage:
```
xor (r1) (r2) (r3)
```

logical XOR's registers `(r2)` and `(r3)` and puts the output in `(r1)`

## ZR

zero

```
zr [r1] (r2)
```

if `(r2)` is 0, `[r1]` is set to 1, otherwise -- 0

