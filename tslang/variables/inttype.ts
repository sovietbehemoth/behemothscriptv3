import { INTTYPE_DEF_STACK, FUNCTION_DEF_STACK, __DEBUG__, errorf } from "../lexer.ts";
import { scan_var_name } from "./strtype.ts";
import { isfunction } from "../def.ts";
import { function_call_init } from "../functiondefs/functioncall.ts";
import { CLASSTYPE_DEF_STACK } from "../lexer.ts";
import { OBJECTTYPE_DEF_STACK } from "../lexer.ts";

//determine if string is a number
function checkstr(content:any): boolean {
    let ret:boolean = true;
    for (let i=0;i<content.length;i++) {
        switch (content[i]) {
            case "0": break;
            case "1": break;
            case "2": break;
            case "3": break;
            case "4": break;
            case "5": break;
            case "6": break;
            case "7": break;
            case "8": break;
            case "9": break;
            default: ret = false; break;
        }
        if (ret === false) break;
        else continue;
    } if (ret === true) return true;
    else return false;
}

//**Parse logical equations */
async function eqparse(content:string): Promise<number> {
    let mainstr:string[] = [];
    let opprotocol:string[] = [];
    let numliteralarr:Array<number> = [];
    let sfromstack:boolean = false;
    let break_signal:boolean = false;

    //identify operators
    for (let i=0;i<content.length;i++) {
        if (content[i] === "+" || content[i] === "*" || content[i] === "-" || content[i] === "/") {
            mainstr.push(",");
            opprotocol.push(content[i]);
        } else if (content[i] != " ") (mainstr.push(content[i]));
    }
    mainstr = mainstr.join("").split(",")
    //check for references
    for (let i=0;i<mainstr.length;i++) {
        if (checkstr(mainstr[i]) === false) {
            for (let i2=0;i2<INTTYPE_DEF_STACK.length;i2++) {
                for (let i3=0;i3<mainstr.length;i3++) {
                    if (mainstr[i3].trim() === INTTYPE_DEF_STACK[i2][1].trim()) {
                        numliteralarr.push(parseInt(INTTYPE_DEF_STACK[i2][0]));
                        sfromstack = true;
                        break_signal = true;
                        break;
                    }
                }
                if (break_signal === true) break;
            }
            if (sfromstack === false) errorf(content,"Reference to integer not found",mainstr[i]);
        } else numliteralarr.push(parseInt(mainstr[i]));
    }

    let basenum:number = numliteralarr[0];

    //Perform equation 
    for (let i=0;i<opprotocol.length;i++) {
        if (opprotocol[i] === "+") basenum = basenum + numliteralarr[i+1];
        else if (opprotocol[i] === "-") basenum = basenum - numliteralarr[i+1];
        else if (opprotocol[i] === "*") basenum = basenum * numliteralarr[i+1];
        else if (opprotocol[i] === "/") basenum = basenum / numliteralarr[i+1];
    }
    return basenum;
}

//**Decode the definition of integer */
async function intparse(content:string, inclass?:boolean): Promise<any> {
    if (checkstr(content) === true) {
        return parseInt(content);
    } else if (content.includes("+") || content.includes("-") || content.includes("/") || content.includes("*") && !content.includes("\"")) {
        await eqparse(content);
        return await eqparse(content);
    } else if (await isfunction(content.trim()) === true) {
        for (let i=0;i<FUNCTION_DEF_STACK.length;i++) {
            if (FUNCTION_DEF_STACK[i][0].trim() === content.split("(")[0].trim()) {
                const def:any = await function_call_init(FUNCTION_DEF_STACK[i], content);
                return def;
            }
        }
    } else {
        for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
            if (INTTYPE_DEF_STACK[i][1].trim() === content.trim()) {
                return INTTYPE_DEF_STACK[i][0];
            }
        }
        for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
            if (OBJECTTYPE_DEF_STACK[i].type === "classinit" && content.includes(".")) {
                if (OBJECTTYPE_DEF_STACK[i].name === content.split(".")[0].trim()) {
                    const obj = OBJECTTYPE_DEF_STACK[i].class.members;
                    for (let i2 = 0; i2 < obj.int.length; i2++) {
                        if (obj.int[i2].name.trim() === content.split(content[content.lastIndexOf(".")])[1].trim()) {
                            return obj.int[i2].value[0];
                        }
                    }
                }
            }
        }
    }
    if (__DEBUG__ === true) console.log(`Decoded definition of integer`);
}

//append integer to stack
async function int_init(content:string): Promise<void> {
    let pass:string[] = [];
    let name:string[] = [];

    let namepush:boolean = true;
    let cont:boolean = false;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "=" && cont === false) {
            cont = true;
        } else if (cont === true) pass.push(content[i]);
        else if (namepush === true) name.push(content[i]);
    }
    const intname:string = name.join("").split("int")[1].trim();
    const exec = await intparse(pass.join("").trim());
    //console.log(`${intname}: ${exec}`);
    INTTYPE_DEF_STACK.push([exec, intname]);
    if (__DEBUG__ === true) console.log(`Appended integer '${intname}' to stack`);
}

export {int_init, checkstr, eqparse, intparse};