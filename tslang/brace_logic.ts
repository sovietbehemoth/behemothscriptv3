import {__DEBUG__} from "./lexer.ts";

let RIGHT_BRACE_STACK:Array<any> = [];
let LEFT_BRACE_STACK:Array<any> = [];


function bracer(bracesF:any):any {
    var braces = bracesF;
    var open = [];
    var close = [];
    for (let i = 0; braces.length > 0; i++) {
        if (braces[i] === undefined || braces.length === 0) break;
        else
        if (braces[i].startsWith("{")) {
            if (braces[i + 1].startsWith("}")) {
                var j = i + 1;
                open.push(braces[i]);
                close.push(braces[i + 1]);
                braces.splice(i, 1);
                braces.splice(j - 1, 1);
            }
        }
    }
    for (let i2 = 0; i2 < open.length; i2++) LEFT_BRACE_STACK.push(open[i2]);
    for (let i3 = 0; i3 < close.length; i3++) RIGHT_BRACE_STACK.push(close[i3]);
    var pair = [ open, close, braces ];
    return pair;
}

function bracer_master(fulldocument:any) {
    var BRACE_LIST = [];
    var BRACE_POS = [];

    const mapcb = fulldocument.trim().split('');
    for (let i = 0; i < mapcb.length; i++) {
        if (mapcb[i] === "{") {
            BRACE_LIST.push("{:" + i); BRACE_POS.push(i);
        } else if (mapcb[i] === "}") {
            BRACE_LIST.push("}:" + i); BRACE_POS.push(i);
        }
    }
    var req = bracer(BRACE_LIST);
    var l = [ req[0] ];
    var r = [ req[1] ];
    var full = req[2];
    while (full.length > 1) {
        full = bracer(full)[2];
        l.push(bracer(full)[0]);
        r.push(bracer(full)[1]);
    }
    if (__DEBUG__ === true) console.log("Performed brace pairing logic");
}

//[ {, {, }, } ]
function locate_opening_bracket(content:any, fulldocument:any):any {
    var count;
    var positionofbrace;
    var closingbrace;
    var contents = fulldocument.slice(fulldocument.indexOf(content), fulldocument.length)
    if (fulldocument.length >= contents.length) count = fulldocument.length - contents.length + contents.indexOf("{");
    const pos = count;
    for (let i = 0; i < LEFT_BRACE_STACK.length; i++) {
        var posF = LEFT_BRACE_STACK[i].split(":")[1];
        if (parseInt(posF) === pos) {
            positionofbrace = pos;
            closingbrace = RIGHT_BRACE_STACK[i].split(":")[1];
        } 
    }
    return [ positionofbrace, closingbrace ];
}

export { locate_opening_bracket, bracer, bracer_master };