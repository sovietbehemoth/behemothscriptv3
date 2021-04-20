import { lexer_init, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK } from "../lexer.ts";

function function_call_init(func:Array<any>, content:string):void {
    let exec:string = "";
    if (func[1][0] != "void") {
        let argcount:number=0;
        let paramcount:number=0;

        const args = content.substring(content.indexOf("(")+1, content.indexOf(")")).split(",");
        for (let i = 0; i < func[1].length; i++) {
            const typels = func[1][i].split(" ");
            if (typels[1].startsWith("?") && args[i] === undefined) {
                exec = exec + `${typels[0]} ${typels[1]};\n`
            } else {
                exec = exec + `${typels[0]} ${typels[1]} = ${args[i]};\n`;
            }
        }
        
    } else {

    }
    exec = exec + func[3][0];
    lexer_init(exec, "scope/func", func, FUNCTION_DEF_STACK, STRTYPE_DEF_STACK);
}

export { function_call_init };
