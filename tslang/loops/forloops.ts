import { lexer_exec, stackrm, INTTYPE_DEF_STACK, ARRTYPE_DEF_STACK, STRTYPE_DEF_STACK, FUNCTION_DEF_STACK, errorf, BRACE_SYSTEM } from "../lexer.ts";
import { intparse } from "../variables/inttype.ts";
import { calculate_condition } from "../conditions/conditional_logic.ts";
 
let LOOP_TEMP_STACK:number;

/**Initialize a for loop. 
 * 1. Will execute before entering loop
 * 2. Will check condition every time before entering loop
 * 3. Will execute every time loop finishes
 */
async function for_init(content:string, doc:string): Promise<void> {
    let poporders:any = [];
    if (!content.includes("{")) errorf(content, "Expected data for loop", "for");
    const conditionparse:string = content.split("for")[1].split("{")[0].trim();
    const condition:string = conditionparse.substring(1, conditionparse.length - 1);
    let infunc:boolean = false;
    let parsedcon:Array<any> = [];
    let fullcon:Array<any> = [];
    const exc = (async() => {
        for (let i = 0; i < condition.length; i++) {
            if (condition[i] === "(") infunc = true;
            else if (condition[i] === ")") infunc = false;
            else if (condition[i] === "," && infunc === false) {
                fullcon.push(parsedcon.join("").trim());
                parsedcon = [];
            } else parsedcon.push(condition[i])
        }
    });
    await exc();
    fullcon.push(parsedcon.join("").trim());
    await lexer_exec(fullcon[0].trim(), doc, "forloop");
    const execution_data = doc.substring(BRACE_SYSTEM.locate_opening_bracket(content, doc)[0] + 1, BRACE_SYSTEM.locate_opening_bracket(content, doc)[1]).trim();
    let BREAK_SIGNAL:boolean = false;
    while (await calculate_condition(fullcon[1].trim()) === true) {
        //console.log(await intparse(fullcon[1].trim().split("<")[0]), await intparse(fullcon[1].trim().split("<")[1]));
        for (let i = 0; i < execution_data.split(";").length-1; i++) {
            //console.log(execution_data.split(";")[i].trim());
            if (execution_data.split(";")[i].trim().split(" ")[0].trim() === "string") poporders.push(execution_data.split(";")[i].trim().split(" ")[1].trim());
            else if (execution_data.split(";")[i].trim().split(" ")[0].trim() === "literal") poporders.push(execution_data.split(";")[i].trim().split(" ")[1].trim());
            else if (execution_data.split(";")[i].trim().split(" ")[0].trim() === "int") poporders.push(execution_data.split(";")[i].trim().split(" ")[1].trim());
            else if (execution_data.split(";")[i].trim().split(" ")[0].trim() === "define") poporders.push(execution_data.split(";")[i].trim().split(" ")[1].trim());
            else if (execution_data.split(";")[i].trim().split(" ")[0].trim() === "array") poporders.push(execution_data.split(";")[i].trim().split(" ")[1].trim());
            if (execution_data.split(";")[i].trim() === "break") {
                BREAK_SIGNAL = true;
                break;
            }
            await lexer_exec(execution_data.split(";")[i].trim(), doc, "forloop");
        }
        if (BREAK_SIGNAL === true) break;
        //console.log(`${fullcon[0].split("int")[1].split("=")[0].trim()} = ${fullcon[2]}`)
        await lexer_exec(`${fullcon[0].split("int")[1].split("=")[0].trim()} = ${fullcon[2]}`, doc, "forloop");
        //console.log(INTTYPE_DEF_STACK, poporders);
        for (let i = 0; i < poporders.length; i++) {
            //console.log(poporders[i]);
            for (let i2 = 0; i2 < INTTYPE_DEF_STACK.length; i2++) {
                if (INTTYPE_DEF_STACK[i2][1].trim() === poporders[i]) await stackrm(INTTYPE_DEF_STACK,i2,"int");
                break;
            } for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                if (STRTYPE_DEF_STACK[i2][1].trim() === poporders[i]) await stackrm(STRTYPE_DEF_STACK,i2,"str");
                break;
            } for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                if (FUNCTION_DEF_STACK[i2][0].trim() === poporders[i]) await stackrm(FUNCTION_DEF_STACK,i2,"func");
                break;
            } for (let i2 = 0; i2 < ARRTYPE_DEF_STACK.length; i2++) {
                if (ARRTYPE_DEF_STACK[i2][1].trim() === poporders[i]) await stackrm(ARRTYPE_DEF_STACK,i2,"arr");
                break;
            }
        }
    }
    //console.log(await intparse(fullcon[1].trim().split("<")[0]), await intparse(fullcon[1].trim().split("<")[1]));
    
    if (fullcon[0].trim().split(" ")[0].trim() === "int") INTTYPE_DEF_STACK.pop();
    LOOP_TEMP_STACK = execution_data.split(";").length;
}

export { for_init, LOOP_TEMP_STACK };