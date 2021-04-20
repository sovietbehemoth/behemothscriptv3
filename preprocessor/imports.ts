import { preprocessor_linker } from "./preprocessor.ts";


function read_file_prep(content: string): void {
    const importp:string = content.split(" ")[1].trim();
    if (content.includes('"')) {
        const path:string = content.split('"')[1].split('"')[0].trim();
        const feed:any = Deno.readTextFile(path);
        feed.then((buffer:any) => {
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
                    const feed:any = Deno.readTextFile("./libs/standard.bhs");
                    feed.then((buffer:any) => {
                        const compile:string = buffer.replace(/[\r\n]+/gm, ";").split(";");
                        for (let i=0;i<compile.length;i++) {
                            preprocessor_linker(compile[i]);
                        }
                    })
                    break;
            }
        }
    }
}

export { read_file_prep }
