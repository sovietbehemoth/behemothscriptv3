import { STRTYPE_DEF_STACK, __DEBUG__, stackrm } from "../lexer.ts";
import { INTTYPE_DEF_STACK, ARRTYPE_DEF_STACK } from "../lexer.ts";
import { decode_value } from "../def.ts";
import { checkstr } from "../variables/inttype.ts";

//**Send to standard out with formatted output, syntax identical to printf() in c */
async function stdout_format(str: string[]): Promise<void> {
    if (__DEBUG__ === true) console.log(`Formatting output for stdout`);
    const content:string = str[0];
    const refsarray:string[] = str.splice(1);
    let string_frmt = [];
    let refs_c:number = 0;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "%" && content[i-1] != "\\" && refsarray.length>0) {
            const ref_p:string = refsarray[refs_c];
            switch (content[i+1]) {
                case "s":
                    const decoded_value = decode_value(ref_p, "string");
                    string_frmt.push(decoded_value);
                    i = i+1;
                    break;
                case "c":
                    break;
                case "d":
                    const decoded_int = decode_value(ref_p, "int");
                    string_frmt.push(decoded_int.toString());
                    i = i+1;
                    break;
                case "r":
                    break;
                default: 
                    throw "ParserError: Invalid reference type"
                    break;
            }
            refs_c = refs_c+1;
        } else string_frmt.push(content[i]);
    }

    //Check for escapes
    let regex:string = string_frmt.join("").trim();
    let finalform:string[] = [];
    for (let i = 0; i < regex.length; i++) {
        if (regex[i] === "\\" && regex[i-1] !== "\\" || regex[i+1] === "n" && regex[i] === "\\") {
            if (regex[i+1] === "n" && regex[i-2] !== "\\") {
                finalform.push("\n");
                i = i + 1;
            }
            continue;
        } else finalform.push(regex[i]);
    }
    //send to stdout
    console.log(finalform.join("").trim());
    if (__DEBUG__ === true) console.log(`Sent data to stdout`);
}

function stdout(outliteral: string[]): void{
    console.log(outliteral.join(""));
    if (__DEBUG__ === true) console.log(`Sent data to stdout`);
}

function membat(array:any, ref:any, index:any, type:string) {
    let indexxed:boolean = false;
    let vartype:Array<any> = [];
    for (let i = 0; i < ARRTYPE_DEF_STACK.length; i++) {
        if (array === ARRTYPE_DEF_STACK[i][1].trim()) {
            indexxed = true;
            vartype = ARRTYPE_DEF_STACK[i];
            break;
        }
    }
    if (indexxed === true) {
        const mainarr:Array<any> = vartype[0];
        if (type === "str") {
            for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
                if (STRTYPE_DEF_STACK[i][1] === ref.trim()) {
                    stackrm(STRTYPE_DEF_STACK, i, "str");
                    STRTYPE_DEF_STACK.push([mainarr[parseInt(index)], ref]);
                    break;
                }
            }
        } else if (type === "int") {
            for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
                if (INTTYPE_DEF_STACK[i][1] === ref.trim()) {
                    stackrm(INTTYPE_DEF_STACK, i, "int");
                    INTTYPE_DEF_STACK.push([mainarr[parseInt(index)], ref]);
                    break;
                }
            }
        }
    } else throw "ParserError: Undefined reference to array";
}

function strappend(args: any): void {

}


/*Casts integer to string and string to integer, actively modifies the stack. Appends new value to END of stack, it may be better practice to replace the value in its
current position although it SHOULDNT matter significantly.
*/
async function castingintstr(method:number, int?:any, str?:any): Promise<void> {
    if (method === 1) {
        const inttarget:Array<any> = INTTYPE_DEF_STACK[INTTYPE_DEF_STACK.indexOf(int)];
        stackrm(inttarget, INTTYPE_DEF_STACK.indexOf(int), int);
        STRTYPE_DEF_STACK.push([int[0].toString(), int[1]]);
    } else if (method === 0) {
        const strtarget:Array<any> = STRTYPE_DEF_STACK[STRTYPE_DEF_STACK.indexOf(str)];
        stackrm(strtarget, STRTYPE_DEF_STACK.indexOf(str), str);
        if (checkstr(str.trim()) === true) {
            INTTYPE_DEF_STACK.push([parseInt(str.trim()), str[1]]);
        } else throw "ParserError: Char values that are alphabetic are not permitted to be integers";
    }
    if (__DEBUG__ === true) console.log(`Casted type`);
}

async function interns_switch(name:any, args:any):Promise<void> {
    switch (name) {
        case "print":
            await stdout_format(args);
            break;
        case "printl":
            stdout(args);
            break;
        
        case "convits":
            //console.log(args);
            const int:any = args[0].trim();
            for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
                if (INTTYPE_DEF_STACK[i][1] === int) {
                    castingintstr(1, INTTYPE_DEF_STACK[i], "");
                }
            }
            break;
        case "convsti":
            //console.log(args)
            const str:any = args[0].trim();
            for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
                if (STRTYPE_DEF_STACK[i][1] === str) {
                    castingintstr(1, 1, STRTYPE_DEF_STACK[i]);
                }
            }
            break;


        case "strmemb":
            const strarray:any = args[0].trim();
            const strref:any = args[1].trim();
            const strindex:any = args[2].trim();
            membat(strarray, strref, strindex, "str");
            break;
        case "intmemb":
            const intarray:any = args[0].trim()
            const intref:any = args[1].trim();
            const intindex:any = args[2].trim();
            membat(intarray, intref, intindex, "int");
    }
}

export { interns_switch };
