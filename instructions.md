# instructions

the base instruction set (some instructions may be undocumented)

table of contents:
 - [ADD](#add)
 - [AND](#and)
 - [CLR](#clr)
 - [CMP](#cmp)
 - [CMR](#cmr)
 - [CRR](#crr)
 - [DBG](#dbg)
 - [DIV](#div)
 - [HALT](#halt)
 - [JMP](#jmp)
 - [JMR](#jmr)
 - [JNZ](#jnz)
 - [JNZR](#jnzr)
 - [JZ](#jz)
 - [LD](#ld)
 - [LDM](#ldm)
 - [LDR](#ldr)
 - [MOD](#mod)
 - [MOV](#mov)
 - [MUL](#mul)
 - [NOT](#not)
 - [OR](#or)
 - [PUT](#put)
 - [RET](#ret)
 - [SHL](#SHL)
 - [SHR](#SHR)
 - [SRM](#srm)
 - [SRR](#srr)
 - [STR](#str)
 - [SUB](#sub)
 - [SWP](#swp)
 - [SWPM](#swpm)
 - [SYS](#sys)
    + [read (0)](#read-0)
    + [write (1)](#read-1)
    + [set raw (2)](#set-raw-2)
 - [XOR](#xor)

## ADD

add

usage:
```
add
```

adds registers `a` and `b` and puts the output in `c`

## AND

bitwise and

usage:
```
and
```

bitwise and's registers `a` and `b` and puts the output in `c`


## CLR

clear return buffer

usage:
```
clr
```

pops the most recent value from the return stack

## CMP

compare

usage:
```
cmp (reg1) (value)
```

compares reg1 and value, if equal, sets return flag to 1, else sets it to 0

## CMR

compare register

usage:
```
cmr (reg1) (reg2)
```

compares reg1 and reg2, if equal, sets return flag to 1, else sets it to 0

## CRR

compare register register

usage:
```
cmr (reg1) (reg2) (reg3)
```

compares reg2 and reg3, if equal, sets reg1 1, else sets it to 0

## DBG

debug

usage:
```
dbg (breakpoint name)
```

dumps ram and halts executing until the user presses enter

## DIV

divide

usage:
```
div
```

divides register `a` by register `b` and stores output in `c`, the output is floored

## HALT

halt

usage:
```
halt
```

halts the CPU

## JMP

jump

usage:
```
jmp (line)
```

jumps to line

## JMR

jump with return

usage:
```
jmp (line)
```

same as jump, but adds the original line to the return stack

## JNZ

jump if non-zero

usage:
```
jnz (line)
```

jump to line if the return flag is not zero

## JNZR

jump if non-zero compare (deprecated)

usage:
```
jnzr (reg1) (reg2)
```

jumps to line at reg1 if reg2 is not zero, deprecated, use [`jnz`](#jnz) and [`cmp`](#cmp) instead

## JZ

jump if zero

usage:
```
jnz (line)
```

jump to line if the return flag is zero

## LD

load from memory

usage:
```
ld (reg) (addr)
```

loads data at address addr into register reg

## LDM

load from memory from memory (deprecated)

usage:
```
ldm (reg) (addr)
```

loads data at address at address addr into register reg, deprecated, use [`ld`](#ld) and [`ldr`](#ldr) instead

## LDR

load from memory at register

usage:
```
ld (reg1) (reg2)
```

loads data at address at reg1 into register reg2

## MOD

modulo

usage:
```
mod
```

does the modulo operation on `a` and `b` and stores in `c`

## MOV

see [`put`](#put)

## MUL

multiply

usage:
```
mul
```

multiplies `a` by `b` and stores in `c`

## NOT

bitwise not

usage:
```
not
```

bitwise not's register `a` and puts the output in `c`

## OR

bitwise or

usage:
```
or
```

bitwise or's registers `a` and `b` and puts the output in `c`

## PUT

put

usage:
```
put (reg) (num)
```

puts num in register reg

## RET

return

usage:
```
ret
```

returns to last value in return stack

## SHL

shift left

usage:
```
shl (reg) (by)
```

shifts the value of `reg` to the left by `by`

## SHR

shift right

usage:
```
shr (reg) (by)
```

shifts the value of `reg` to the right by `by`

## SRM

deprecated

im too lazy to document this, basically the [`ldm`](#ldm) of [`str`](#str), use [`srr`](#srr) instead

## SRR

store register

usage:
```
srr (reg1) (reg2)
```

store value of reg1 at address in reg2

## STR

store

usage:
```
srr (reg1) (addr)
```

store value of reg1 at address addr

## SUB

subtract

usage:
```
sub
```

subtracts register `b` from register `a` and puts the output in `c`

## SWP

swap

usage:
```
swp (reg1) (reg2)
```

swaps registers reg1 and reg2

## SWPM

swap memory

usage:
```
swp (reg1) (reg2)
```

swaps addresses at reg1 and at reg2

## SYS

syscall

usage:
```
sys (syscall_id) (...args)
```

syscall, used for interacting with the system

NOTE: the arguments for the syscall are stored in the registers `a` `b` and `c`, not in the instruction call

syscalls:

### read (0)

```
sys 0 (fd) (addr)
```

reads data from file descriptor fd and puts it in ram, starting with addr, the data is null (0x00) terminated

the most common file descriptor you'll see is 0, stdin

also sets register `a` to the length of the read input

### write (1)

```
sys 1 (fd) (addr)
```

write data starting from addr (null-terminated) into file descriptor fd

### set raw (2)

```
sys 1 (raw?)
```

set tty raw mode

## XOR

bitwise exclusive or

usage:
```
xor
```

bitwise xor's registers `a` and `b` and puts the output in `c`