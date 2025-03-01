# list of cool features that come with the assembler

## code labels

code labels add a way for you to make jumps without constantly changing the destinations because they're tied to line numbers

example:
```
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
```
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
```
.label one 1 ; one

mov a one ; one -> reg A
str a 0 ; reg A -> 0x0
```

## using code

#using allows you to include code from other files

example:
```
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

##

also i think raw code doesnt support indentation