"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
function compareKey(toInt) {
    return (x, y) => {
        return toInt(x) - toInt(y);
    };
}
exports.compareKey = compareKey;
class Topk {
    constructor(size, comparer) {
        this.size = size;
        this.a = new Array(this.size + 1);
        this.count = 0;
        this.comparer = comparer;
    }
    up(i) {
        //把节点往上移动
        while (1) {
            const f = i >> 1;
            if (f == 0)
                return;
            if (this.comparer(this.a[i], this.a[f]) < 0) {
                Utils_1.swap(this.a, i, f);
            }
            i = f;
        }
    }
    down(i) {
        //把节点往下移动
        while (1) {
            let l = i << 1, r = i << 1 | 1;
            if (l > this.count)
                return;
            if (r <= this.count)
                l = this.comparer(this.a[l], this.a[r]) > 0 ? r : l;
            if (this.comparer(this.a[i], this.a[l]) > 0) {
                Utils_1.swap(this.a, l, i);
            }
            i = l;
        }
    }
    push(x) {
        if (this.count < this.size) {
            this.a[++this.count] = x;
            this.up(this.count);
        }
        else {
            if (this.comparer(x, this.a[1]) > 0) {
                this.a[1] = x;
                this.down(1);
            }
        }
    }
    toList() {
        return this.a.slice(1, this.count + 1);
    }
}
exports.Topk = Topk;
