import { locate_opening_bracket } from "../brace_logic.ts";
import { calculate_condition } from "./conditional_logic.ts";
import { lexer_exec } from "../lexer.ts";

let CONDITIONAL_TEMPORARY_STACK:number;
let PRECONDITION:string;

async function conditional_statement_init(content:string, doc:any):Promise<void> {
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    const condition = content.split("if")[1].split("{")[0].trim().substring(1, content.split("if")[1].split("{")[0].trim().length - 1);
    if (await calculate_condition(condition) === true) {
        for (let i = 0; i < execution_data.split(";").length; i++) {
            await lexer_exec(execution_data.split(";")[i], doc, "ifstatement");
        }
        CONDITIONAL_TEMPORARY_STACK = 1;
    } else {
        CONDITIONAL_TEMPORARY_STACK = execution_data.split(";").length;
    }
    PRECONDITION = condition;
}

async function else_if_conditional_statement_init(content:string, doc:any): Promise<void> {
    if (PRECONDITION === "") throw "ParserError: No conditional statement preceding 'elif'";
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    const condition = content.split("if")[1].split("{")[0].trim().substring(1, content.split("if")[1].split("{")[0].trim().length - 1);
    if (await calculate_condition(PRECONDITION) === false && await calculate_condition(condition) === true) {
        for (let i = 0; i < execution_data.split(";").length; i++) {
            await lexer_exec(execution_data.split(";")[i], doc, "elifstatement");
        }
        CONDITIONAL_TEMPORARY_STACK = 1;
    } else {
        CONDITIONAL_TEMPORARY_STACK = execution_data.split(";").length;
    }
    PRECONDITION = condition;
}

async function else_conditional_statement_init(content:string, doc:any): Promise<void> {
    if (PRECONDITION === "") throw "ParserError: No conditional statement preceding 'else'";
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    if (await calculate_condition(PRECONDITION) === false) {
        for (let i = 0; i < execution_data.split(";").length; i++) {
            await lexer_exec(execution_data.split(";")[i], doc, "elsestatement");
        }
        CONDITIONAL_TEMPORARY_STACK = 1;
    } else {
        CONDITIONAL_TEMPORARY_STACK = execution_data.split(";").length;
    } PRECONDITION = "";
}

export { conditional_statement_init, else_if_conditional_statement_init, else_conditional_statement_init, CONDITIONAL_TEMPORARY_STACK };