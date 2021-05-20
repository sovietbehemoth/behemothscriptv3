import { STRTYPE_DEF_STACK, __DEBUG__, stackrm, errorf } from "../lexer.ts";
import { INTTYPE_DEF_STACK, ARRTYPE_DEF_STACK, FUNCTION_DEF_STACK } from "../lexer.ts";
import { decode_value } from "../def.ts";
import { checkstr, eqparse, intparse } from "../variables/inttype.ts";
import { strparse } from "../variables/strtype.ts";
import { OBJECTTYPE_DEF_STACK } from "../lexer.ts";
import { PRINT_ERROR_ON_VOID_REF } from "../INITFLAGS.js";

interface file_object {
    path: string,
    intent: string
}

//**Send to standard out with formatted output, syntax identical to printf() in c */
async function stdout_format(str: string[], data:any): Promise<number> {
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
                    const decoded_value = await strparse(ref_p, true);
                    if (decoded_value === undefined && PRINT_ERROR_ON_VOID_REF === true) await errorf("", "Strtype is not interchangeable with type void", content[i]+content[i+1]);
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
                    await errorf(data, "Invalid reference type", "%"+content[i+1]);
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

/**Print literal to stdout (no formatting) */
async function stdout(outliteral: string[]): Promise<number> {
    console.log(await strparse(outliteral.join(""),true));
    if (__DEBUG__ === true) console.log(`Sent data to stdout`);
    return outliteral.join("").length;
}

//**Retrieve array member at index */
async function membat(array:any, index:any, data:any): Promise<any> {
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
        const ind:number = await intparse(index);
        if (ind > mainarr.length) await errorf(data, "Array index out of bounds", index);
        return mainarr[ind];
    } else await errorf(data, "Undefined reference to array", array);
}

//**Append item to array */
function arrappend(array:any, subject:any): void {
    for (let i = 0; i < ARRTYPE_DEF_STACK.length; i++) {
        if (ARRTYPE_DEF_STACK[i][1] === array.trim()) {
            if (ARRTYPE_DEF_STACK[i][2] === "string" && ARRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
                let located:boolean = false;
                if (subject.startsWith('"') && subject.endsWith('"')) {
                    let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                    membarray.push(subject.substring(1, subject.length - 1));
                    stackrm(ARRTYPE_DEF_STACK, i, "arr");
                    ARRTYPE_DEF_STACK.push([membarray, array.trim(), "string"]);
                    return;
                } else {
                    for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                        if (STRTYPE_DEF_STACK[i2][1].trim() === subject.trim()) {
                            located = true;
                            let membarray:Array<any> = ARRTYPE_DEF_STACK[i][0];
                            membarray.push(STRTYPE_DEF_STACK[i2][0].trim());
                            stackrm(ARRTYPE_DEF_STACK, i, "arr");
                            ARRTYPE_DEF_STACK.push([membarray,array.trim(),"string"]);
                            return;
                            break;
                        }
                    }
                }
                
            } else if (ARRTYPE_DEF_STACK[i][2] === "int" && ARRTYPE_DEF_STACK[i][1].trim() === array.trim()) {
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
                        return;
                    }
                }
            }
        }
    }
}

//**Returns the length of any array or string */
async function lengthof(array:any, data:any): Promise<number> {
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
    await errorf(data, "Undefined reference", array);
    return -1;
}

