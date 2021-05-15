import { INTTYPE_DEF_STACK, OBJECTTYPE_DEF_STACK, STRTYPE_DEF_STACK, ARRTYPE_DEF_STACK, FUNCTION_DEF_STACK, __LINE__, errorf, BRACE_SYSTEM } from "../lexer.ts";
import { lexer_exec, CLASSTYPE_DEF_STACK } from "../lexer.ts";
import { int_init, intparse } from "./inttype.ts";
import { scan_var_name, strparse } from "./strtype.ts";
import { typecheck, parsearrayint, parsearraystr } from "./arrtype.ts";
import { isfunction } from "../def.ts";
import { compiler_call, http_call } from "../libs/standard_classes.ts";

let CLASS_TEMPORARY_DATA:number;

type class_method_types = "private"|"public";
type legal_init_values = "int"|"method"|"literal"|"array"|"string";

interface method_init_return {
    execution:string,
    methodname:string,
    params:Array<any>,
    return_init:string,
    role:class_method_types
}

interface class_obj_def {
    name: string,
    type: "class",
    class: any
}

interface class_init_pushed {
    type: "classinit",
    name:string,
    class:any
}

interface master_class {
    name:string;
    constructor: {
        params:any,
        present:boolean,
        execution:any
    },
    members: {
        int:any,
        string:any,
        array:any,
        method:Array<method_init_return>
    }
}

interface inttype_member {
    name: any,
    value: Array<any>,
    role: class_method_types
}

interface strtype_member {
    name: any,
    value: any,
    role: class_method_types,
    literal: boolean,
    raw: any
}

interface arrtype_member {
    name: any,
    value: any,
    role: class_method_types,
    type: "int"|"str"
}

async function inttype_member_init(content:any,visibility:class_method_types):Promise<inttype_member> {
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
    const exec = await intparse(pass.join("").trim());
    const retval:inttype_member = {
        name:intname,
        value: [exec],
        role:visibility
    };
    return retval;
}

async function strtype_member_init(content:any, visibility:class_method_types, literal:boolean, noparse?:boolean): Promise<strtype_member> {
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
    //push string to stack
    const strname:string = name.join("").split("string")[1].trim();
    await scan_var_name(strname, content); 
    const res = await strparse(pass.join("").trim(), literal);
    const retval:strtype_member = {
        name: strname,
        value: [res],
        role: visibility,
        literal: literal,
        raw: [pass.join("").trim()]
    }; return retval;
}

async function arrtype_member_init(content:any, visibility:class_method_types) {
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
    if (arrtype === "string") return await parsearraystr(arr, arrname, arrtype, "push");
    else if (arrtype === "int") return await parsearrayint(arr, arrname, arrtype, "push");
}

async function method_init(content:string,doc:any,visibility:class_method_types,typarr:any):Promise<method_init_return>{
    const execution_data = doc.substring(BRACE_SYSTEM.locate_opening_bracket(content, doc)[0] + 1, BRACE_SYSTEM.locate_opening_bracket(content, doc)[1]).trim();
    const declaration:string = typarr[2].trim();
    const methodname:string = declaration.split("(")[0];
    const rettype:string = content.split("").slice(content.lastIndexOf(":")+1).join("").split("{")[0].trim();
    const params:any = content.split(methodname.trim())[1].substring(1, content.split(methodname.trim())[1].indexOf(")"));
    let instr:boolean = false;
    let curparam:Array<any> = [];
    let mastrparams:Array<any> = [];
    for (let i2 = 0; i2 < params.length; i2++) {
        if (params[i2] === '"' && instr === false) instr = true;
        else if (params[i2] === '"' && instr === true) instr = false;
        else if (params[i2] === "," && instr === false) {
            mastrparams.push(curparam.join("").trim());
            curparam = [];
            continue;
        } else curparam.push(params[i2]);
    } mastrparams.push(curparam.join("").trim());
    const retval:method_init_return = {
        execution: execution_data,
        methodname: methodname,
        params: mastrparams,
        return_init: rettype,
        role: visibility
    }
    return retval;
}

