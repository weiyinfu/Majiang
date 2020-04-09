"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Card_1 = require("../../core/Card");
/**
 * 事他娘judger，执行各种校验。
 * 正常的judger在执行前后应该不改变State
 * */
class TrivalJudger {
    constructor(judger) {
        this.judger = judger;
    }
    judge(state, hand) {
        if (hand.length % 3 !== 1)
            throw new Error(`手牌个数应该模三余一 ${hand.join(',')}`);
        Card_1.sortCards(hand);
        const before = JSON.stringify([state, hand]);
        const res = this.judger.judge(state, hand);
        Card_1.sortCards(hand);
        const after = JSON.stringify([state, hand]);
        if (before !== after)
            throw new Error(`Greedy Judger前后State不一样`);
        return res;
    }
    getName() {
        return TrivalJudger.name;
    }
}
exports.TrivalJudger = TrivalJudger;
