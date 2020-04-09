"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../majiang/util/Utils");
const BigTableHu_1 = require("../majiang/hu/BigTableHu");
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
        const ans = BigTableHu_1.bisearch(x, b);
    }
    end = new Date().getTime();
    console.log(`二分查找用时${end - beg}ms`);
}
main();
