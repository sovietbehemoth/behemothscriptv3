import { decode_value } from "../def.ts";
import { STRTYPE_DEF_STACK, FUNCTION_DEF_STACK, RETURNSTACK_ARR,__DEBUG__ } from "../lexer.ts";
import { function_call_init } from "../functiondefs/functioncall.ts";

//**Ensure the variable name is legal */
function scan_var_name(varname: string): void {
    if (__DEBUG__ === true) console.log(`Checking legality of variable name...`);
    //Check for reserved words, some awaiting implementation
    const reserved_words = new Boolean(varname === "string" || varname === "const" || varname === "define" ||
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
                default: throw "ParserError: Invalid variable name"; break;
            }
        }
    } else if (reserved_words === true) throw "ParserError: Use of reserved word as variable name";
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
                    throw "ParserError: Invalid reference type"
                    break;
            }
            refs_c = refs_c+1;
        } else string_frmt.push(content[i]);
    }
    return string_frmt.join("");
}

//**Define where the string should begin */
async function strparse(content: string, literal:boolean):Promise<any> {
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
            if (content[i] === '"' && content[i-1] != "\\" && content[i+1] === undefined || content[i+1] === ",") {
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
                for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                    if (FUNCTION_DEF_STACK[i2][0].trim() === funcname.join("").trim()) {
                        if (FUNCTION_DEF_STACK[i2][2] === "string") {
                            const pshitem:any = await function_call_init(FUNCTION_DEF_STACK[i2], content);
                            return pshitem;
                        } else throw "ParserError: Unexpected type";
                    }
                }
            }
            for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                if (STRTYPE_DEF_STACK[i2][1].trim() === content.trim()) {
                    return STRTYPE_DEF_STACK[i2][0];
                }
            }
        }
    }
}

//**Pushes the value of the variable to the variable stack */
async function string_init(content: string, literal:boolean): Promise<void> {
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
    scan_var_name(strname); 
    const res = await strparse(pass.join("").trim(), literal);
    STRTYPE_DEF_STACK.push([res, strname]);
    //console.log(strname, " ", res)
    if (__DEBUG__ === true) console.log(`Appended strtype '${strname}' to stack`);
    //console.log(res, strname);
    //console.log(strname);
}

export { string_init, scan_var_name, strparse };