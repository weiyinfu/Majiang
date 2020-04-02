"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function randInt(beg, end) {
    //获取[beg,end)之间的随机整数
    return Math.floor(Math.random() * (end - beg)) + beg;
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
    for (var i = 0; i < a.length; i++)
        swap(a, i, randInt(i, a.length));
}
exports.shuffle = shuffle;
function remove(a, removing) {
    //移除数组a中的removing
    for (const i of removing) {
        if (!i)
            throw 'baga';
        const ind = a.indexOf(i);
        if (ind === -1)
            throw `removing non-exist element ${i}`;
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
    const a = [];
    for (let i = 0; i < n; i++)
        a.push(i);
    return a;
}
exports.range = range;
function deepcopy(o) {
    return JSON.parse(JSON.stringify(o));
}
exports.deepcopy = deepcopy;
