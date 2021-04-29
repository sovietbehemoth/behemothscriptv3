import { FUNCTION_DEF_STACK, __DEBUG__ } from "../lexer.ts";
import { read_file_prep } from "./imports.ts";
import { types } from "../def.ts";

let ESSENTIAL_DOCUMENT:boolean = false;

//#declare preprocessor
async function declaration_prep(content: string) {
    const cont:string[] = content.split(" ");
    const retval:any = cont[1];
    if (content.includes("(") && content.includes(")")) {
        const funcname:string = cont[2].split("(")[0].trim();
        const params:Array<any> = content.substring(content.indexOf("(")+1, content.lastIndexOf(")")).split(",");
        //console.log([funcname, params, retval, []])
        FUNCTION_DEF_STACK.push([funcname, params, retval, []]);
    } else {
        if (cont[1] === "essential") {
            ESSENTIAL_DOCUMENT = true;
        }
    }
}

//parse preprocessors
async function preprocessor_linker(data: string) {
    const prep:string = data.split(" ")[0].split("#")[1];
    switch(prep) {
        case "declare":
            await declaration_prep(data);
            break;
        case "import":
            await read_file_prep(data);
            break;
    }
}

export { preprocessor_linker, ESSENTIAL_DOCUMENT };
