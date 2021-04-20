import { STRTYPE_DEF_STACK } from "./lexer.ts";

type types = "string" | "int" | "undefined" | "object" | "void";

//**Determine the value of code */
function decode_value(content:any, expected:types): any {
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
    }
    if (located === false) throw "ParserError: Undefined reference to " + expected;
    return returnvalue;
}

export { decode_value, types };
