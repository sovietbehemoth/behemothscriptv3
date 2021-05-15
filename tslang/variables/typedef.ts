import { TYPEDEF_STRUCT_STACK, RESTRICT_TYPE_STACK,OBJECTTYPE_DEF_STACK,STRTYPE_DEF_STACK,INTTYPE_DEF_STACK, stackrm, errorf, BRACE_SYSTEM } from "../lexer.ts";
import { strparse } from "./strtype.ts";
import { intparse } from "./inttype.ts";

interface typedef_members {
    name:string,
    typef:string,
    def:any
}

interface typedef_struct {
    name: string,
    type: "typedef",
    items: Array<typedef_members>
}

async function restrict_init(content:string): Promise<void> {
    const decl:string = content.split("=")[0];
    const def:string = content.split(decl)[1].split("=")[1].trim();
    const type:string = decl.split("restrict")[1].trim().split(" ")[0].trim();
    const name:string = decl.split("restrict")[1].trim().split(" ")[1].trim();
    let parseddefs:Array<any> = [];
    if (type === "string") {
        let instr:boolean = false;
        let typearr:any = [];
        let dynamic_stack:any = [];
        for (let i = 0; i < def.length; i++) {
            if (def[i] === "\"" && instr === false) {
                instr = true;
                dynamic_stack.push(def[i]);
            } else if (def[i] === "\"" && instr === true && def[i-1] !== "\\"){ 
                instr = false;
                dynamic_stack.push(def[i]);
            } else if (instr === false && def[i] === "|") {
                typearr.push(dynamic_stack.join(""));
                dynamic_stack = [];
            } else dynamic_stack.push(def[i]);
        } typearr.push(dynamic_stack.join(""));
        for (let i = 0; i < typearr.length; i++) {
            parseddefs.push(await strparse(typearr[i],false));
        }
    } else if (type === "int") {
        const items:Array<any> = def.split("|");
        for (let i = 0; i < items.length; i++) {
            parseddefs.push(await intparse(items[i].trim()));
        }
    }
    RESTRICT_TYPE_STACK.push([type,name,parseddefs]);
}

async function typedef_init(content:string, doc:any): Promise<number> {
    let types:Array<typedef_members> = [];
    let restype:"restrict"|"typedef"|"" = "";
    let def:any;
    const name:string = content.split("{")[0].split("typedef")[1].trim();
    const execution_data = doc.substring(BRACE_SYSTEM.locate_opening_bracket(content, doc)[0] + 1, BRACE_SYSTEM.locate_opening_bracket(content, doc)[1]).trim();
    const exec_split = execution_data.split(";");
    for (let i = 0; i < exec_split.length; i++) {
        const type = exec_split[i].trim().split(" ")[0].trim();
        if (type.startsWith("*")) {
            let loc:boolean = false;
            for (let i2 = 0; i2 < RESTRICT_TYPE_STACK.length; i2++) {
                if (RESTRICT_TYPE_STACK[i2][1].trim() === type.split("*")[1].trim()) {
                    loc = true;
                    restype = "restrict";
                    break;
                }
            }
            if (loc === false) {
                for (let i2 = 0; i2 < TYPEDEF_STRUCT_STACK.length; i2++) {
                    if (TYPEDEF_STRUCT_STACK[i2].name.trim() === type.split("*")[1].trim()) {
                        loc = true;
                        restype = "typedef";
                        def = TYPEDEF_STRUCT_STACK[i2].items;
                        break;
                    }
                }
            }
            if (loc === false) errorf(content, "Nondefault type restriction not found", type.split("*")[1].trim());
            const nondef_push:typedef_members = {
                typef: type,
                name: exec_split[i].split(type)[1].trim(),
                def: undefined
            }
            if (restype !== "typedef") types.push(nondef_push);
            else {
                const typesub:typedef_members = {
                    typef: type,
                    name: exec_split[i].split(type)[1].trim(),
                    def: def
                }
                types.push(typesub);
            }
        } else {
            if (type !== "") {
                const push_default:typedef_members = {
                    typef: type,
                    name: exec_split[i].split(type)[1].trim(),
                    def: undefined
                }
                types.push(push_default);
            }
        }
    }
    const pushmemb:typedef_struct = {
        name: name,
        type:"typedef",
        items: types
    }
    TYPEDEF_STRUCT_STACK.push(pushmemb);
    console.log
    return execution_data.split(";").length;
}

