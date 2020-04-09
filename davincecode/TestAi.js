"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 测试AI的正确性
 * AI必须迭代才能求出最佳结果
 * */
const Card_1 = require("./Card");
const Utils_1 = require("../majiang/util/Utils");
const Ai_1 = require("./Ai");
const hand = [
    '黑1,黑2,黑未知,黑6'.split(','),
    '黑3,黑未知,白4'.split(','),
];
const pile = Card_1.getCards();
Utils_1.remove(pile, hand[0].filter(x => !Card_1.isUnknown(x)));
Utils_1.remove(pile, hand[1].filter(x => !Card_1.isUnknown(x)));
Utils_1.remove(pile, ['黑4', '黑5']);
hand.push(pile);
console.log(hand);
const advice = Ai_1.getAdvice(hand, []);
console.log(0, 2, advice[0][2]);
console.log(1, 1, advice[1][1]);
