import { decode_value } from "../def.ts";
import { STRTYPE_DEF_STACK, FUNCTION_DEF_STACK, RETURNSTACK_ARR,__DEBUG__, errorf } from "../lexer.ts";
import { function_call_init } from "../functiondefs/functioncall.ts";
import { locate_member_typedef } from "./typedef.ts";
import { init_new_obj, objparse } from "./classtype.ts";
import { OBJECTTYPE_DEF_STACK } from "../lexer.ts";

//**Ensure the variable name is legal */
async function scan_var_name(varname: string, data:any): Promise<void> {
    if (__DEBUG__ === true) console.log(`Checking legality of variable name...`);
    //Check for reserved words, some awaiting implementation
    const reserved_words = Boolean(varname === "string" || varname === "const" || varname === "define" ||
                                varname === "for" || varname === "int" || varname === "literal");
    if (reserved_words === false) {
        for (let i = 0; i < varname.length; i++) {
            switch (varname[i]) {
                case "a": break;
                case "b": break;
                case "c": break;
                case "d": break;
                case "e": break;
                case "f": break;
                case "g": break;
                case "h": break;
                case "i": break;
                case "j": break;
                case "k": break;
                case "l": break;
                case "m": break;
                case "n": break;
                case "o": break;
                case "p": break;
                case "q": break;
                case "r": break;
                case "s": break;
                case "t": break;
                case "u": break;
                case "v": break;
                case "w": break;
                case "x": break;
                case "y": break;
                case "z": break;
                case "A": break;
                case "B": break;
                case "C": break;
                case "D": break;
                case "E": break;
                case "F": break;
                case "G": break;
                case "H": break;
                case "I": break;
                case "J": break;
                case "K": break;
                case "L": break;
                case "M": break;
                case "N": break;
                case "O": break;
                case "P": break;
                case "Q": break;
                case "R": break;
                case "S": break;
                case "T": break;
                case "U": break;
                case "V": break;
                case "W": break;
                case "X": break;
                case "Y": break;
                case "Z": break;
                case "1": break;
                case "2": break;
                case "3": break;
                case "4": break;
                case "5": break;
                case "6": break;
                case "7": break;
                case "8": break;
                case "9": break;
                case "0": break;
                case "_": break;
                case "-": break;
                default: await errorf(data, "Invalid variable name", varname[i]); break;
            }
        }
    } else if (reserved_words === true) errorf(data, "Use of reserved word as variable name", varname);
}

//string hey = "hello";

//**Parse the string itself, deals with references */
async function strparse_literal(content: string, refs: string): Promise<string> {
    if (__DEBUG__ === true) console.log(`Decoding string references...`);
    const refsarray:string[] = refs.split(",");
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
                    break;
                case "r":
                    break;
                default: 
                    await errorf(content, "Invalid reference type", "%"+content[i+1]);
                    break;
            }
            refs_c = refs_c+1;
        } else string_frmt.push(content[i]);
    }
    return string_frmt.join("");
}

//**Define where the string should begin */
async function strparse(content: string, literal:boolean, doc?:any):Promise<any> {
    let str: string[] = [];
    let refs: string[] = [];
    let funcname: string[] = [];
    let instr: boolean = false;
    let infunc: boolean = false;
    let foundparams: boolean = false;
    let pass:string;
    
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '"' && instr === false && infunc === false) {
            instr = true;         
        } else if (instr === true) {
            if (content[i] === '"' && content[i-1] != "\\"/* && content[i+1] === undefined || content[i+1] === ","*/) {
                instr = false;
                if (literal === false) return await strparse_literal(str.join(""), content.substring(i+2).trim());
                else return str.join("");
            } else str.push(content[i]);
        } else {
            if (foundparams === false && instr === false && content[i] !== "(" && content[i] !== ")") {
                funcname.push(content[i]);
                infunc = true;
            }
            if (content[i] === "(" && instr === false) {
                foundparams = true;
            }
            if (foundparams === true && content[i] !== "(" && content[i] !== ")") {
                refs.push(content[i]);
            }
            if (content[i] === ")" && foundparams === true) {
                if (content.includes(".")) {
                    //console.log(await init_new_obj(content.trim(),content.trim(),doc));
                    return await init_new_obj(content.trim(),content.trim(),doc);
                }
                for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                    //console.log(FUNCTION_DEF_STACK[i2][0].trim(), funcname.join("").trim());
                    if (FUNCTION_DEF_STACK[i2][0].trim() === funcname.join("").trim()) {
                        if (FUNCTION_DEF_STACK[i2][2] === "string" || FUNCTION_DEF_STACK[i2][2] === "__COMPILER_ANY_TYPE__") {
                            const pshitem:any = await function_call_init(FUNCTION_DEF_STACK[i2], content);
                            //console.log("ADJ: " + pshitem);
                            return pshitem;
                        } else await errorf(content, "Unexpected type", FUNCTION_DEF_STACK[i2][0].trim());
                    }
                }
            }
            for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                if (STRTYPE_DEF_STACK[i2][1].trim() === content.trim()) {
                    return STRTYPE_DEF_STACK[i2][0];
                }
            }
            if (content.includes("->")) {
                return locate_member_typedef(content);
            }
        }
    } 
    if (content.includes(".")) {
        /*for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
            if (OBJECTTYPE_DEF_STACK[i].type === "classinit") {
                if (OBJECTTYPE_DEF_STACK[i].name.trim() === content.split(".")[0].trim()) {
                    const strstack_class = OBJECTTYPE_DEF_STACK[i].class.members.string;
                    for (let i2 = 0; i2 < strstack_class.length; i2++) {
                        if (strstack_class[i2].name.trim() === content.split(content[content.lastIndexOf(".")])[1].trim()) {
                            return strstack_class[i2].value[0];
                        }
                    }
                }
            }
        }*/
        //console.log(Object.entries(await objparse(content,content,doc)))
        return await objparse(content,content,doc);
    }
}

//**Pushes the value of the variable to the variable stack */
async function string_init(content: string, literal:boolean, doc:any): Promise<void> {
    //console.log("INIT: " + content);
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
    //push string to stack
    const strname:string = name.join("").split("string")[1].trim();
    await scan_var_name(strname, content); 
    const res = await strparse(pass.join("").trim(), literal, doc);
    if (res === undefined && content.includes("=") && !content.includes(".")) await errorf(content, "Illegal definition of strtype", pass.join("").trim());
    STRTYPE_DEF_STACK.push([res, strname]);
    //console.log(strname, " ", res)
    if (__DEBUG__ === true) console.log(`Appended strtype '${strname}' to stack`);
    //console.log(res, strname);
    //console.log(strname);
}

export { string_init, scan_var_name, strparse };