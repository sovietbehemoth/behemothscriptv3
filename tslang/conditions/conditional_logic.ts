import { isfunction } from "../def.ts";
import { intparse } from "../variables/inttype.ts";
import { function_call_init } from "../functiondefs/functioncall.ts";
import { FUNCTION_DEF_STACK } from "../lexer.ts";

type typeof_logic = "LESS_THAN_EQUAL_TO"|"GREATER_THAN_EQUAL_TO"|"EQUAL_TO"|"NOT_EQUAL"|"LESS_THAN"|"GREATER_THAN"

async function callfunc(func:string): Promise<any> {
    for (let i = 0; i < FUNCTION_DEF_STACK.length; i++) {
        if (FUNCTION_DEF_STACK[i][0].trim() === func.split("(")[0].trim()) {
            return await function_call_init(FUNCTION_DEF_STACK[i], func);
        }
    }
}

async function calculate_mathematical_logic(condition:any, nature:typeof_logic): Promise<any> {
    let cond1:any;
    let cond2:any;
    switch (nature) {
        case "EQUAL_TO":    
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[1].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            if (cond1 === cond2) return true;
            else return false;
            break;
        case "LESS_THAN":
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[1].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            if (cond1 < cond2) return true;
            else return false
            break;
        case "LESS_THAN_EQUAL_TO":
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[1].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            if (cond1 <= cond2) return true;
            else return false
            break;
        case "GREATER_THAN_EQUAL_TO":
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[1].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            if (cond1 >= cond2) return true;
            else return false
            break;
        case "GREATER_THAN":
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[0].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            //console.log(cond1, cond2, condition)
            if (cond1 > cond2) return true;
            else return false
            break;
        case "NOT_EQUAL":
            if (await isfunction(condition[0].trim()) === true) {
                cond1 = await callfunc(condition[0]);
            } else cond1 = await intparse(condition[0].trim());

            if (await isfunction(condition[1].trim()) === true) {
                cond2 = await callfunc(condition[1]);
            } else cond2 = await intparse(condition[1].trim());
            if (cond1 !== cond2) return true;
            else return false
            break;
    }
}

async function master_condition_calculator(condition:string): Promise<any> {
    let instr:boolean = false;
    for (let i = 0; i < condition.length; i++) {
        if (condition[i] === '"' && instr === false) instr = true;
        else if (condition[i] === '"' && instr === true && condition[i - 1] !== "\\") instr = false;
        const keytoken:any = Boolean(instr === false && condition[i] === "<" && condition[i+1] === "=" || condition[i] === ">" && condition[i+1] === "=" || 
                                                            condition[i] === "=" && condition[i+1] === "=" || condition[i] === "!" && condition[i+1] === "=" ||
                                                            condition[i] === "<" || condition[i] === ">");
        if (keytoken === true) {
            if (condition[i] === "<" && condition[i+1] === "=") return await calculate_mathematical_logic(condition.split("<="), "LESS_THAN_EQUAL_TO");
            else if (condition[i] === ">" && condition[i+1] === "=") return await calculate_mathematical_logic(condition.split(">="), "GREATER_THAN_EQUAL_TO");
            else if (condition[i] === "=" && condition[i+1] === "=") return await calculate_mathematical_logic(condition.split("=="), "EQUAL_TO");
            else if (condition[i] === "!" && condition[i+1] === "=") return await calculate_mathematical_logic(condition.split("!="), "NOT_EQUAL");
            else if (condition[i] === "<") return await calculate_mathematical_logic(condition.split("<"), "LESS_THAN");
            else if (condition[i] === ">") return await calculate_mathematical_logic(condition.split(">"), "GREATER_THAN");
        } 
    }
}

async function calculate_condition(condition:string): Promise<any> {
    //console.log(condition)
    let CONDITIONS:Array<string> = [];
    let SUBCONDITIONS:Array<string> = [];
    let DYNAMIC_CURRENT:Array<string> = [];

    let instr:boolean = false;
    for (let i = 0; i < condition.length; i++) {
        if (condition[i] === '"' && instr === false) instr = true;
        else if (condition[i] === '"' && instr === true && condition[i - 1] !== "\\") instr = false;
        else if (condition[i] === "&" && condition[i+1] === "&" && instr === false) {
            CONDITIONS.push(DYNAMIC_CURRENT.join("").trim());
            i = i + 1;
            DYNAMIC_CURRENT = [];
        } else DYNAMIC_CURRENT.push(condition[i]);
    } CONDITIONS.push(DYNAMIC_CURRENT.join("").trim());
    DYNAMIC_CURRENT = [];

    instr = false;
    let cond_cur:any = [];
    for (let i = 0; i < CONDITIONS.length; i++) {
        for (let i2 = 0; i2 < CONDITIONS[i].length; i2++) {
            const curchar:any = CONDITIONS[i][i2];
            if (curchar === '"' && instr === false) instr = true;
            else if (curchar === '"' && instr === true && CONDITIONS[i][i2 - 1] !== "\\") instr = false;
            else if (curchar === "|" && CONDITIONS[i][i2+1] === "|" && instr === false) {
                cond_cur.push(DYNAMIC_CURRENT.join("").trim());
                i2 = i2 + 1;
                DYNAMIC_CURRENT = [];
            } else DYNAMIC_CURRENT.push(curchar);
        } cond_cur.push(DYNAMIC_CURRENT.join("").trim());
        SUBCONDITIONS.push(cond_cur);
        cond_cur = [];
        DYNAMIC_CURRENT = [];
    }
    let markbool:any = [];
    for (let i2 = 0; i2 < SUBCONDITIONS.length; i2++) {
        for (let i3 = 0; i3 < SUBCONDITIONS[i2].length; i3++) {
            //console.log(SUBCONDITIONS[i2][i3]);
            if (await master_condition_calculator(SUBCONDITIONS[i2][i3].trim()) === true) {
                markbool.push(true);
                break;
            } else markbool.push(false);
            DYNAMIC_CURRENT = [];
        }
        if (!markbool.includes(true)) return false;
        markbool = [];
    }
    return true;
}

export { calculate_condition };