/**Casts integer to string and string to integer, actively modifies the stack. Appends new value to END of stack, it may be better practice to replace the value in its
current position although it SHOULDNT matter significantly.
*/
async function castingintstr(method:number, int?:any, str?:any, data?:any): Promise<any> {
    let retval:any;
    if (method === 1) {
        retval = int[0].toString();
    } else if (method === 0) {
        if (checkstr(str.trim()) === true) {
            retval = parseInt(str.trim());
        } else errorf(data, "Char values that are alphabetic are not permitted to be integers", str.trim());
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

/**Write to specified stream/pipe */
async function fprintf(stream: string, buffer: string): Promise<void> {
    switch (await strparse(stream,true)) {
        case "stdout":
            await Deno.stdout.write(new TextEncoder().encode(await strparse(buffer,true)));
            break;
        case "stderr":
            await Deno.stderr.write(new TextEncoder().encode(await strparse(buffer,true)));
            break;
    }
}

//**Non class member fopen */
async function fopen(path:string, intent:string, data:any): Promise<any> {
    switch (intent.trim()) {
        case "r": break;
        case "w": break;
        case "rw": break;
        default: await errorf(data, "Invalid file intent", intent.trim()); break;
    } const stream:file_object = {
        path: path,
        intent: intent
    }; return stream;
}

//**Close file stream */
async function fclose(handler:string, data:any): Promise<number> {
    for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
        if (OBJECTTYPE_DEF_STACK[i].type === "fs") {
            if (OBJECTTYPE_DEF_STACK[i].name.trim() === handler.trim()) {
                await stackrm(OBJECTTYPE_DEF_STACK,i,"obj");
                return 0;
            }
        } 
    }
    await errorf(data, "File handler not found", handler);
    return 1;
}

//**Scan a files contents, buffer length required */
async function fbuffer_scan(path: string, buffer_size: any, data:any): Promise<any> {
    //console.log(`|${await strparse(path,true)}|`);
    let buffer:any;
    try {
        buffer = await Deno.readTextFile(await strparse(path.trim(), true));
    } catch (error) {
        await errorf(data, "File not found", path.trim());
    }
    if (buffer.length > await intparse(buffer_size)) await errorf(data, "Buffer overflow (size exceeds expectations)", "buffer)");
    else return buffer;
}

//**Non strict file read */
async function read_file(path: string, data: any): Promise<any> {
    let buffer:any;
    try {
        buffer = await Deno.readTextFile(await strparse(path.trim(), true));
    } catch (error) {
        await errorf(data, "File not found", path.trim());
    }
    return buffer;
}

//**Compare strings, 0 if true 1 if false. Will translate to the *bool type restriction */
async function strcmp(str1: string, str2: string): Promise<any> {
    const parse1:string = await strparse(str1,true);
    const parse2:string = await strparse(str2,true);
    if (parse1 === parse2) return 0;
    else if (parse1 !== parse2) return 1;
}

//**Print a variables contents */
async function printv(variable:string): Promise<any> {
    for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
        if (variable === STRTYPE_DEF_STACK[i][1].trim()) {
            console.log(STRTYPE_DEF_STACK[i][0]);
            return;
        }
    }
    for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
        if (variable === INTTYPE_DEF_STACK[i][1].trim()) {
            console.log(INTTYPE_DEF_STACK[i][0].toString());
            return;
        }
    }
    for (let i = 0; i < FUNCTION_DEF_STACK.length; i++) {
        if (variable === FUNCTION_DEF_STACK[i][0].trim()) {
            console.log(`name: ${FUNCTION_DEF_STACK[i][0].trim()}\nparams: ${"[ " + FUNCTION_DEF_STACK[i][1].join() + " ]"}\ntype: ${FUNCTION_DEF_STACK[i][2].trim()}`);
            return;
        }
    }
    for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
        if (variable === OBJECTTYPE_DEF_STACK[i].name.trim()) {
            console.log(`name: ${OBJECTTYPE_DEF_STACK[i].name}\ntype: ${OBJECTTYPE_DEF_STACK[i].type}`);
            console.log(OBJECTTYPE_DEF_STACK[i].class.members.string)
            return;
        }
    }
}

//**Switch which hard coded function */
async function interns_switch(name:any, args:any, data:any):Promise<any> {
    switch (name) {
        case "print":
            return await stdout_format(args,data);
            break;
        case "printl":
            return await stdout(args);
            break;
        case "printv":
            const varselect:any = args[0].trim();
            return await printv(varselect);
            break;

        case "fprintf":
            const streamf:string = args[0].trim();
            const bufferf:string = args[1].trim();
            await fprintf(streamf, bufferf);
            break;
        case "fopen":
            const fpath:string = args[0].trim();
            const fintentf:string = args[1].trim();
            return await fopen(fpath, fintentf, data);
            break;
        case "fclose":
            const fhandler:string = args[0].trim();
            return await fclose(fhandler, data);
            break;
        case "fbuffer_scan":
            const fpathf:string = args[0].trim();
            const buffer_size:string = args[1].trim();
            return await fbuffer_scan(fpathf, buffer_size, data);
            return 
            break;
        case "file_read":
            const file_path:string = args[0].trim();
            return await read_file(file_path, data);
            break;
        
        case "convits":
            //console.log(args);
            const int:any = args[0].trim();
            for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
                if (INTTYPE_DEF_STACK[i][1] === int) {
                    castingintstr(1, INTTYPE_DEF_STACK[i], "", data);
                }
            }
            break;
        case "convsti":
            //console.log(args)
            const str:any = args[0].trim();
            for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
                if (STRTYPE_DEF_STACK[i][1] === str) {
                    castingintstr(0, 1, STRTYPE_DEF_STACK[i][1], data);
                }
            }
            break;


        case "member":
            const strarray:any = args[0].trim();
            const strindex:any = args[1].trim();
            return await membat(strarray, strindex, data);
            break;
        
        case "append":
            const sarr:any = args[0].trim();
            const ssubject:any = args[1].trim()
            await arrappend(sarr, ssubject);
            break;

        case "lengthof":
            const anyarr:any = args[0].trim();
            return await lengthof(anyarr, data);
            break;

        case "strconcat":
            const dest:any = args[0].trim();
            const appt:any = args[1].trim();
            return await strconcat(dest,appt);
            break;
        case "strcmp":
            const str1:any = args[0].trim();
            const str2:any = args[1].trim();
            return await strcmp(str1, str2);
            break;
    }
}

export { interns_switch };