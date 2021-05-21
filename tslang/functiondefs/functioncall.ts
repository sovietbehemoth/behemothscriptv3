import { lexer_init, lexer_exec, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK, INTTYPE_DEF_STACK, ARRTYPE_DEF_STACK, IMPORT_DEF_STACK, __DEBUG__ } from "../lexer.ts";
import { interns_switch } from "../libs/standard.ts";

import { strparse } from "../variables/strtype.ts";
import { intparse } from "../variables/inttype.ts";

let cur_func:any = undefined;

//**Check if internal */
function isinternal(name:string):boolean {
    switch (name) {
        case "print": return true; break;
        case "printl": return true; break;
        case "printv": return true; break;
        case "printj": return true; break;
        case "sprint": return true; break;

        case "fprintf": return true; break;
        case "fopen": return true; break;
        case "fclose": return true; break;
        case "fbuffer_scan": return true; break;
        case "file_read": return true; break;

        case "class_to_json_string": return true; break;
        case "json_to_class": return true; break;

        case "convsti": return true; break;
        case "convits": return true; break;

        case "member": return true; break;
        case "append": return true; break;

        case "lengthof": return true; break;

        case "strconcat": return true; break;
        case "strcmp": return true; break;

        default: return false; break;
    }
}



//**Format for call (params, name, return, etc) */
async function interns_call(name:string, data:string):Promise<void> {
    let instr:any = "";
    instr = "false";
    const args:any = data.split("(")[1].split(")").join("").trim();
    let argarray:any = [];
    let typearr:any = [];
    if (!args.length) {
        await interns_switch(name, ["void"], data);
    } else {
        let curmemb:any = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '"' && instr === "false") {
                curmemb.push(args[i]);
                instr = "true";
            } else if (args[i] === '"' && instr === "true") {
                curmemb.push(args[i]);
                instr = "false";
            } else if (args[i] === "," && instr === "false") {
                argarray.push(curmemb.join("").trim());
                curmemb = [];
                instr = "false";
                continue;
            } else curmemb.push(args[i]);
        }
        argarray.push(curmemb.join("").trim())
        return await interns_switch(name, argarray, data);
    }
}

/**Call function and return value, undefined if void */
async function function_call_init(func:Array<any>, content:string):Promise<any> {
    let retval:any
    let poporders:any = [];
    if (__DEBUG__ === true) console.log(`Calling function '${func[0].trim()}'`);
    if (isinternal(func[0].trim()) === false) {
        let exec:string = "";
        if (func[1][0] != "void") {
            let argcount:number=0;
            let paramcount:number=0;

            const args = content.substring(content.indexOf("(")+1, content.indexOf(")")).split(",");
            for (let i = 0; i < func[1].length; i++) {
                const typels = func[1][i].split(" ");
                if (typels[1].startsWith("?") && args[i] === undefined) {
                    exec = exec + `literal ${typels[0]} ${typels[1]};\n`
                } else {
                if (typels[0].trim() === "string") exec = exec + `literal ${typels[0]} ${typels[1]} = ${args[i]};\n`;
                else if (typels[0].trim() === "int") exec = exec + `int ${typels[1]} = ${args[i]};\n`;
                }
            }
            if (__DEBUG__ === true) console.log(`Appended arguments to function execution`);
        
        } else {

        }
        cur_func = func;
        exec = exec + func[3][0];
        const exdata:any = exec.split(";");
        let i:number;
        for (i = 0; i < exdata.length; i++) {
            //console.log(exdata[i].trim())
            if (exdata[i].trim().split(" ")[0].trim() === "return") {
                //console.log(await intparse(exdata[i].split("return")[1].trim()));
                if (func[2].trim() === "string") retval = await strparse(exdata[i].split("return")[1].trim(), false);
                else if (func[2].trim() === "int") retval = await intparse(exdata[i].split("return")[1].trim());
                else if (func[2].trim() === "void") retval = undefined;
            } else {
                if (exdata[i].trim().split(" ")[0].trim() === "string") poporders.push("str");
                else if (exdata[i].trim().split(" ")[0].trim() === "literal") poporders.push("str");
                else if (exdata[i].trim().split(" ")[0].trim() === "int") poporders.push("int");
                else if (exdata[i].trim().split(" ")[0].trim() === "define") poporders.push("fnc");
                else if (exdata[i].trim().split(" ")[0].trim() === "array") poporders.push("arr");
                //console.log(exdata[i].trim());
                await lexer_exec(exdata[i].trim(), exec, "function");
            }
        }
        cur_func = undefined;
        if (__DEBUG__ === true) console.log(`Executed function ${func[0].trim()}, parsed ${i} entities}`);

        //lexer_init(exec, "scope/func", func, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK);
    } else {
        if (__DEBUG__ === true) console.log(`Function determined to be internal, calling internal function '${func[0].trim()}'`);
        retval = await interns_call(func[0].trim(), content);
    }
    for (let i = 0; i < poporders.length; i++) {
        if (poporders[i] === "str") STRTYPE_DEF_STACK.pop();
        if (poporders[i] === "int") INTTYPE_DEF_STACK.pop();
        if (poporders[i] === "arr") ARRTYPE_DEF_STACK.pop();
        if (poporders[i] === "fnc") FUNCTION_DEF_STACK.pop();
    }
    return retval;
}

//**Call core functions */


export { function_call_init, interns_call, cur_func };