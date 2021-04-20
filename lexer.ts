import { string_init } from "./variables/strtype.ts";
import { function_init, FUNCTION_TEMP_STACK } from "./functiondefs/functions.ts";
import { bracer_master } from "./brace_logic.ts";
import { function_call_init } from "./functiondefs/functioncall.ts";
import { returns_init } from "./functiondefs/functionreturns.ts";
import int_init from "./variables/inttype.ts";
import { preprocessor_linker } from "./preprocessor/preprocessor.ts";

let FUNCTION_DEF_STACK:Array<any> = [];

let STRTYPE_DEF_STACK:Array<any> = [];
let INTTYPE_DEF_STACK:Array<any> = [];

let i:number;
let cont_exec:boolean = true;
let in_function:boolean = false;
let cur_func:any = undefined;

//**Parse data */
function lexer_exec(data:string, doc:string): void {
    const init_word = data.split(" ")[0].trim();
    if (init_word === "string") {
        string_init(data);
    } else if (init_word === "define") {
        function_init(data, doc);
        i = i + FUNCTION_TEMP_STACK - 1;
    } else if (init_word === "return") {
        if (in_function === true) {
            if (cur_func[2] === "void") throw "ParserError: Illegal return in voidtype function";
            else returns_init(cur_func, data);
        } else throw "ParserError: Invalid return";
    } else if (init_word === "int") {
        int_init(data);
    } else if (init_word.startsWith("#")) {
        preprocessor_linker(data);
    }

    else {
        if (cont_exec === true) {
            for (let i = 0; i < FUNCTION_DEF_STACK.length; i++) {
                if (init_word.trim().startsWith(FUNCTION_DEF_STACK[i][0].trim())) {
                    function_call_init(FUNCTION_DEF_STACK[i], data);
                    cont_exec = false;
                }
            }
        }
    }
}

//**Pass data to lexer */
function lexer_init(data: string, ...stacks:any): void {
    bracer_master(data);
    if (stacks[0] === "scope/func") {
        in_function = true;
        cur_func = stacks[1];
        FUNCTION_DEF_STACK = stacks[2];
        STRTYPE_DEF_STACK = stacks[3];
    }
    const content:string[] = data.split(";"); 
    content.pop();
    for (i = 0; i < content.length; i++) {
        lexer_exec(content[i].trim(), data.trim());
    }
}

export { lexer_init };
export { FUNCTION_DEF_STACK, STRTYPE_DEF_STACK, INTTYPE_DEF_STACK };
