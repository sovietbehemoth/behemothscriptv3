import { INTTYPE_DEF_STACK } from "../lexer.ts";
import { scan_var_name } from "./strtype.ts";

function checkstr(content:any): boolean {
    let ret:boolean = true;
    for (let i=0;i<content.length;i++) {
        switch (content[i]) {
            case "0": break;
            case "1": break;
            case "2": break;
            case "3": break;
            case "4": break;
            case "5": break;
            case "6": break;
            case "7": break;
            case "8": break;
            case "9": break;
            default: ret = false; break;
        }
        if (ret === false) break;
        else continue;
    } if (ret === true) return true;
    else return false;
}

function eqparse(content:string): number {
    let mainstr:string[] = [];
    let opprotocol:string[] = [];
    let numliteralarr:Array<number> = [];
    let sfromstack:boolean = false;
    for (let i=0;i<content.length;i++) {
        if (content[i] === "+" || content[i] === "*" || content[i] === "-" || content[i] === "/") {
            mainstr.push(",");
            opprotocol.push(content[i]);
        } else if (content[i] != " ") (mainstr.push(content[i]));
        //mainstr = mainstr.join("").split(",");
    }
    mainstr = mainstr.join("").split(",")
    for (let i=0;i<mainstr.length;i++) {
        if (checkstr(mainstr[i]) === false) {
            for (let i2=0;i2<INTTYPE_DEF_STACK.length;i2++) {
                if (mainstr[i2].trim() === INTTYPE_DEF_STACK[i2][1].trim()) {
                    numliteralarr.push(parseInt(INTTYPE_DEF_STACK[i2][0]));
                    sfromstack = true;
                    break;
                }
            }
            if (sfromstack === false) throw "ParserError: Reference to integer not found";
        } else numliteralarr.push(parseInt(mainstr[i]));
    }

    let basenum:number = numliteralarr[0];

    for (let i=0;i<opprotocol.length;i++) {
        if (opprotocol[i] === "+") basenum = basenum + numliteralarr[i+1];
        else if (opprotocol[i] === "-") basenum = basenum - numliteralarr[i+1];
        else if (opprotocol[i] === "*") basenum = basenum * numliteralarr[i+1];
        else if (opprotocol[i] === "/") basenum = basenum / numliteralarr[i+1];
    }
    return basenum;
}

function intparse(content:string) {
    if (checkstr(content) === true) {
        console.log("s")
        return parseInt(content);
    } else if (content.includes("+") || content.includes("-") || content.includes("/") || content.includes("*")) {
        eqparse(content);
        return eqparse(content);
    }
}

function int_init(content:string): void {
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
    const intname:string = name.join("").split("int")[1].trim();
    const exec = intparse(pass.join("").trim());
    console.log(`${intname}: ${exec}`);
    INTTYPE_DEF_STACK.push([exec, intname]);
}

export default int_init;