async function class_init(content:string,doc:any):Promise<void> {
    let CONSTRUCTOR_EXECUTION_DATA:any = [];
    let CONSTRUCTOR_PARAMETERS:any = [];
    let CONSTRUCTOR_PRESENT:boolean = false;

    let METHODS:Array<method_init_return> = [];
    let INTTYPE:Array<inttype_member> = [];
    let STRTYPE:Array<strtype_member> = [];
    let ARRTYPE:Array<arrtype_member> = [];

    let superior_class:master_class;

    const classname:string = content.split("class")[1].split("{")[0].trim();
    const execution_data = doc.substring(BRACE_SYSTEM.locate_opening_bracket(content, doc)[0] + 1, BRACE_SYSTEM.locate_opening_bracket(content, doc)[1]).trim();
    const lenexec:Array<any> = execution_data.split(";");
    for (let i = 0; i < lenexec.length; i++) {
        if (lenexec[i].trim().startsWith("constructor") && lenexec[i].includes("(")) {
            if (lenexec[i].trim().split("(")[0].trim() === "constructor") {
                CONSTRUCTOR_PRESENT = true;
                CONSTRUCTOR_EXECUTION_DATA = doc.substring(BRACE_SYSTEM.locate_opening_bracket(lenexec[i].trim(), doc)[0]+1, BRACE_SYSTEM.locate_opening_bracket(lenexec[i].trim(), doc)[1]).trim();
                const params1:string = lenexec[i].trim().split("constructor")[1].split("{")[0].trim();
                const params:string = params1.substring(1, params1.length - 1);
                let instr:boolean = false;
                let curparam:Array<any> = [];
                let mastrparams:Array<any> = [];
                for (let i2 = 0; i2 < params.length; i2++) {
                    if (params[i2] === '"' && instr === false) instr = true;
                    else if (params[i2] === '"' && instr === true) instr = false;
                    else if (params[i2] === "," && instr === false) {
                        mastrparams.push(curparam.join("").trim());
                        curparam = [];
                        continue;
                    } else curparam.push(params[i2]);
                } mastrparams.push(curparam.join("").trim());
                CONSTRUCTOR_PARAMETERS = mastrparams;
            }
        } else {
            const dec:Array<any> = lenexec[i].trim().split(" ");
            const vis:class_method_types = dec[0].trim();
            if (dec[0].trim() === "private" || dec[0].trim() === "public") {
                switch (dec[1].trim()) {
                    case "method":
                        METHODS.push(await method_init(lenexec[i],doc,vis,dec));
                        break;
                    case "int":
                        INTTYPE.push(await inttype_member_init(lenexec[i],vis));
                        break;
                    case "literal":
                        STRTYPE.push(await strtype_member_init(lenexec[i], vis, true));
                        break;
                    case "string":
                        STRTYPE.push(await strtype_member_init(lenexec[i], vis, false));
                        break;
                    case "array":
                        ARRTYPE.push(await arrtype_member_init(lenexec[i], vis))
                        break;
                }
            }
        }
    }
    if (CONSTRUCTOR_PRESENT === false) await errorf(content, "Class does not have a constructor", "");
    superior_class = {
        name:classname,
        constructor: {
            params: CONSTRUCTOR_PARAMETERS,
            present: CONSTRUCTOR_PRESENT,
            execution: CONSTRUCTOR_EXECUTION_DATA
        },
        members: {
            int: INTTYPE,
            string: STRTYPE,
            array: ARRTYPE,
            method: METHODS
        }
    }
    CLASSTYPE_DEF_STACK.push(superior_class);
    CLASS_TEMPORARY_DATA = execution_data.split(";").length;
}

