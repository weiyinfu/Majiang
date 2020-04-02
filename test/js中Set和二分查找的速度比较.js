"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../js/Utils");
/**
 * 结论：当元素个数较少时，set比较快
 * 当元素个数较多时，二分查找比较快
 * 总体上看两者速度差不多
 * */
const MAXN = 10000000;
const n = 200000; //字典中元素个数
const q = 100000; //查询次数
const a = Utils_1.range(n).map(x => Utils_1.randInt(0, MAXN));
const querys = Utils_1.range(q).map(x => Utils_1.randInt(0, MAXN));
const set = new Set(a);
const b = Array.from(set).sort();
console.log(`查询次数${querys.length}
元素个数:${set.size}
`);
function bisearch(x) {
    if (b[b.length - 1] < x)
        return false;
    if (b[0] > x)
        return false;
    let l = 0, r = b.length;
    let mid = 0;
    while (l + 1 < r) {
        mid = (l + r) >> 1;
        if (b[mid] < x) {
            l = mid + 1;
        }
        else {
            r = mid;
        }
    }
    return b[l] == x || b[r] === x;
}
function main() {
    let beg = new Date().getTime();
    for (let i of querys) {
        const x = Utils_1.randInt(0, MAXN);
        const ans = set.has(x);
    }
    let end = new Date().getTime();
    console.log(`集合用时${end - beg}ms`);
    beg = new Date().getTime();
    for (let i of querys) {
        const x = Utils_1.randInt(0, MAXN);
        const ans = bisearch(x);
    }
    end = new Date().getTime();
    console.log(`二分查找用时${end - beg}ms`);
}
main();
