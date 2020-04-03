"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 工具函数集合
 * */
const seedrandom_1 = __importDefault(require("seedrandom"));
let $ = seedrandom_1.default('天下大事，为我所控');
function init(x) {
    $ = seedrandom_1.default(x);
}
exports.init = init;
function random() {
    return $.quick();
}
exports.random = random;
function randInt(beg, end) {
    //获取[beg,end)之间的随机整数
    const sz = end - beg;
    let v = $.int32() % sz;
    if (v < 0)
        v += sz;
    return v + beg;
}
exports.randInt = randInt;
function swap(a, x, y) {
    //交换数组a中x处和y处的元素
    const temp = a[x];
    a[x] = a[y];
    a[y] = temp;
}
exports.swap = swap;
function shuffle(a) {
    for (let i = 0; i < a.length; i++)
        swap(a, i, randInt(i, a.length));
}
exports.shuffle = shuffle;
function remove(a, removing) {
    //移除数组a中的removing
    for (const i of removing) {
        if (!i)
            throw new Error('removing what');
        const ind = a.indexOf(i);
        if (ind === -1)
            throw new Error(`removing non-exist element ${i}`);
        a.splice(ind, 1);
    }
}
exports.remove = remove;
function getCount(a, ele) {
    //获取数组a中元素ele的个数
    return a.reduce((o, n) => o + (n === ele ? 1 : 0), 0);
}
exports.getCount = getCount;
function ll(n) {
    //创建一个二维列表，第一维有n个元素
    const a = new Array(n);
    for (let i = 0; i < n; i++)
        a[i] = [];
    return a;
}
exports.ll = ll;
function li(n, value) {
    //创建一个含n个元素的一维数组，用value填充
    const a = new Array(n);
    for (let i = 0; i < n; i++)
        a[i] = value;
    return a;
}
exports.li = li;
function randChoose(a) {
    //从数组a中随机选取一个元素
    return a[randInt(0, a.length)];
}
exports.randChoose = randChoose;
function flat(a) {
    //把数组a展平
    let b = [];
    for (let i of a) {
        if (i instanceof Array) {
            b = b.concat(flat(i));
        }
        else {
            b.push(i);
        }
    }
    return b;
}
exports.flat = flat;
function range(n) {
    return {
        forEach(callback) {
            for (let i = 0; i < n; i++)
                callback(i);
        },
        map(callback) {
            const ans = [];
            for (let i = 0; i < n; i++) {
                ans.push(callback(i));
            }
            return ans;
        }
    };
}
exports.range = range;
function deepcopy(o) {
    return JSON.parse(JSON.stringify(o));
}
exports.deepcopy = deepcopy;