async function class_master_creator(contentf:string,doc:any):Promise<any> {
    const content:any = contentf.split("object")[1].trim();
    let eq:boolean = false;
    let name:string[] = [];
    let pass:string[] = [];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "=" && eq === false) eq = true;
        else if (eq === false && content[i] !== " ") name.push(content[i]);
        else if (eq === true) pass.push(content[i]);
    }
    const equto:string = pass.join("").trim();
    const objname:string = name.join("").trim();
    let type:string;
    let classif:any;
    if (await isfunction(equto) === true) {
        for (let i = 0; i < CLASSTYPE_DEF_STACK.length; i++) {
            //console.log(equto.split("(")[0].trim());
            if (CLASSTYPE_DEF_STACK[i].name.trim() === equto.split("(")[0].trim()) {
                type = "class";
                classif = CLASSTYPE_DEF_STACK[i];
                const obj_push:class_obj_def = {
                    name: objname,
                    type: "class",
                    class: classif
                };
                OBJECTTYPE_DEF_STACK.push(obj_push);
                //OBJECTTYPE_DEF_STACK.push([objname,type,classif]);
                const params1:string = equto.substring(equto.indexOf("(")+1, equto.lastIndexOf(")"));
                let infunc:boolean = false;
                let parsedcon:Array<any> = [];
                let fullcon:Array<any> = [];            
                for (let i2 = 0; i2 < params1.length; i2++) {
                    if (params1[i2] === "(") infunc = true;
                    else if (params1[i2] === ")") infunc = false;
                    else if (params1[i2] === "," && infunc === false) {
                        fullcon.push(parsedcon.join("").trim());
                        parsedcon = [];
                    } else parsedcon.push(params1[i2])
                }; if (parsedcon.join("").trim() !== undefined) fullcon.push(parsedcon.join("").trim());
                if (CLASSTYPE_DEF_STACK[i].constructor.present === false) {}
                else {
                    const exdata:Array<any> = CLASSTYPE_DEF_STACK[i].constructor.execution.split(";");
                   //console.log(exdata);
                    for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].constructor.params.length; i3++) {
                        const type:string = CLASSTYPE_DEF_STACK[i].constructor.params[i3].split(" ")[0].trim();
                        const def:string = CLASSTYPE_DEF_STACK[i].constructor.params[i3].split(type)[1].trim();
                        if (type === "string") await lexer_exec(`literal string ${def} = ${fullcon[i3]}`,doc,"class");
                        else await lexer_exec(`${type} ${def} = ${fullcon[i3]}`,doc,"class");
                    }
                    let haltorder:boolean = false;
                    let poporders:Array<any> = [];
                    for (let i2 = 0; i2 < exdata.length; i2++) {
                        if (exdata[i2].split(" ")[0].trim() === "this") {
                            for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].members.int.length; i3++) {
                                if (CLASSTYPE_DEF_STACK[i].members.int[i3].name.trim() === exdata[i2].split("this")[1].trim().split(" ")[0].trim()) {
                                    const equ:string = exdata[i2].split("=")[1].trim();
                                    CLASSTYPE_DEF_STACK[i].members.int[i3].value.pop();
                                    CLASSTYPE_DEF_STACK[i].members.int[i3].value.push(await intparse(equ));
                                    haltorder = true;
                                    //console.log(CLASSTYPE_DEF_STACK[i].members.int[i3].value);
                                }
                            }
                            for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].members.string.length; i3++) {
                                if (CLASSTYPE_DEF_STACK[i].members.string[i3].name.trim() === exdata[i2].split("this")[1].trim().split(" ")[0].trim()) {
                                    const equ:string = exdata[i2].split("=")[1].trim();
                                    CLASSTYPE_DEF_STACK[i].members.string[i3].value.pop();
                                    CLASSTYPE_DEF_STACK[i].members.string[i3].raw.pop()
                                    CLASSTYPE_DEF_STACK[i].members.string[i3].raw.push(equ);
                                    CLASSTYPE_DEF_STACK[i].members.string[i3].value.push(await strparse(equ,true));
                                    haltorder = true;
                                    //console.log(CLASSTYPE_DEF_STACK[i].members.string[i3].value);
                                }
                            }
                        } else if (exdata[i2].includes("=")) {
                            if (exdata[i2].split("=")[1].trim().split(" ")[0].trim() === "this") {
                                for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].members.int.length; i3++) {
                                    if (CLASSTYPE_DEF_STACK[i].members.int[i3].name.trim() === exdata[i2].split("this")[1].trim().split(" ")[0].trim()) {
                                        await lexer_exec(`${exdata[i2].split("=")[0].trim()} = ${CLASSTYPE_DEF_STACK[i].members.int[i3].value}`, doc, "class");
                                        haltorder = true;
                                    }
                                }
                                for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].members.string.length; i3++) {
                                    if (CLASSTYPE_DEF_STACK[i].members.string[i3].name.trim() === exdata[i2].split("this")[1].trim().split(" ")[0].trim()) {
                                        await lexer_exec(`${exdata[i2].split("=")[0].trim()} = ${CLASSTYPE_DEF_STACK[i].members.string[i3].raw}`, doc, "class");
                                        haltorder = true;
                                    }
                                }
                            }
                        }
                        if (exdata[i2].trim().split(" ")[0].trim() === "string") poporders.push("str");
                        else if (exdata[i2].trim().split(" ")[0].trim() === "literal") poporders.push("str");
                        else if (exdata[i2].trim().split(" ")[0].trim() === "int") poporders.push("int");
                        else if (exdata[i2].trim().split(" ")[0].trim() === "define") poporders.push("fnc");
                        else if (exdata[i2].trim().split(" ")[0].trim() === "array") poporders.push("arr");
                        if (haltorder === false) await lexer_exec(exdata[i2].trim(),doc,"class");
                        haltorder = false;
                    }
                    const resval:class_init_pushed = {
                        name: name.join(""),
                        class: CLASSTYPE_DEF_STACK[i],
                        type: "classinit"
                    }
                    OBJECTTYPE_DEF_STACK.push(resval);
                    for (let i = 0; i < poporders.length; i++) {
                        if (poporders[i] === "str") STRTYPE_DEF_STACK.pop();
                        if (poporders[i] === "int") INTTYPE_DEF_STACK.pop();
                        if (poporders[i] === "arr") ARRTYPE_DEF_STACK.pop();
                        if (poporders[i] === "fnc") FUNCTION_DEF_STACK.pop();
                    }
                    return;
                }
            }
        }
    }
}

