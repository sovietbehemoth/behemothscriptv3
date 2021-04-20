import { lexer_init } from "./lexer.ts";

const parse = `
`.replace(/[\r\n]+/gm, " ");

lexer_init(parse);
