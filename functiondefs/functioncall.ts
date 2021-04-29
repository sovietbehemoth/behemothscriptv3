import { lexer_init, lexer_exec, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK, IMPORT_DEF_STACK, __DEBUG__ } from "../lexer.ts";
import { interns_switch } from "../libs/standard.ts";

let cur_func:any = undefined;

function isinternal(name:string):boolean {
    switch (name) {
        case "print": return true; break;
        case "printl": return true; break;
        case "printj": return true; break;

        case "convsti": return true; break;
        case "convits": return true; break;

        default: return false; break;
    }
}

let instr:any = "";

//**Format */
async function interns_call(name:string, data:string):Promise<void> {
    instr = "false";
    const args:any = data.split("(")[1].split(")").join("").trim();
    let argarray:any = [];
    if (!args.length) {
        await interns_switch(name, ["void"]);
    } else {
        let curmemb:any = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '"' && instr === "false") {
                instr = "true";
            } else if (args[i] === '"' && instr === "true") {
                instr = "false";
            } else if (args[i] === "," && instr === "false") {
                argarray.push(curmemb.join("").trim());
                curmemb = [];
                instr = "false";
                continue;
            } else curmemb.push(args[i]);
            if (i === args.length - 1) argarray.push(curmemb.join("").trim())
        }
        await interns_switch(name, argarray);
    }
}

//[ "thisfunction", [ "param1", " param2" ], "void", [ 'string hello = "hey";' ] ] 
async function function_call_init(func:Array<any>, content:string):Promise<void> {
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
                exec = exec + `literal ${typels[0]} ${typels[1]} = ${args[i]};\n`;
                }
            }
            if (__DEBUG__ === true) console.log(`Appended arguments to function execution`);
        
        } else {

        }
        cur_func = func;
        exec = exec + func[3][0];
        const exdata:any = exec.split(";");
        const execute = (async() => {
            let i:number;
            for (i = 0; i < exdata.length; i++) {
                //console.log(exdata[i].trim())
                await lexer_exec(exdata[i].trim(), exec, true);
            }
            cur_func = undefined;
            if (__DEBUG__ === true) console.log(`Executed function ${func[0].trim()}, parsed ${i} entities}`);
        });
        await execute();
        //lexer_init(exec, "scope/func", func, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK);
    } else {
        if (__DEBUG__ === true) console.log(`Function determined to be internal, calling internal function '${func[0].trim()}'`);
        await interns_call(func[0].trim(), content);
    }
}

//**Call core functions */


export { function_call_init, interns_call, cur_func };
