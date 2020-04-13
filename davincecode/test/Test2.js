"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 测试AI的正确性
 * AI必须迭代才能求出最佳结果
 * */
const SimpleSolver_1 = require("../solver/SimpleSolver");
const DeepSolver_1 = require("../solver/DeepSolver");
const Card_1 = require("../Card");
const hand = [
    '黑未知,黑3'.split(','),
    '黑未知,黑4'.split(','),
    '黑未知,黑6'.split(','),
];
// const pile = getCards();
// remove(pile, hand[0].filter(x => !isUnknown(x)));
// remove(pile, hand[1].filter(x => !isUnknown(x)));
// hand.push(pile);
console.log(hand);
// const advice = getAdvice(hand, [])
// console.log(advice);
console.log(SimpleSolver_1.getOptions(hand, new Set(), 0, 1, []));
for (let i = 0; i < 3; i++) {
    console.log(i);
    console.log(SimpleSolver_1.getOptions(hand, new Set(), i, 0, []).map(x => Card_1.C.byOrdinal(x).name));
}
const simple = new SimpleSolver_1.SimpleSolver();
console.log(`=======advice====`);
console.log(simple.getAdvice(hand, []));
const deep = new DeepSolver_1.DeepSolver();
console.log(deep.getAdvice(hand, []));