async function init_new_obj(init_word:string,data:string,doc:any) {
    for (let i2 = 0; i2 < OBJECTTYPE_DEF_STACK.length; i2++) {
        if (OBJECTTYPE_DEF_STACK[i2].type === "classinit") {
            if (OBJECTTYPE_DEF_STACK[i2].name === init_word.split(".")[0].trim()) {
                for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK.length; i3++) {
                    //console.log(OBJECTTYPE_DEF_STACK[i3].class);
                    if (CLASSTYPE_DEF_STACK[i3].name.trim() === OBJECTTYPE_DEF_STACK[i2].class.name.trim()) {
                        const call:string = init_word.split(".").slice(1).join("");
                        if (OBJECTTYPE_DEF_STACK[i2].name.trim() === "behemoth") {
                            return await compiler_call(data.split(".")[1].trim());
                        } else if (OBJECTTYPE_DEF_STACK[i2].name.trim() === "http") {
                            return await http_call(data.slice(data.indexOf(".")+1).trim(), data);
                        }       
                        if (await isfunction(call) === true) {
                            const methods:Array<any> = CLASSTYPE_DEF_STACK[i3].members.method;
                            for (let i4 = 0; i4 < methods.length; i4++) {
                                if (methods[i4].methodname.trim() === call.split("(")[0].trim()) {
                                    if (methods[i4].role === "public") {
                                        let instr: any = "false";
                                        let argarray: Array<any> = [];
                                        let curmemb:any = [];
                                        let dataf:string = data.substring(data.indexOf("(")+1,data.lastIndexOf(')'));
                                        for (let i5 = 0; i5 < dataf.length; i5++) {
                                            if (dataf[i5] === '"' && instr === "false") {
                                                curmemb.push(dataf[i5]);
                                                instr = "true";
                                            } else if (dataf[i5] === '"' && instr === "true") {
                                                curmemb.push(dataf[i5]);
                                                instr = "false";
                                            } else if (dataf[i5] === "," && instr === "false") {
                                                argarray.push(curmemb.join("").trim());
                                                curmemb = [];
                                                instr = "false";
                                                continue;
                                            } else curmemb.push(dataf[i5]);
                                        } argarray.push(curmemb.join("").trim());
                                        //console.log(argarray);
                                        let argarrcount:number = 0;
                                        if (methods[i4].params[0].trim() !== "void") {
                                            for (let i5 = 0; i5 < methods[i4].params.length; i5++) {
                                                const param:string = methods[i4].params[i5];
                                                //console.log(methods[i4].params);
                                                const type:string = param.split(" ")[0].trim();
                                                const name:string = param.split(" ")[1].trim();
                                                //console.log(`${param} = ${argarray[i5]};`);
                                                if (type === "string") await lexer_exec(`literal string ${name} = ${argarray[i5]}`,doc,"method");
                                                else await lexer_exec(`${param} = ${argarray[i5]}`,doc,"method");
                                            }
                                        }
                                        const method_len:number = methods[i4].execution.split(";").length;
                                        const method_exec:any = methods[i4].execution.split(";");
                                        const method_ret:any = methods[i4].return_init.trim();
                                        let poporders:Array<any> = [];
                                        let retval:any;
                                        let haltorder:boolean = false;
                                        for (let i5 = 0; i5 < method_len; i5++) {
                                            if (method_exec[i5].trim().split(" ")[0].trim() === "return") {
                                                //console.log(await strparse(method_exec[i5].split("return")[1].trim(),true));
                                                if (methods[i4].return_init.trim() === "int") retval = await intparse(method_exec[i5].split("return")[1].trim());
                                                else if (methods[i4].return_init.trim() === "string") retval = await strparse(method_exec[i5].split("return")[1].trim(),true);
                                                else if (methods[i4].return_init.trim() === "void") retval = undefined;
                                                else if (!methods[i4].return_init.trim().startsWith("*")) await errorf(data, `Illegal return type`, methods[i4].return_init.trim());
                                                //console.log("RET: " + retval);
                                                return retval;
                                            }
                                            if (method_exec[i5].split(" ")[0].trim() === "this") {
                                                for (let i6 = 0; i6 < CLASSTYPE_DEF_STACK[i3].members.int.length; i6++) {
                                                    if (CLASSTYPE_DEF_STACK[i3].members.int[i3].name.trim() === method_exec[i5].split("this")[1].trim().split(" ")[0].trim()) {
                                                        const equ:string = method_exec[i5].split("=")[1].trim();
                                                        CLASSTYPE_DEF_STACK[i3].members.int[i6].value.pop();
                                                        CLASSTYPE_DEF_STACK[i3].members.int[i6].value.push(await intparse(equ));
                                                        haltorder = true;
                                                        //console.log(CLASSTYPE_DEF_STACK[i].members.int[i3].value);
                                                    }
                                                }
                                                for (let i6 = 0; i6 < CLASSTYPE_DEF_STACK[i3].members.string.length; i6++) {
                                                    if (CLASSTYPE_DEF_STACK[i3].members.string[i6].name.trim() === method_exec[i5].split("this")[1].trim().split(" ")[0].trim()) {
                                                        const equ:string = method_exec[i5].split("=")[1].trim();
                                                        CLASSTYPE_DEF_STACK[i3].members.string[i6].value.pop();
                                                        CLASSTYPE_DEF_STACK[i3].members.string[i6].raw.pop()
                                                        CLASSTYPE_DEF_STACK[i3].members.string[i6].raw.push(equ);
                                                        CLASSTYPE_DEF_STACK[i3].members.string[i6].value.push(await strparse(equ,true));
                                                        haltorder = true;
                                                        //console.log(CLASSTYPE_DEF_STACK[i].members.string[i3].value);
                                                    }
                                                }
                                            } else if (method_exec[i5].includes("=")) {
                                                if (method_exec[i5].split("=")[1].trim().split(" ")[0].trim() === "this") {
                                                    for (let i6 = 0; i6 < CLASSTYPE_DEF_STACK[i3].members.int.length; i6++) {
                                                        if (CLASSTYPE_DEF_STACK[i3].members.int[i6].name.trim() === method_exec[i5].split("this")[1].trim().split(" ")[0].trim()) {
                                                            await lexer_exec(`${method_exec[i5].split("=")[0].trim()} = ${CLASSTYPE_DEF_STACK[i3].members.int[i6].value}`, doc, "class");
                                                            haltorder = true;
                                                        }
                                                    }
                                                    for (let i6 = 0; i6 < CLASSTYPE_DEF_STACK[i3].members.string.length; i6++) {
                                                        if (CLASSTYPE_DEF_STACK[i3].members.string[i6].name.trim() === method_exec[i5].split("this")[1].trim().split(" ")[0].trim()) {
                                                            //console.log(`${method_exec[i5].split("=")[0].trim()} = "${CLASSTYPE_DEF_STACK[i3].members.string[i6].value}"`);
                                                            await lexer_exec(`${method_exec[i5].split("=")[0].trim()} = "${CLASSTYPE_DEF_STACK[i3].members.string[i6].value}"`, doc, "class");
                                                            haltorder = true;
                                                        }
                                                    }
                                                }
                                            }

                                            if (method_exec[i5].trim().split(" ")[0].trim() === "string") poporders.push("str");
                                            else if (method_exec[i5].trim().split(" ")[0].trim() === "literal") poporders.push("str");
                                            else if (method_exec[i5].trim().split(" ")[0].trim() === "int") poporders.push("int");
                                            else if (method_exec[i5].trim().split(" ")[0].trim() === "define") poporders.push("fnc");
                                            else if (method_exec[i5].trim().split(" ")[0].trim() === "array") poporders.push("arr");                                       
                                            if (haltorder === false) await lexer_exec(method_exec[i5].trim(),doc,"method");;
                                            haltorder = false;
                                        }
                                        for (let i0 = 0; i0 < poporders.length; i0++) {
                                            if (poporders[i0] === "str") STRTYPE_DEF_STACK.pop();
                                            if (poporders[i0] === "int") INTTYPE_DEF_STACK.pop();
                                            if (poporders[i0] === "arr") ARRTYPE_DEF_STACK.pop();
                                            if (poporders[i0] === "fnc") FUNCTION_DEF_STACK.pop();
                                        }
                                        return retval;
                                    } else await errorf(data, "Illegal invocation of private method");
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

export { class_init, class_master_creator, init_new_obj, CLASS_TEMPORARY_DATA };
export type { master_class, method_init_return };