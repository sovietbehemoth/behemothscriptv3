import { FUNCTION_DEF_STACK, __DEBUG__, BRACE_SYSTEM } from "../lexer.ts";

let FUNCTION_TEMP_STACK:number;

//**Push function to stack */
function funcdef_parse_dec(declaration:string, exec:string):void {
    let funcdef_name:string;
    let funcdef_params:Array<string>;
    let returntype:string;

    const dectokens = declaration.split(" ");
    if (dectokens[1].includes("(")) {
        funcdef_name = dectokens[1].split("(")[0].trim();
        funcdef_params = declaration.substring(declaration.indexOf("(")+1, declaration.indexOf(")")).split(",");
        returntype = declaration.split(":")[1].trim();
        FUNCTION_DEF_STACK.push([funcdef_name, funcdef_params, returntype, [exec]]);
        if (__DEBUG__ === true) console.log(`Appended function '${funcdef_name}' with return type ${returntype} to stack`);
    } else {

    }
}

//**Initialize a function */
function function_init(contents: string, fulldocument: string): void {
    const execution_data = fulldocument.substring(BRACE_SYSTEM.locate_opening_bracket(contents, fulldocument)[0] + 1, BRACE_SYSTEM.locate_opening_bracket(contents, fulldocument)[1]).trim();
    const function_exec = execution_data.substring(execution_data.indexOf("{") + 1, execution_data.lastIndexOf("}") + 1).trim();
    let declaration:string;

    if (execution_data.length > 0) {
        declaration = contents.split("{")[0].trim();
        funcdef_parse_dec(declaration, execution_data);
    } else {
        declaration = contents.trim();
    }

    FUNCTION_TEMP_STACK = execution_data.split(";").length;
}

export { function_init, FUNCTION_TEMP_STACK };