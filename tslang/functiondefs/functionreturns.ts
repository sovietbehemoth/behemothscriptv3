import { STRTYPE_DEF_STACK, RETURNSTACK_ARR } from "../lexer.ts";
import { isfunction } from "../def.ts";
import { strparse } from "../variables/strtype.ts"

//**Function returns, TODO: implement other types */
async function returns_init(func: Array<any>, content:string): Promise<void> {
    const rettype = func[2];
    switch (rettype) {
        case "string":
            const decl:string = content.split("return")[1].trim();
            if (await isfunction(content.split("return")[1].trim()) === true) {

            } else if (content.split("return")[1].trim().startsWith('"')) {
                const pushf:any = await strparse(decl, false);
                RETURNSTACK_ARR.push([func[0], pushf]);
            } else {
                for (let i = 0; i < STRTYPE_DEF_STACK.length; i++) {
                    if (STRTYPE_DEF_STACK[i][1].trim() === decl) {
                        RETURNSTACK_ARR.push([func[0], STRTYPE_DEF_STACK[i][0]]);
                        return;
                    }
                }
            }
            break;
    }
}

export { returns_init };