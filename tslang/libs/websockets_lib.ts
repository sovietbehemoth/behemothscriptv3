import { OBJECTTYPE_DEF_STACK, errorf } from "../lexer.ts";
import { strparse } from "../variables/strtype.ts";
import { isfunction } from "../def.ts";
import { FUNCTION_DEF_STACK } from "../lexer.ts";
import { function_call_init } from "../functiondefs/functioncall.ts";
import { STRTYPE_DEF_STACK } from "../lexer.ts";
import { stackrm } from "../lexer.ts";

interface ws_type {
    name: string,
    type: "websocket",
    wsobj: WebSocket
}

async function websocket_constructor_init(name: string, params:Array<any>): Promise<void> {
    let objf:any;
    for (let i = 0; i < OBJECTTYPE_DEF_STACK.length; i++) {
        if (OBJECTTYPE_DEF_STACK[i].name === name && OBJECTTYPE_DEF_STACK[i].type === "classinit") {
            objf = OBJECTTYPE_DEF_STACK[i];
        }
    }
    const url:string = await strparse(params[0].trim(), true);
    //try {
        const ws = new WebSocket(url);
        const obj:ws_type = {
            name: name,
            type: "websocket",
            wsobj: ws
        };
        objf.class.members.object.push(obj);

        //console.log(objf.class.members.object)
    //} catch (error) {
    //    await errorf(name, error.text,name);
    //}
}

async function socket_method_handler(socket:WebSocket, method:any): Promise<any> {
    if (await isfunction(method) === true) {
        const methodval:string = method.split("(")[0].trim();
        const dataf = method.substring(method.indexOf("(")+1,method.lastIndexOf(')'));
                let instr:string = "false";
                let curmemb = [];
                let argarray = [];
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
                } argarray.push(curmemb.join("").trim())
        switch (methodval) {
            case "send":
                const jsonform:any = JSON.parse(await strparse(argarray[0].trim(),true));
                socket.send(jsonform);
                break;
            case "onopen":
                const callback_open = argarray[0].trim();
                for (let i = 0; i < FUNCTION_DEF_STACK.length; i++) {
                    if (FUNCTION_DEF_STACK[i][0].trim() === callback_open) {
                        socket.onopen = await function_call_init(FUNCTION_DEF_STACK[i],`${FUNCTION_DEF_STACK[i][0].trim()}()`);
                    }
                }
                break;
            case "recv":
                const callback_recv = argarray[0].trim();
                for (let i = 0; i < FUNCTION_DEF_STACK.length; i++) {
                    if (FUNCTION_DEF_STACK[i][0].trim() === callback_recv) {
                        socket.onmessage = async(event) => {
                            const pos = STRTYPE_DEF_STACK.push([JSON.stringify(event.data),"WSINC"]);
                            await function_call_init(FUNCTION_DEF_STACK[i],`${FUNCTION_DEF_STACK[i][0].trim()}(WSINC)`);
                            await stackrm(STRTYPE_DEF_STACK,pos,"str");
                        }
                    }
                }
                break;
        }
    }
} 

export { websocket_constructor_init, socket_method_handler };