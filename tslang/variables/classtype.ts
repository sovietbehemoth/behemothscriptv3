import { locate_opening_bracket } from "../brace_logic.ts";
import { INTTYPE_DEF_STACK, OBJECTTYPE_DEF_STACK } from "../lexer.ts";
import { lexer_exec, CLASSTYPE_DEF_STACK } from "../lexer.ts";
import { int_init, intparse } from "./inttype.ts";
import { scan_var_name, strparse } from "./strtype.ts";
import { typecheck, parsearrayint, parsearraystr } from "./arrtype.ts";
import { isfunction } from "../def.ts";

let CLASS_TEMPORARY_DATA:number;

type class_method_types = "private"|"public";
type legal_init_values = "int"|"method"|"literal"|"array"|"string";

interface method_init_return {
    execution:string,
    methodname:string,
    params:Array<any>,
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
    value: any,
    role: class_method_types
}

interface strtype_member {
    name: any,
    value: any,
    role: class_method_types,
    literal: boolean
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
        value:exec,
        role:visibility
    };
    return retval;
}

async function strtype_member_init(content:any, visibility:class_method_types, literal:boolean): Promise<strtype_member> {
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
    scan_var_name(strname); 
    const res = await strparse(pass.join("").trim(), literal);
    const retval:strtype_member = {
        name: strname,
        value: res,
        role: visibility,
        literal: literal
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
    typecheck(arrtype);
    if (arrtype === "string") return await parsearraystr(arr, arrname, arrtype, "push");
    else if (arrtype === "int") return await parsearrayint(arr, arrname, arrtype, "push");
}

async function method_init(content:string,doc:any,visibility:class_method_types,typarr:any):Promise<method_init_return>{
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    const declaration:string = typarr[2].trim();
    const methodname:string = declaration.split("(")[0];
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
    //console.log(declaration);
    const retval:method_init_return = {
        execution: execution_data,
        methodname: methodname,
        params: mastrparams,
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
    const execution_data = doc.substring(locate_opening_bracket(content, doc)[0] + 1, locate_opening_bracket(content, doc)[1]).trim();
    const lenexec:Array<any> = execution_data.split(";");
    for (let i = 0; i < lenexec.length; i++) {
        if (lenexec[i].startsWith("constructor") && lenexec[i].split("(")[0].trim() === "constructor") {
            CONSTRUCTOR_PRESENT = true;
            CONSTRUCTOR_EXECUTION_DATA = doc.substring(locate_opening_bracket(lenexec[i].trim(), doc)[0]+1, locate_opening_bracket(lenexec[i].trim(), doc)[1]).trim();
            const params1:string = content.split("constructor")[1].split("{")[0].trim();
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
            } mastrparams.push(curparam.join("").trim())
            CONSTRUCTOR_PARAMETERS = mastrparams;
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
                const params1:string = equto.substring(equto.indexOf("("), equto.lastIndexOf(")"));
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
                }; fullcon.push(parsedcon.join("").trim());
                if (CLASSTYPE_DEF_STACK[i].constructor.present === false) throw "ParserError: Class does not have a constructor";
                else {
                    const exdata:Array<any> = CLASSTYPE_DEF_STACK[i].constructor.execution.split(";");
                   //console.log(exdata);
                    for (let i3 = 0; i3 < CLASSTYPE_DEF_STACK[i].constructor.params.length; i3++) {
                        const type:string = CLASSTYPE_DEF_STACK[i].constructor.params[i3].split(" ")[0].trim();
                        const def:string = CLASSTYPE_DEF_STACK[i].constructor.params[i3].split(type)[1].trim();
                        if (type === "string") await lexer_exec(`literal string ${def} = ${fullcon[i3]};`,doc,"class");
                        else await lexer_exec(`${type} ${def} = ${fullcon[i3]};\n`,doc,"class");
                    }
                    for (let i2 = 0; i2 < exdata.length; i2++) {
                        await lexer_exec(exdata[i2],doc,"class");
                    }
                    const resval:class_init_pushed = {
                        name: name.join(""),
                        class: CLASSTYPE_DEF_STACK[i],
                        type: "classinit"
                    }
                    OBJECTTYPE_DEF_STACK.push(resval);
                }
            }
        }
    }
}

export { class_init, class_master_creator, CLASS_TEMPORARY_DATA };
export type { master_class };