async function typecall_init(content:string): Promise<void> {
    const type:string = content.split("*")[1].trim().split(" ")[0].trim();
    let ineq:boolean = false;
    let def:any = [];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === "=") ineq = true;
        else if (ineq === true) def.push(content[i]);
    }
    for (let i = 0; i < RESTRICT_TYPE_STACK.length; i++) {
        if (RESTRICT_TYPE_STACK[i][1] === type) {
            if (RESTRICT_TYPE_STACK[i][0] === "string") {
                let dec:boolean = false;
                let val:any;
                for (let i2 = 0; i2 < RESTRICT_TYPE_STACK[i][2].length; i2++) {
                    if (await strparse(def.join("").trim(),false) === RESTRICT_TYPE_STACK[i][2][i2].trim()) {
                        dec = true;
                        val = RESTRICT_TYPE_STACK[i][2][i2].trim();
                        break;
                    }
                }
                if (dec === false) errorf(content, "Value does not conform to set restriction", def.join("").trim());
                STRTYPE_DEF_STACK.push([val,content.split(type)[1].split("=")[0].trim()]);
                return;
            } else if (RESTRICT_TYPE_STACK[i][0].trim() === "int") {
                let dec:boolean = false;
                let val:any;
                for (let i2 = 0; i2 < RESTRICT_TYPE_STACK[i][2].length; i2++) {
                    if (await intparse(def.join("").trim()) === RESTRICT_TYPE_STACK[i][2][i2]) {
                        dec = true;
                        val = RESTRICT_TYPE_STACK[i][2][i2];
                        break;
                    }
                }
                if (dec === false) errorf(content, "Value does not conform to set restriction", def.join("").trim());
                INTTYPE_DEF_STACK.push([val,content.split(type)[1].split("=")[0].trim()]);
                return;
            }
        }
    }
    for (let i = 0; i < TYPEDEF_STRUCT_STACK.length; i++) {
        //console.log(TYPEDEF_STRUCT_STACK[i].name,type)
        if (TYPEDEF_STRUCT_STACK[i].name === type) {
            //console.log([content.split(type)[1].trim(),"typedef",type,TYPEDEF_STRUCT_STACK[i].name]);
            OBJECTTYPE_DEF_STACK.push([content.split(type)[1].trim(),"typedef",type,TYPEDEF_STRUCT_STACK[i].name]);
        }
    }
} 

async function typedef_access_init(content:string,typedef:any): Promise<void> {
    let newappend:any = typedef[3];
    let tdef:any;
    let loc:boolean = false;
    let tdefname = typedef[2];
    for (let i = 0; i < TYPEDEF_STRUCT_STACK.length; i++) {
        if (TYPEDEF_STRUCT_STACK[i].name === typedef[2].trim()) {
            loc = true;
            tdef = TYPEDEF_STRUCT_STACK[i];
            break;
        }
    }
    if (loc === false) errorf(content, "ParserError: Stack scan fault");
    const decl:string = content.split("=")[0].trim();
    const define:string = content.split("=")[1].trim();
    const hier:Array<any> = decl.split("->");
    const dest:string =  hier[hier.length - 1].trim();
    console.log(tdef);
    let cur_def:any = tdef[1];
    let pos_arr:Array<number> = [];
    for (let i = 0; i < hier.length; i++) {
        //console.log(hier[i]);
        const member:string = hier[i].trim();
        if (member === typedef[0]) continue;
        for (let i2 = 0; i2 < cur_def.length; i2++) {
            if (cur_def[i2][1] === dest) {
                if (cur_def[i2][0] === "string") {
                    cur_def[i2].push(await strparse(define.trim(),false));
                } else if (cur_def[i2][0] === "int") {
                    cur_def[i2].push(await intparse(define.trim()));
                }
            } else if (cur_def[i2][2] === "typedef") {
                let cont_signal:boolean = false;
                for (let i3=0;i3<cur_def[i2][3][0].length;i3++) {
                    //console.log(cur_def[i2][3][0][i3].trim(), hier[i+1]);
                    if (cur_def[i2][3][0][i3].trim() === hier[i+1]) {
                        pos_arr.push(i2);
                        cur_def = cur_def[i2][3][0];
                        cont_signal=true;
                        break;
                    }
                }
                if (cont_signal === true) break;
            }
        }
    }
    await stackrm(OBJECTTYPE_DEF_STACK,OBJECTTYPE_DEF_STACK.indexOf(typedef),"obj");
    OBJECTTYPE_DEF_STACK.push(["typedef",tdefname,newappend])
}

async function locate_member_typedef(struct:any): Promise<any> {
    let tdef:any;
    for (let i=0;i<OBJECTTYPE_DEF_STACK.length;i++) {
        if (OBJECTTYPE_DEF_STACK[i][1] === "typedef" && OBJECTTYPE_DEF_STACK[i][0].trim() === struct.split("->")[0].trim()) {
            const obj:Array<any> = OBJECTTYPE_DEF_STACK[i][2];
            const las:any = struct.split("->")[struct.split("->").length - 1].trim();
            for (let i = 0; i < obj.length; i++) {
                if (obj[i][0] === las) {
                    return obj[i][1];
                }
            }
        }
    }
}

export { restrict_init,typedef_init,typecall_init,typedef_access_init,locate_member_typedef };