import { decode_value } from "../def.ts";
import { STRTYPE_DEF_STACK } from "../lexer.ts";

//**Stack containing all var types */

//**Ensure the variable name is legal */
function scan_var_name(varname: string): void {
    const reserved_words = new Boolean(varname === "string" || varname === "const" || varname === "define" ||
                                varname === "for" || varname === "int");
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
function strparse_literal(content: string, refs: string): string {
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
function strparse(content: string) {
    let str: string[] = [];
    let instr: boolean = false;
    let pass:string;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '"' && instr === false) {
            instr = true;         
        } else if (instr === true) {
            if (content[i] === '"' && content[i-1] != "\\") {
                instr = false;
                return strparse_literal(str.join(""), content.substring(i+2).trim());
            } else str.push(content[i]);
        }
    }
}

//**Pushes the value of the variable to the variable stack */
function string_init(content: string): void {
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
    const strname:string = name.join("").split("string")[1].trim();
    scan_var_name(strname); 
    const res = strparse(pass.join("").trim());
    STRTYPE_DEF_STACK.push([res, strname]);
    console.log(res);
}

export { string_init, scan_var_name };
