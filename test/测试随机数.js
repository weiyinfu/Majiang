"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const seedrandom_1 = __importDefault(require("seedrandom"));
/**
 * seedrandom这个库有三个函数，int32，quick，double，分别生成int32，float，double
 * 实验证明，seedrandom这个库生成随机数比较缓慢，比Math.random慢
 * */
function go(x, caseCount) {
    const beg = new Date();
    for (let i = 0; i < caseCount; i++) {
        x();
    }
    const end = new Date();
    return end.getTime() - beg.getTime();
}
function test1() {
    for (let i = 0; i < 2; i++) {
        const x = seedrandom_1.default('hello');
        console.log(x);
        console.log(x.int32());
        console.log(x.quick());
        console.log(x.double());
    }
}
const x = seedrandom_1.default();
for (let f of [x.quick, Math.random]) {
    const time = go(f, 10000000);
    console.log(f.name, time);
}
