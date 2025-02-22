#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define INPUT_FILE "riscv.rom"
#define OUTPUT_FILE "riscv.bin"

void process_file() {
    FILE *input = fopen(INPUT_FILE, "r");
    FILE *output = fopen(OUTPUT_FILE, "wb");
    
    if (!input || !output) {
        perror("Error opening file");
        exit(EXIT_FAILURE);
    }
    
    char line[16]; // Buffer for each number (assuming numbers are not too large)
    while (fgets(line, sizeof(line), input)) {
        // Remove CRLF (if present)
        size_t len = strlen(line);
        if (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r')) {
            line[--len] = '\0';
        }
        if (len > 0 && (line[len - 1] == '\r')) {
            line[--len] = '\0';
        }
        
        // Convert number and write as byte
        int value = atoi(line);
        uint8_t byte = (uint8_t)value;
        fwrite(&byte, sizeof(uint8_t), 1, output);
    }
    
    fclose(input);
    fclose(output);
    printf("Successfully processed %s -> %s\n", INPUT_FILE, OUTPUT_FILE);
}

int main() {
    process_file();
    return 0;
}
