import { lexer_init } from "./lexer.ts";

const feed = await Deno.readTextFile("./main.bhs");
const parse = feed.replace(/[\r\n]+/gm, " ");
await lexer_init(parse, "main");