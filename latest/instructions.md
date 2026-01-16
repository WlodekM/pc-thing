# instructions

the base instruction set (some instructions may be undocumented)

table of contents:
 - [ADD](#add)
 - [AND](#and)
 - [CMP](#cmp)
 - [CPY](#cpy)
 - [DIV](#div)
 - [HALT](#halt)
 - [INT](#int)
 - [JMP](#jmp)
 - [JMR](#jmr)
 - [JNZ](#jnz)
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
 - [STR](#str)
 - [SUB](#sub)
 - [SWP](#swp)
 - [XOR](#xor)
 - [ZR](#zr)

## ADD

add

usage:
```
add (r1) (r2) (r3)
```

adds registers `(r2)` and `(r3)` and puts the output in `(r1)`

## AND

logical AND

usage:
```
and (r1) (r2) (r3)
```

logical AND's registers `(r2)` and `(r3)` and puts the output in `(r1)`

## CMP

compare

usage:
```
cmp (r1) (r2) (r3)
```

compares registers `(r2)` and `(r3)` and puts the output in `(r1)`

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

copies `(r3)` words from `(r1)` to `(r2)`

## DIV

divide

usage:
```
div (r1) (r2) (r3)
```

divides register `(r2)` by `(r3)` and puts the output in `(r1)`

## FLG
## HALT
## INT
## JMP
## JMR
## JNZ
## LD
## MOD
## MOV

## MUL

multiply

usage:
```
mul (r1) (r2) (r3)
```

multiplies registers `(r2)` and `(r3)` and puts the output in `(r1)`

## NOT
## OR
## POP
## POPI
## PUSH
## RET
## RTI
## SHL
## SHR

## SUB

subtract

usage:
```
sub (r1) (r2) (r3)
```

subtracts registers `(r2)` and `(r3)` and puts the output in `(r1)`

## SWP
## XOR
## ZR
