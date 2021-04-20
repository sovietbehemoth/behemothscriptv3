import { FUNCTION_DEF_STACK } from "../lexer.ts";
import { read_file_prep } from "./imports.ts";
import { types } from "../def.ts";

let ESSENTIAL_DOCUMENT:boolean = false;

function declaration_prep(content: string) {
    const cont:string[] = content.split(" ");
    const retval:any = cont[1];
    if (content.includes("(") && content.includes(")")) {
        const funcname:string = cont[2].split("(")[0].trim();
        const params:Array<any> = content.substring(content.indexOf("(")+1, content.lastIndexOf(")")).split(",");
        FUNCTION_DEF_STACK.push([funcname, params, retval, []]);
    } else {
        if (cont[1] === "essential") {
            ESSENTIAL_DOCUMENT = true;
        }
    }
}

function preprocessor_linker(data: string): void {
    const prep:string = data.split(" ")[0].split("#")[1];
    switch(prep) {
        case "declare":
            declaration_prep(data);
            break;
        case "import":
            read_file_prep(data);
            break;
    }
}

export { preprocessor_linker, ESSENTIAL_DOCUMENT };
