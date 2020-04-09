"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Topk_1 = require("../majiang/util/Topk");
const seedrandom_1 = __importDefault(require("seedrandom"));
class Node {
    constructor(x) {
        this.x = x;
    }
}
const com = (x, y) => {
    return x.x - y.x;
};
const q = new Topk_1.Topk(5, com);
const ele = [];
const $ = seedrandom_1.default();
for (let i = 0; i < 20; i++) {
    const x = $.int32() % 100;
    ele.push(x);
    q.push(new Node(x));
    console.log('pushing', x, q.toList().map(x => x.x).join(','));
}
ele.sort();
console.log(ele);
console.log(q.toList());
