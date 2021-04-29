import { STRTYPE_DEF_STACK } from "../lexer.ts";

//**Function returns, TODO: implement other types */
async function returns_init(func: Array<any>, content:string): Promise<void> {
    const rettype = func[2];
    switch (rettype) {
        case "string":
            STRTYPE_DEF_STACK.push([content.split("return")[1].trim(), func[0]]);
            break;
    }
}

export { returns_init };
