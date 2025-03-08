# basic syntax

unlike 99.9% of assembly languages, in this one, arguments are separated by spaces (no comma), also indentation doesn't matter, neither do labels, the cpu starts executing from top to bottom, code also doesn't have to be in a label for it to be executed

example:

```asm
start:
    mov a 1   ; put 1 into the a register
    mov b 2   ; put 2 into the b register
    add       ; add registers a and b and put it in c
    str c 0   ; store c at address 0

    ld a 0    ; load address 0 into a
    mov b 14  ; put 14 into the b register
    mul
```

# list of cool features that come with the assembler

## code labels

code labels add a way for you to make jumps without constantly changing the destinations because they're tied to line numbers

example:
```asm
start:
    mov a 1 ; change the 1 to a 0 to change result
    cmp a 0
    jnz zero
    jmp one ; else, jump to one

    zero:
        halt ; if zero, halt
    
    one:
        jmp one ; if one, infinite loop
```

## macros

macros allow you to shorten how you do basic tasks (such as storing data in memory)

example:
```asm
.macro store(val, addr) \
    put a @val\
    str a @addr

store 1 0
store 2 1
store 2763 2
```

## labels

basically a mix of a macro and a code label

example:
```asm
.label one 1 ; one

mov a one ; one -> reg A
str a 0 ; reg A -> 0x0
```

## using code

`#using` allows you to include code from other files

example:
```asm
start:
    mov a -1 ; 65535
    str a 16 ; put our number into 16
    #using printer.a
    jmr print_num ; print number at 16 (well not print but stringify)
    mov a 1 ; syscall 1 - write
    mov b 1 ; fd 1 - stdout
    mov c 32 ; from address 32
    sys ; syscall
```
this will use printing code from `printer.a` to print the number 65535

## data

to insert data in your code (for example: a string) you can use the `.str` or `.hex` instruction(?) thingies

dunno how to call them, anyways, example

```asm
mov a 1 ; write
mov b 1 ; stdout
mov c [string]
sys
end

string:
.str "is your refrigerator running?"
```

oh and btw, if you're using a label to keep track of their location (actually, what else would you use), reference them by doing `[NAME]` instead of `NAME` because due to some jank with how the emulator/assembler/whatever works i needed to offset the location for `NAME` references for jump instructions to work

here's an example of using them as variable storage

```asm
init:
    mov a 1
    str a [counter]

increment:
    ld a [counter]
    mov b 1
    add
    str c [counter]

counter:
.hex 0
```

##

also i think raw code doesnt support indentation