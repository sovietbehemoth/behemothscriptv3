import { ARRTYPE_DEF_STACK, STRTYPE_DEF_STACK, FUNCTION_DEF_STACK, INTTYPE_DEF_STACK, __DEBUG__, errorf } from "../lexer.ts";
import { isfunction } from "../def.ts";
import { checkstr, eqparse } from "../variables/inttype.ts";

type order = "return"|"push";

//**Dumb typecheck */
function typecheck(decl:string, data:string):void {
    if (__DEBUG__ === true) console.log(`Performing array typechecks`);
    switch (decl.trim()) {
        case "string": break;
        case "void": break;
        case "int": break;
        case "(nontype)": break;
        default:
            if (!decl.trim().startsWith("*")) errorf(data, "Invalid type", decl);
            break;
    }
}

//**Append stringtype array to stack */
async function parsearraystr(array:string, name:string, type:any, push?:order, data?:any):Promise<any> {
    const arr:any = array.substring(1, array.length - 1).split(",");
    let instr:boolean = false;
    let mastrray:any = [];
    let curmemb:any = [];
    let cont_exec:boolean = true;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].trim().startsWith('"') && arr[i].endsWith('"')) {
            for (let i2 = 0; i2 < arr[i].length; i2++) {
                if (arr[i][i2] === '"') instr = true;
                else if (arr[i][i2] === '"' && instr === true) instr = false;
                else if (arr[i][i2] !== '"' && arr[i][i2] !== " " && instr === true) curmemb.push(arr[i][i2]);
            }
            mastrray.push(curmemb.join(""));
            curmemb = [];
            instr = false;
        } else {
            for (let i2 = 0; i2 < STRTYPE_DEF_STACK.length; i2++) {
                if (STRTYPE_DEF_STACK[i2][1] === arr[i].trim()) {
                    mastrray.push(STRTYPE_DEF_STACK[i2][0]);
                    cont_exec = false;
                }
            }
            if (cont_exec === true && await isfunction(arr[i]) === true) {
                for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                    if (arr[i].split("(")[0].trim() === FUNCTION_DEF_STACK[i2][0]) {
                        if (FUNCTION_DEF_STACK[i2][2] === "void") errorf(data, "Cannot append voidtype to array",  arr[i].split("(")[0].trim());
                        else {
                            mastrray.push(FUNCTION_DEF_STACK[i2][2]);
                        }
                    }
                }
            } else if (cont_exec === true) {
                for (let i2 = 0; i2 < ARRTYPE_DEF_STACK.length; i2++) {
                    if (arr[i].trim() === ARRTYPE_DEF_STACK[i2][1].trim()) {
                        mastrray.push(ARRTYPE_DEF_STACK[i2][0]);
                    }
                }
            }
            cont_exec = true;
        }
    }
    if (push === "push") ARRTYPE_DEF_STACK.push([mastrray, name, type]);
    else return [mastrray,name,type];
    if (__DEBUG__ === true) console.log(`Appended ${type} array '${name}' to stack`);
}

function parsearraynontype(array:string, name:string) {

}

//**Append inttype array to stack */
async function parsearrayint(array:string, name:string, type:any, push?:order, data?:any) {
    const arr:any = array.substring(1, array.length - 1).split(",");
    let mastrray:any = [];
    let cont_exec:boolean = true;
    for (let i = 0; i < arr.length; i++) {
        const arrmemb:string = arr[i].trim();
        if (checkstr(arr[i]) === true) {
            mastrray.push(parseInt(arr[i]));
        } else if (await isfunction(arr[i]) === true) {
            for (let i2 = 0; i2 < FUNCTION_DEF_STACK.length; i2++) {
                if (arr[i].split("(")[0].trim() === FUNCTION_DEF_STACK[i2][0]) {
                    if (FUNCTION_DEF_STACK[i2][2] === "void") errorf(data, "Cannot append voidtype to array",  arr[i].split("(")[0].trim());
                    else {
                        mastrray.push(FUNCTION_DEF_STACK[i2][2]);
                        break;
                    }
                }
            }
        } else {
            for (let i2 = 0; i2 < INTTYPE_DEF_STACK.length; i2++) {
                if (arrmemb === INTTYPE_DEF_STACK[i2][1]) {
                    mastrray.push(INTTYPE_DEF_STACK[i2][0]);
                    cont_exec = false;
                    break;
                }
            }
            if (cont_exec === true) {
                for (let i2 = 0; i2 < ARRTYPE_DEF_STACK.length; i2++) {
                    if (arrmemb === ARRTYPE_DEF_STACK[i2][1] && ARRTYPE_DEF_STACK[i2][2] === "int") {
                        mastrray.push(ARRTYPE_DEF_STACK[i2][0]);
                        cont_exec = false;
                        break;
                    }
                }
            }
            if (cont_exec === true) {
                mastrray.push(eqparse(arrmemb));
            }
            cont_exec = true
        }
    }
    //console.log(mastrray);
    if (push === "push") ARRTYPE_DEF_STACK.push([mastrray, name, type]);
    else return [mastrray,name,type];
    if (__DEBUG__ === true) console.log(`Appended ${type} array '${name} to stack'`);
}

//Init new array
function array_init(content:string):void {
    let decl:string[] = [];
    let pass:string[] = [];
    let cont:boolean = false;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "=" && cont === false) {
            cont = true;
        } else if (cont === true) pass.push(content[i]);
        else if (cont === false) decl.push(content[i]);
    }

    const declaration:string[] = decl.join("").split(" ");
    const arr:string = pass.join("").trim();
    const arrname:string = declaration[2].trim();
    const arrtype:string = declaration[1].trim();
    typecheck(arrtype, content);
    if (arrtype === "string") parsearraystr(arr, arrname, arrtype, "push", content);
    else if (arrtype === "int") parsearrayint(arr, arrname, arrtype, "push", content);
}

export { array_init, parsearrayint, parsearraystr, typecheck };