import { lexer_init, errorf } from "./lexer.ts";

const file = Deno.args[0].trim();
let feed;

if (!file.trim().endsWith(".bhs") && !file.trim().endsWith(".bhsh")) {
    await errorf(file, "Invalid file extension", file.split(".")[file.split(".").length - 1], "BehemothScript", true)
}

try {
    feed = await Deno.readTextFile(file);
} catch {
    await errorf(file, "File not found", file, "BehemothScript", true);
}
const parse = feed.replace(/[\r\n]+/gm, " ");
await lexer_init(parse, "main");