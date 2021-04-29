import { preprocessor_linker } from "./preprocessor.ts";
import { IMPORT_DEF_STACK, __DEBUG__ } from "../lexer.ts";


//**file inclusion */ 
async function read_file_prep(content: string) {
    if (__DEBUG__ === true) console.log("Performing file import...");
    const importp:string = content.split(" ")[1].trim();
    if (content.includes('"')) {
        const path:string = content.split('"')[1].split('"')[0].trim();
        const feed:any = Deno.readTextFile(path);
        feed.then((buffer:any) => {
            if (__DEBUG__ === true) console.log(`Opened FileStream for local import '${path}'`);
            const compile:string = buffer.replace(/[\r\n]+/gm, ";").split(";");
            for (let i=0;i<compile.length;i++) {
                preprocessor_linker(compile[i]);
            }
        });
    } else {
        //assume to be an internal file
        const importf:string = importp.substring(1, importp.length - 1);
        const __intern__:any = new Boolean(importf === "standard" || importf === "websocket" || importf === "requests");
        if (__intern__ != true) throw "PreprocessorError: Unrecognized internal import"; else {
            switch (importf) {
                case "standard":
                    if (__DEBUG__ === true) console.log("Importing standard library");
                    IMPORT_DEF_STACK.push([importf, true]);
                    const feed:any = await Deno.readTextFile("./libs/standard.bhs");
                    if (__DEBUG__ === true) console.log(`Opened FileStream for internal import '${importf}'`);
                    const compile:string = feed.replace(/[\r\n]+/gm, ";").split(";");
                    for (let i=0;i<compile.length;i++) {
                        //console.log(compile[i])
                        preprocessor_linker(compile[i]);
                    }
                    break;
            }
        }
    }
}

export { read_file_prep }
