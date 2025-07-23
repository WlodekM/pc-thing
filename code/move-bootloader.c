#define codeStart 900

int main() {
    // set up stack
    *(volatile unsigned char *)0x7000 = 0x6000;
    volatile unsigned char* codePointer = 0;
    while ()
    {
        volatile unsigned char* targetPointer = 0x6000 + codePointer;
    }
}