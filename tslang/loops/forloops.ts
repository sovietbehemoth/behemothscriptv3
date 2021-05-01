import { lexer_exec, stackrm, INTTYPE_DEF_STACK } from "../lexer.ts";
import { locate_opening_bracket } from "../brace_logic.ts";
import { calculate_condition } from "../conditions/conditional_logic.ts";
 
let LOOP_TEMP_STACK:number;

async function for_init(content:string, doc:string): Promise<void> {
    if (!content.includes("{")) throw "ParserError: Expected data for loop";
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
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    let BREAK_SIGNAL:boolean = false;
    while (await calculate_condition(fullcon[1].trim()) === true) {
        for (let i = 0; i < execution_data.split(";").length; i++) {
            if (execution_data.split(";")[i].trim() === "break") {
                BREAK_SIGNAL = true;
                break;
            }
            await lexer_exec(execution_data.split(";")[i], doc, "forloop");
        }
        if (BREAK_SIGNAL === true) break;
        //console.log(`${fullcon[0].split("int")[1].split("=")[0].trim()} = ${fullcon[2]}`)
        await lexer_exec(`${fullcon[0].split("int")[1].split("=")[0].trim()} = ${fullcon[2]}`, doc, "forloop");
    }
    LOOP_TEMP_STACK = execution_data.split(";").length;
}

export { for_init, LOOP_TEMP_STACK };