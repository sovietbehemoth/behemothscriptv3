import { STRTYPE_DEF_STACK, FUNCTION_DEF_STACK, INTTYPE_DEF_STACK, __DEBUG__ } from "./lexer.ts";

//**Prevent compiler error */
let glob:any = "";

type types = "string" | "int" | "undefined" | "object" | "void" | "(nontype)";

//**Char type */
type alpha = "a"|"c"|"d"|"e"|"f"|"g"|"h"|"i"|"j"|"k"|"l"|"m"|"n"|"o"|"p"|"q"|"r"|"s"|"t"|"u"|"v"|"w"|"x"|"y"|"z";

//**Check if char is legal */
const legalchar = new Boolean(glob.toLowerCase() === "a" || glob.toLowerCase() === "b" || glob.toLowerCase() === "c" || glob.toLowerCase() === "d" || glob.toLowerCase() === "e" || glob.toLowerCase() === "f" || glob.toLowerCase() === "g" || glob.toLowerCase() === "h" || glob.toLowerCase() === "i" || 
                              glob.toLowerCase() === "j" || glob.toLowerCase() === "k" || glob.toLowerCase() === "l" || glob.toLowerCase() === "m" || glob.toLowerCase() === "n" || glob.toLowerCase() === "o" || glob.toLowerCase() === "p" || glob.toLowerCase() === "q" || glob.toLowerCase() === "r" || 
                              glob.toLowerCase() === "s" || glob.toLowerCase() === "t" || glob.toLowerCase() === "u" || glob.toLowerCase() === "v" || glob.toLowerCase() === "w" || glob.toLowerCase() === "x" || glob.toLowerCase() === "y" || glob.toLowerCase() === "z");

//**Determine the value of code */
function decode_value(content:any, expected:types, exep?:boolean): any {
    if (__DEBUG__ === true) console.log(`Decoding ${expected}...'`);
    let returnvalue:any;
    let located:boolean = false;
    switch (expected) {
        case "string":
            for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
                if (content.trim() === STRTYPE_DEF_STACK[i][1]) {
                    returnvalue = STRTYPE_DEF_STACK[i][0];
                    located = true;
                    break;
                }
            }
            break;
        case "int":
            for (let i = 0; i < INTTYPE_DEF_STACK.length; i++) {
                if (content.trim() === INTTYPE_DEF_STACK[i][1]) {
                    returnvalue = INTTYPE_DEF_STACK[i][0];
                    located = true;
                    break;
                }
            }
            break;
    }
    if (located === false) throw "ParserError: Undefined reference to " + expected;
    return returnvalue;
}

//**Reliably check if string input is a function call */
async function isfunction(content:string) {
    for (let i = 0; i < content.length; i++) {
        glob = content[i];
        if (legalchar !== true && glob === "(") {
            return true;
        }
    }
    return false;
}

export { decode_value, types, isfunction };