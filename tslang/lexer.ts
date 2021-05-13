import { string_init } from "./variables/strtype.ts";
import { function_init, FUNCTION_TEMP_STACK } from "./functiondefs/functions.ts";
import { bracer_master } from "./brace_logic.ts";
import { function_call_init, interns_call, cur_func } from "./functiondefs/functioncall.ts";
import { returns_init } from "./functiondefs/functionreturns.ts";
import {int_init,intparse} from "./variables/inttype.ts";
import { preprocessor_linker } from "./preprocessor/preprocessor.ts";
import { array_init } from "./variables/arrtype.ts";
import { for_init, LOOP_TEMP_STACK } from "./loops/forloops.ts";
import { isfunction } from "./def.ts";
import { class_init, master_class, class_master_creator, CLASS_TEMPORARY_DATA } from "./variables/classtype.ts";
import { conditional_statement_init, else_if_conditional_statement_init, else_conditional_statement_init, CONDITIONAL_TEMPORARY_STACK } from "./conditions/ifstatements.ts";
import { restrict_init,typedef_init,typecall_init,typedef_access_init } from "./variables/typedef.ts";

type intentions = "main"|"forloop"|"function"|"ifstatement"|"elsestatement"|"elifstatement"|"class"|"method";

//**Stack containing all functions */
let FUNCTION_DEF_STACK:Array<any> = [];

//**Stack containing all strings */
let STRTYPE_DEF_STACK:Array<any> = [];

//**Stack containing all integers */
let INTTYPE_DEF_STACK:Array<any> = [];

//**Stack containing all imports */
let IMPORT_DEF_STACK:Array<any> = [];

//**Stack containing all arrays */
let ARRTYPE_DEF_STACK:Array<any> = [];

//**Function return stack */
let RETURNSTACK_ARR:Array<any> = [];

//**Type restriction stack */
let RESTRICT_TYPE_STACK:Array<any> = [];

//**Typedef struct stack */
let TYPEDEF_STRUCT_STACK:Array<any> = [];

//**Class stack */
let CLASSTYPE_DEF_STACK:Array<master_class> = [];

//**Object stack */
let OBJECTTYPE_DEF_STACK:Array<any> = [];

//**Current functions return value */
let CURFUNC_RETURN_VALUE:any = undefined;

let __DEBUG__:boolean = false;

//**Current position in execution */
let i:number;

//**Continue execution? */
let cont_exec:boolean = true;

//**Determines whether this is a function */
let in_function:boolean = false;

//**Keep stdin active */
let STDIN_ACTIVE_PREP_FEED:boolean = false;

//**Effectively modify a stack */
async function stackrm(stack:Array<any>, pos:number, stackd:string): Promise<void> {
    const modstack:Array<any> = [];
    for (let i = 0; i < stack.length; i++) {
        if (i !== pos) modstack.push(stack[i]);
    }
    if (stackd === "int") INTTYPE_DEF_STACK = modstack;
    else if (stackd === "str") STRTYPE_DEF_STACK = modstack;
    else if (stackd === "func") FUNCTION_DEF_STACK = modstack;
    else if (stackd === "arr") ARRTYPE_DEF_STACK = modstack;
    else if (stackd === "obj") OBJECTTYPE_DEF_STACK = modstack;
}

/**Initialize preprocessor. Always executes before rest of code. Like C this means ALL 
 * preprocessors are executed regardless of position in code.
*/
async function preprocessor_header_execution(raw:string[]): Promise<void> {
    if (__DEBUG__ === true) console.log("Executing preprocessors...");
    for (i = 0; i < raw.length; i++) {
        const data:string = raw[i].trim();
        const init_word = data.split(" ")[0].trim();
        if (init_word.startsWith("#")) {
            if (init_word.trim() === "#debug") __DEBUG__ = true;
            await preprocessor_linker(data);
        }
    }
    i = 0;
    if (__DEBUG__ === true) console.log(`Finished preprocessor execution`);
}

