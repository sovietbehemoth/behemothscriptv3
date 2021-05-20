#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    char READ[100000];
    char command[1000];
    snprintf(command, 1000, "make FILE=%s",argv[1]);
    FILE* output;
    output = popen(command,"w");
    fscanf(output,"%s",READ);
    printf("%s",READ);
    pclose(output);
}