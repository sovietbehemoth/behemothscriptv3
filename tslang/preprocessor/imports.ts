import { preprocessor_linker } from "./preprocessor.ts";
import { IMPORT_DEF_STACK, __DEBUG__, errorf } from "../lexer.ts";
import { lexer_init, lexer_exec } from "../lexer.ts";
import { INIT_HEADER_COMPILE, INIT_FILE_COMPILE } from "../INITFLAGS.js";

let InitBHSText:string;

interface sysinfo {
    os: string,
    machine: string,
}

let initsys:sysinfo;

//**file inclusion */ 
async function read_file_prep(content: string,doc:any) {
    if (__DEBUG__ === true) console.log("Performing file import...");
    const importp:string = content.split(" ")[1].trim();
    if (content.includes('"')) {
        const path:string = content.split('"')[1].split('"')[0].trim();
        const feed:any = Deno.readTextFile(path);
        feed.then((buffer:any) => {
            if (__DEBUG__ === true) console.log(`Opened FileStream for local import '${path}'`);
            const compile:string = buffer.replace(/[\r\n]+/gm, ";").split(";");
            for (let i=0;i<compile.length;i++) {
                preprocessor_linker(compile[i],doc);
            }
        });
    } else {
        //assume to be an internal file
        const importf:string = importp.substring(1, importp.length - 1);
        const __intern__:any = new Boolean(importf === "standard" || importf === "websocket" || importf === "requests" || importf === "system");
        if (__intern__ != true) errorf(content, "Unrecognized internal import", importf, "PreprocessorError"); else {
            switch (importf) {
                case "standard":
                    if (INIT_HEADER_COMPILE === true) {
                        if (__DEBUG__ === true) console.log("Importing standard library");
                        IMPORT_DEF_STACK.push([importf, true]);
                        const feed:any = await Deno.readTextFile("./libs/standard.bhsh");
                        if (__DEBUG__ === true) console.log(`Opened FileStream for internal import '${importf}'`);
                        const compile:string = feed.replace(/[\r\n]+/gm, ";").split(";");
                        for (let i=0;i<compile.length;i++) {
                            //console.log(compile[i])
                            await preprocessor_linker(compile[i],doc);
                        }
                    } if (INIT_FILE_COMPILE === true) {
                        const implf:any = await Deno.readTextFile("./libs/__init__.bhs");
                        InitBHSText = implf;
                        await lexer_init(implf,"import");
                    }
                    break;
                case "system":
                    const rimpl:any = await Deno.readTextFile("./libs/os.bhs");
                    await lexer_init(rimpl,"import");
                    const get_platform_pipe = await Deno.run({cmd: ["python3","./libs/sys_externs.py","SystemStandardInit"], stdout:"piped"});
                    const get_platform_decode = new TextDecoder().decode(await get_platform_pipe.output());
                    const systeminfo = get_platform_decode.split(",");
                    const os_name = systeminfo[0];
                    const machine_name = systeminfo[1];
                    initsys = {
                        os:os_name,
                        machine: machine_name,
                    }
                    await lexer_exec(`sys.os = "${initsys.os}"`,doc,"preprocessing");
                    await lexer_exec(`sys.machine = "${initsys.machine.replace(/[\r\n]+/gm, "")}"`,doc,"preprocessing");
                    break;
            }
        }
    }
}

export { read_file_prep, InitBHSText, initsys };