//**Parse data */
async function lexer_exec(data:string, doc:string, intent:intentions): Promise<void> {
    const init_word = data.split(" ")[0].trim();
    //String init
    if (init_word === "string") {
        await string_init(data, false);
    //Function init
    } else if (init_word === "define") {
        await function_init(data, doc);
        i = i + FUNCTION_TEMP_STACK - 1;
    //Integer init
    } else if (init_word === "int") {
        await int_init(data);
    //Literal init, Literal strings have no referencing capabilities
    } else if (init_word === "literal") {
        const shiftforlit:string = data.split("literal")[1].trim();
        await string_init(shiftforlit, true);
    //Master array initializer
    } else if (init_word === "array") {
        array_init(data);
    } else if (init_word === "for") {
        await for_init(data, doc);
        i = i + LOOP_TEMP_STACK - 1;
    } else if (init_word === "if") {
        await conditional_statement_init(data, doc);
        i = i + CONDITIONAL_TEMPORARY_STACK - 1;
    } else if (init_word === "elif") {
        await else_if_conditional_statement_init(data, doc);
        i = i + CONDITIONAL_TEMPORARY_STACK - 1;
    } else if (init_word === "else") {
        await else_conditional_statement_init(data, doc);
        i = i + CONDITIONAL_TEMPORARY_STACK - 1;
    } else if (init_word === "class") {
        await class_init(data, doc);
        i = i + CLASS_TEMPORARY_DATA - 1;
    } else if (init_word === "object") {
        await class_master_creator(data,doc);
    } else if (init_word === "restrict") {
        await restrict_init(data);
    } else if (init_word === "typedef") {
        i = i + await typedef_init(data,doc) - 1;
    } else if (init_word.startsWith("*")) {
        await typecall_init(data);
    }
    else if (!init_word.startsWith("#") && init_word !== undefined) {
        if (cont_exec === true) {
            if (FUNCTION_DEF_STACK.length > 0 && await isfunction(data) === true) {
                for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                    //console.log(init_word.trim() + " vs " + FUNCTION_DEF_STACK[i2][0].trim())
                    //Function calls
                    if (init_word.trim().split("(")[0] === FUNCTION_DEF_STACK[i2][0].trim()) {
                        await function_call_init(FUNCTION_DEF_STACK[i2], data);
                        cont_exec = false;
                        break;
                    } 
                }
            } 
        }
        if (INTTYPE_DEF_STACK.length > 0 && cont_exec === true) {
            for (let i2 = 0; i2 < INTTYPE_DEF_STACK.length; i2++) {
                if (init_word.trim().split("=")[0].trim() === INTTYPE_DEF_STACK[i2][1].trim()) {
                    const appendval:string = data.split("=")[1].trim();
                    //console.log(await intparse(appendval));
                    INTTYPE_DEF_STACK.push([await intparse(appendval), data.trim().split("=")[0].trim()]);
                    await stackrm(INTTYPE_DEF_STACK, i2, "int");
                }
            }
        }
        if (OBJECTTYPE_DEF_STACK.length > 0 && cont_exec === true && init_word.includes("->")) {
            for (let i2 = 0; i2 < OBJECTTYPE_DEF_STACK.length; i2++) {
                console.log(OBJECTTYPE_DEF_STACK[i2][0].trim(), init_word.split("->")[0].trim());
                if (OBJECTTYPE_DEF_STACK[i2][0].trim() === init_word.split("->")[0].trim()) {
                    await typedef_access_init(data,OBJECTTYPE_DEF_STACK[i2]);
                }
            }
        }
        if (OBJECTTYPE_DEF_STACK.length > 0 && cont_exec === true && init_word.includes(".")) {
            for (let i2 = 0; i2 < OBJECTTYPE_DEF_STACK.length; i2++) {
                if (OBJECTTYPE_DEF_STACK[i2].type === "classinit") {
                    if (OBJECTTYPE_DEF_STACK[i2].name === init_word.split(".")[0].trim()) {
                        for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK.length; i3++) {
                            //console.log(OBJECTTYPE_DEF_STACK[i3].class);
                            if (CLASSTYPE_DEF_STACK[i3].name.trim() === OBJECTTYPE_DEF_STACK[i2].class.name.trim()) {
                                const call:string = init_word.split(".").slice(1).join("");
                                if (await isfunction(call) === true) {
                                    const methods:Array<any> = CLASSTYPE_DEF_STACK[i3].members.method;
                                    for (let i4 = 0; i4 < methods.length; i4++) {
                                        if (methods[i4].methodname.trim() === call.split("(")[0].trim()) {
                                            if (methods[i4].role === "public") {
                                                let instr: any = false;
                                                let argarray: Array<any> = [];
                                                let curmemb:any = [];
                                                let dataf:string = data.substring(data.indexOf("(")+1,data.lastIndexOf(')'));
                                                for (let i5 = 0; i5 < dataf.length; i5++) {
                                                    if (dataf[i5] === '"' && instr === "false") {
                                                        curmemb.push(dataf[i5]);
                                                        instr = "true";
                                                    } else if (dataf[i5] === '"' && instr === "true") {
                                                        curmemb.push(dataf[i5]);
                                                        instr = "false";
                                                    } else if (dataf[i5] === "," && instr === "false") {
                                                        argarray.push(curmemb.join("").trim());
                                                        curmemb = [];
                                                        instr = "false";
                                                        continue;
                                                    } else curmemb.push(dataf[i5]);
                                                } argarray.push(curmemb.join("").trim());
                                                let argarrcount:number = 0;
                                                if (methods[i4].params[0].trim() !== "void") {
                                                    for (let i5 = 0; i5 < methods[i4].params.length; i5++) {
                                                        const param:string = methods[i4].params[i5];
                                                        //console.log(methods[i4].params);
                                                        const type:string = param.split(" ")[0].trim();
                                                        const name:string = param.split(" ")[1].trim();
                                                        if (type === "string") await lexer_exec(`literal string ${name} = ${argarray[i5]};\n`,doc,"method");
                                                        else await lexer_exec(`${param} = ${argarray[i5]};\n`,doc,"method");
                                                    }
                                                }
                                                const method_len:number = methods[i4].execution.split(";").length;
                                                const method_exec:any = methods[i4].execution.split(";");
                                                for (let i5 = 0; i5 < method_len; i5++) {
                                                    await lexer_exec(method_exec[i5],doc,"method");
                                                }
                                                
                                            } else throw "ParserError: Illegal access of private method";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        cont_exec=true;
    }
}

let contloop:any = false;

//**Pass data to lexer */
async function lexer_init(data: string, ...stacks:any): Promise<void> {
    //Calculate brace logic
    bracer_master(data);
    const content:string[] = data.split(";"); 
    if (in_function === true) console.log(data);
    content.pop();
    await preprocessor_header_execution(content);
    const execute = (async() => {
        if (__DEBUG__ === true) console.log(`Executing main file contents...`);
        for (i = 0; i < content.length; i++) {  
            await lexer_exec(content[i].trim(), data.trim(), "main");
        }
        in_function = false;
    });
    await execute();
    if (__DEBUG__ === true) console.log(`Finished compilation of ${i} items`);
    //console.log(INTTYPE_DEF_STACK);
}

export { lexer_init, lexer_exec, stackrm, __DEBUG__ };
export { FUNCTION_DEF_STACK, STRTYPE_DEF_STACK, INTTYPE_DEF_STACK, IMPORT_DEF_STACK, ARRTYPE_DEF_STACK, 
         RETURNSTACK_ARR, STDIN_ACTIVE_PREP_FEED, CLASSTYPE_DEF_STACK, OBJECTTYPE_DEF_STACK, TYPEDEF_STRUCT_STACK, RESTRICT_TYPE_STACK };