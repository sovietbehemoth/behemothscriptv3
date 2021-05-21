import { isfunction } from "../def.ts";
import { errorf } from "../lexer.ts";
import { intparse } from "../variables/inttype.ts";
import { strparse } from "../variables/strtype.ts";
import { initsys } from "../preprocessor/imports.ts";
import { CLASSTYPE_DEF_STACK } from "../lexer.ts";
import { OBJECTTYPE_DEF_STACK } from "../lexer.ts";
import type { class_init_pushed } from "../variables/classtype.ts";

let EXIT_CODE:number;

//**Internal compiler calls (exit(), error(), etc) */
async function compiler_call(content:string): Promise<any> {
    if (await isfunction(content) === true) {
        const funcname:string = content.split("(")[0].trim();
        let instr: any = "false";
        let argarray: Array<any> = [];
        let curmemb:any = [];
        let dataf:string = content.substring(content.indexOf("(")+1,content.lastIndexOf(')'));
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
        switch (funcname) {
            case "exit":
                EXIT_CODE = await intparse(argarray[0].trim());
                Deno.exit();
                break;
            case "error_noexit":
                await errorf(await strparse(argarray[0],false),await strparse(argarray[1],false), await strparse(argarray[2],false), await strparse(argarray[3],false),false);
                break;
            case "error_exit":
                await errorf(await strparse(argarray[0],false),await strparse(argarray[1],false), await strparse(argarray[2],false), await strparse(argarray[3],false),true);
                break;
            case "error_create":
                console.log(`%cError:%c ${await strparse(argarray[0],true)}`,'color: red; font-weight: bold','color: auto');
                break;
        }
    }
}

async function os_class_call(content:string, data:any): Promise<any> {
    if (await isfunction(content) === true) {
        const funcname:string = content.split("(")[0].trim();
        let instr: any = "false";
        let argarray: Array<any> = [];
        let curmemb:any = [];
        let dataf:string = content.substring(content.indexOf("(")+1,content.lastIndexOf(')'));
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
        switch (funcname) {
            case "SystemShutdown":
                const sub = Deno.run({cmd:[
                    "python3",
                    "./libs/sys_externs.py",
                    "SystemShutdown"
                ]});
                await sub;
                break;
        }
    } else {
        //console.log(content);
    }
}

//**Performs http requests */
async function http_call(content:string, data:any): Promise<any> {
    if (await isfunction(content) === true) {
        const funcname:string = content.split("(")[0].trim();
        let instr: any = "false";
        let argarray: Array<any> = [];
        let curmemb:any = [];
        let dataf:string = content.substring(content.indexOf("(")+1,content.lastIndexOf(')'));
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
        //console.log(funcname);
        switch (funcname) {
            case "get":
                if (argarray[1] === undefined) { 
                    const res:Response = await fetch(await strparse(argarray[0],true)).catch(async (error): Promise<any> => {
                        await errorf(data, error.toString().split("TypeError:")[1].trim(),argarray[0]);
                    });
                    let classval:any = [];
                    for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
                       // console.log(`${OBJECTTYPE_DEF_STACK[i].name} ${OBJECTTYPE_DEF_STACK[i].class.name}`);
                        //console.log(await res.text())
                        if (OBJECTTYPE_DEF_STACK[i].name === "http_ret" && OBJECTTYPE_DEF_STACK[i].class.name === "__httpgetresponse__") {
                            OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.push(res.status);
                            
                            OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.push(await res.text()); 

                            OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.push(res.url)                          
                            return OBJECTTYPE_DEF_STACK[i];                    
                            break;
                        }
                    }
                } else {
                    const header_json = JSON.parse(await strparse(argarray[1].trim(),true));
                    const res:Response = await fetch(await strparse(argarray[0],true), {headers:header_json}).catch(async (error): Promise<any> => {
                        await errorf(data, error.toString().split("TypeError:")[1].trim(),argarray[0]);
                    });   
                    for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
                        // console.log(`${OBJECTTYPE_DEF_STACK[i].name} ${OBJECTTYPE_DEF_STACK[i].class.name}`);
                         //console.log(await res.text())
                         if (OBJECTTYPE_DEF_STACK[i].name === "http_ret" && OBJECTTYPE_DEF_STACK[i].class.name === "__httpgetresponse__") {
                            OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.push(res.status);
                            
                            OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.push(await res.text()); 
   
                            OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.push(res.url)    
                            
                            OBJECTTYPE_DEF_STACK[i].class.members.string[2].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[2].value.push(res.headers);
   
                            OBJECTTYPE_DEF_STACK[i].class.members.string[3].value.pop();
                            OBJECTTYPE_DEF_STACK[i].class.members.string[3].value.push(await strparse(argarray[1].trim(),true));                        
                             return OBJECTTYPE_DEF_STACK[i];                    
                             break;
                         }
                     }
                }
                break;
            case "post":
                //const headers:any = await JSON.parse(JSON.stringify(await strparse(argarray[2].trim(),true)));
                const headers:any = JSON.parse(await strparse(argarray[2],true));
                const content:any = JSON.parse(await strparse(argarray[1],true));
                const res:Response = await fetch(await strparse(argarray[0],true), {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(content)
                }).catch(async (error): Promise<any> => {
                    await errorf(data, error.toString().split("TypeError:")[1].trim(),argarray[0]);
                });
                for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
                    // console.log(`${OBJECTTYPE_DEF_STACK[i].name} ${OBJECTTYPE_DEF_STACK[i].class.name}`);
                     if (OBJECTTYPE_DEF_STACK[i].name === "http_ret" && OBJECTTYPE_DEF_STACK[i].class.name === "__httpgetresponse__") {
                         OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.pop();
                         OBJECTTYPE_DEF_STACK[i].class.members.int[0].value.push(res.status);
                         
                         OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.pop();
                         OBJECTTYPE_DEF_STACK[i].class.members.string[0].value.push(await res.text()); 

                         OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.pop();
                         OBJECTTYPE_DEF_STACK[i].class.members.string[1].value.push(res.url)    
                         
                         OBJECTTYPE_DEF_STACK[i].class.members.string[2].value.pop();
                         OBJECTTYPE_DEF_STACK[i].class.members.string[2].value.push(JSON.stringify(headers));

                         OBJECTTYPE_DEF_STACK[i].class.members.string[3].value.pop();
                         OBJECTTYPE_DEF_STACK[i].class.members.string[3].value.push(await strparse(argarray[1].trim(),true));

                         return OBJECTTYPE_DEF_STACK[i];                    
                         break;
                     }
                 }
            break;
        }
    }
}

export { compiler_call, http_call, os_class_call };