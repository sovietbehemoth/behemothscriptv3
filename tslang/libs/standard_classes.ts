import { isfunction } from "../def.ts";

async function compiler_call(content:string): Promise<void> {
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
            
        }
    }
}

export { compiler_call };