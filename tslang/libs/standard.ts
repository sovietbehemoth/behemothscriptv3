import { STRTYPE_DEF_STACK, __DEBUG__, stackrm } from "../lexer.ts";
import { INTTYPE_DEF_STACK, ARRTYPE_DEF_STACK } from "../lexer.ts";
import { decode_value } from "../def.ts";
import { checkstr, eqparse, intparse } from "../variables/inttype.ts";
import { strparse } from "../variables/strtype.ts";

//**Send to standard out with formatted output, syntax identical to printf() in c */
async function stdout_format(str: string[]): Promise<number> {
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
                    const decoded_int = await intparse(ref_p);
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
    console.log(finalform.join("").trim().substring(1, finalform.join("").trim().length-1));
    if (__DEBUG__ === true) console.log(`Sent data to stdout`);
    return finalform.join("").trim().substring(1, finalform.join("").trim().length-1).length;
}

async function stdout(outliteral: string[]): Promise<number> {
    console.log(outliteral.join("").substring(1, outliteral.join("").length - 1));
    if (__DEBUG__ === true) console.log(`Sent data to stdout`);
    return outliteral.join("").length;
}

async function membat(array:any, index:any, type:string): Promise<any> {
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
            return mainarr[parseInt(index)];
        } else if (type === "int") {
            return mainarr[parseInt(index)];
        }
    } else throw "ParserError: Undefined reference to array";
}

//**Append item to array */
function arrappend(array:any, subject:any, type:string): void {
    for (let i = 0; i < ARRTYPE_DEF_STACK.length; i++) {
        if (ARRTYPE_DEF_STACK[i][1] === array.trim()) {
            if (ARRTYPE_DEF_STACK[i][2] === "string" && type === "str" && ARRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
                let located:boolean = false;
                if (subject.startsWith('"') && subject.endsWith('"')) {
                    let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                    membarray.push(subject.substring(1, subject.length - 1));
                    stackrm(ARRTYPE_DEF_STACK, i, "arr");
                    ARRTYPE_DEF_STACK.push([membarray, array.trim(), "string"]);
                } else {
                    for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                        if (STRTYPE_DEF_STACK[i2][1].trim() === subject.trim()) {
                            located = true;
                            let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                            membarray.push(STRTYPE_DEF_STACK[i2][0].trim());
                            stackrm(ARRTYPE_DEF_STACK, i, "arr");
                            ARRTYPE_DEF_STACK.push([membarray,array.trim(),"string"]);
                            break;
                        }
                    }
                }
                
            } else if (ARRTYPE_DEF_STACK[i][2] === "int" && type === "int" && ARRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
                let loc:boolean = false;
                if (checkstr(subject) === true) {
                    let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                    membarray.push(parseInt(subject));
                    stackrm(ARRTYPE_DEF_STACK, i, "arr");
                    ARRTYPE_DEF_STACK.push([membarray, array.trim(), "int"]);
                    loc = true;
                } else {
                    for (let i2 = 0; i2 < INTTYPE_DEF_STACK.length; i2++) {
                        if (INTTYPE_DEF_STACK[i2][1] === subject) {
                            let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                            membarray.push(INTTYPE_DEF_STACK[i2][0]);
                            stackrm(ARRTYPE_DEF_STACK, i, "arr");
                            ARRTYPE_DEF_STACK.push([membarray, array.trim(), "int"]);
                            loc = true;
                            break;
                        }
                    }
                    if (loc === false) {
                        let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                        membarray.push(eqparse(subject));
                        stackrm(ARRTYPE_DEF_STACK, i, "arr");
                        ARRTYPE_DEF_STACK.push([membarray, array.trim(), "int"]);
                    }
                }
            }
        }
    }
}

//**Returns the length of any array or string */
async function lengthof(array:any): Promise<number> {
    for (let i = 0; i < ARRTYPE_DEF_STACK.length; i++) {
        if (ARRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
            const len:any = ARRTYPE_DEF_STACK[i][0].length;
            return len;
        }
    }
    for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
        if (STRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
            const len:any = STRTYPE_DEF_STACK[i][0].length;
            return len;
        }
    }
    throw "ParserError: Undefined reference";
}

/**Casts integer to string and string to integer, actively modifies the stack. Appends new value to END of stack, it may be better practice to replace the value in its
current position although it SHOULDNT matter significantly.
*/
async function castingintstr(method:number, int?:any, str?:any): Promise<any> {
    let retval:any;
    if (method === 1) {
        retval = int[0].toString();
    } else if (method === 0) {
        if (checkstr(str.trim()) === true) {
            retval = parseInt(str.trim());
        } else throw "ParserError: Char values that are alphabetic are not permitted to be integers";
    }
    if (__DEBUG__ === true) console.log(`Casted type`);
    return retval;
}

/**Concatate subject onto destination */
async function strconcat(destination:any, subject:any): Promise<any> {
    if (!destination.includes("\"") && !destination.includes("(")) {
        for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
            if (STRTYPE_DEF_STACK[i][1].trim() === destination.trim()) {
                const def:string = STRTYPE_DEF_STACK[i][0];
                await stackrm(STRTYPE_DEF_STACK,i,"str");
                STRTYPE_DEF_STACK.push([def+await strparse(subject,false),destination.trim()]);
                return def+await strparse(subject,false);
            }
        }
    } else { 
        const decoded_dest:any = await strparse(destination,false);
        const decoded_subj:any = await strparse(subject,false);
        return decoded_dest+decoded_subj;
    }
}

async function interns_switch(name:any, args:any):Promise<any> {
    switch (name) {
        case "print":
            return await stdout_format(args);
            break;
        case "printl":
            return await stdout(args);
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
            const strindex:any = args[1].trim();
            await membat(strarray, strindex, "str");
            break;
        case "intmemb":
            const intarray:any = args[0].trim()
            const intindex:any = args[1].trim();
            await membat(intarray, intindex, "int");
            break;
        
        case "strappend":
            const strarr:any = args[0].trim();
            const strsubject:any = args[1].trim()
            arrappend(strarr, strsubject, "str");
            break;
        case "intappend":
            const intarr:any = args[0].trim();
            const intsubject:any = args[1].trim();
            arrappend(intarr, intsubject, "int");
            break;

        case "lengthof":
            const anyarr:any = args[0].trim();
            return await lengthof(anyarr);
            break;

        case "strconcat":
            const dest:any = args[0].trim();
            const appt:any = args[1].trim();
            return await strconcat(dest,appt);
            break;
    }
}

export { interns_switch };