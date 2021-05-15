import {__DEBUG__} from "./lexer.ts";


class brace_master {
    private RIGHT_BRACE_STACK:Array<any> = [];
    private LEFT_BRACE_STACK:Array<any> = [];


    private bracer(bracesF:any):any {
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
        for (let i2 = 0; i2 < open.length; i2++) this.LEFT_BRACE_STACK.push(open[i2]);
        for (let i3 = 0; i3 < close.length; i3++) this.RIGHT_BRACE_STACK.push(close[i3]);
        var pair = [ open, close, braces ];
        return pair;
    }

    constructor(fulldocument:any) {
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
        var req = this.bracer(BRACE_LIST);
        var l = [ req[0] ];
        var r = [ req[1] ];
        var full = req[2];
        while (full.length > 1) {
            full = this.bracer(full)[2];
            l.push(this.bracer(full)[0]);
            r.push(this.bracer(full)[1]);
        }
        if (__DEBUG__ === true) console.log("Performed brace pairing logic");
    }

    //[ {, {, }, } ]
    public locate_opening_bracket(content:any, fulldocument:any):any {
        var count;
        var positionofbrace;
        var closingbrace;
        var contents = fulldocument.slice(fulldocument.indexOf(content), fulldocument.length)
        if (fulldocument.length >= contents.length) count = fulldocument.length - contents.length + contents.indexOf("{");
        const pos = count;
        for (let i = 0; i < this.LEFT_BRACE_STACK.length; i++) {
            var posF = this.LEFT_BRACE_STACK[i].split(":")[1];
            if (parseInt(posF) === pos) {
                positionofbrace = pos;
                closingbrace = this.RIGHT_BRACE_STACK[i].split(":")[1];
            } 
        }
        return [ positionofbrace, closingbrace ];
    }

    public clear_bracer(): any {
        const RB:any = this.RIGHT_BRACE_STACK;
        const LB:any = this.LEFT_BRACE_STACK;
        this.RIGHT_BRACE_STACK = [];
        this.LEFT_BRACE_STACK = [];
        return [RB,LB];
    }

    public redef_bracer(brace_stacks:any): any {
        this.RIGHT_BRACE_STACK = brace_stacks[0];
        this.LEFT_BRACE_STACK = brace_stacks[1];
    }
}

export default brace_master;